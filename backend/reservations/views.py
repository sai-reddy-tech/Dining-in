from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils.dateparse import parse_date
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Reservation, WaitlistEntry
from .serializers import ReservationSerializer, WaitlistEntrySerializer
from .waitlist_manager import check_and_promote_waitlist, generate_qr_for_reservation
from restaurants.models import Restaurant, Table

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Reservation.objects.all().order_by('-date', '-time_slot')
        elif user.role == 'owner':
            return Reservation.objects.filter(restaurant__owner=user).order_by('-date', '-time_slot')
        else:
            return Reservation.objects.filter(user=user).order_by('-date', '-time_slot')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user = request.user
        data = request.data
        
        restaurant_id = data.get('restaurant')
        table_id = data.get('table')
        date_str = data.get('date')
        time_slot = data.get('time_slot')
        guests_count = int(data.get('guests_count', 2))
        special_requests = data.get('special_requests', '')

        if not (restaurant_id and date_str and time_slot):
            return Response({"detail": "Restaurant, date, and time_slot are required."}, status=status.HTTP_400_BAD_REQUEST)

        date = parse_date(date_str)
        if not date:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({"detail": "Restaurant not found."}, status=status.HTTP_404_NOT_FOUND)

        table = None
        if table_id:
            try:
                table = Table.objects.get(id=table_id, restaurant=restaurant, is_active=True)
            except Table.DoesNotExist:
                return Response({"detail": "Selected table is invalid or inactive."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Auto-assign suitable table
            available_tables = Table.objects.filter(restaurant=restaurant, capacity__gte=guests_count, is_active=True)
            occupied_table_ids = Reservation.objects.filter(
                restaurant=restaurant,
                date=date,
                time_slot=time_slot,
                status__in=['pending', 'confirmed']
            ).values_list('table_id', flat=True)
            
            suitable_tables = available_tables.exclude(id__in=occupied_table_ids).order_by('capacity')
            if suitable_tables.exists():
                table = suitable_tables.first()
            else:
                return Response({
                    "detail": "No tables available matching your party size. Would you like to join the waitlist?",
                    "waitlist_eligible": True
                }, status=status.HTTP_409_CONFLICT)

        # Verify table availability
        is_occupied = Reservation.objects.filter(
            table=table,
            date=date,
            time_slot=time_slot,
            status__in=['pending', 'confirmed']
        ).exists()
        if is_occupied:
            return Response({
                "detail": f"Table {table.table_number} is already occupied at this time. Would you like to join the waitlist?",
                "waitlist_eligible": True
            }, status=status.HTTP_409_CONFLICT)

        if table.capacity < guests_count:
            return Response({"detail": f"Table capacity ({table.capacity}) is too small for your party size ({guests_count})."}, status=status.HTTP_400_BAD_REQUEST)

        # Create reservation
        reservation = Reservation.objects.create(
            user=user,
            restaurant=restaurant,
            table=table,
            date=date,
            time_slot=time_slot,
            guests_count=guests_count,
            special_requests=special_requests,
            status='confirmed'
        )

        # Generate QR code
        try:
            generate_qr_for_reservation(reservation)
        except Exception as e:
            print("Error generating QR:", e)

        # Notify via WebSockets
        channel_layer = get_channel_layer()
        if channel_layer and table:
            async_to_sync(channel_layer.group_send)(
                f"restaurant_{restaurant.id}_availability",
                {
                    "type": "availability_update",
                    "data": {
                        "table_id": table.id,
                        "table_number": table.table_number,
                        "status": "occupied"
                    }
                }
            )

        serializer = self.get_serializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status == 'cancelled':
            return Response({"detail": "Reservation is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = reservation.restaurant
        table = reservation.table
        date = reservation.date
        time_slot = reservation.time_slot

        reservation.status = 'cancelled'
        reservation.save()

        # Notify WebSocket that table is free
        channel_layer = get_channel_layer()
        if channel_layer and table:
            async_to_sync(channel_layer.group_send)(
                f"restaurant_{restaurant.id}_availability",
                {
                    "type": "availability_update",
                    "data": {
                        "table_id": table.id,
                        "table_number": table.table_number,
                        "status": "free"
                    }
                }
            )

        # Trigger waitlist promotion
        if table:
            check_and_promote_waitlist(restaurant, date, time_slot, table)

        return Response({"detail": "Reservation cancelled successfully."})

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def check_availability(self, request):
        restaurant_id = request.query_params.get('restaurant')
        date_str = request.query_params.get('date')
        time_slot = request.query_params.get('time_slot')

        if not (restaurant_id and date_str and time_slot):
            return Response({"detail": "restaurant, date, and time_slot query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        date = parse_date(date_str)
        if not date:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({"detail": "Restaurant not found."}, status=status.HTTP_404_NOT_FOUND)

        tables = Table.objects.filter(restaurant=restaurant, is_active=True)
        occupied_table_ids = Reservation.objects.filter(
            restaurant=restaurant,
            date=date,
            time_slot=time_slot,
            status__in=['pending', 'confirmed']
        ).values_list('table_id', flat=True)

        results = []
        for table in tables:
            results.append({
                "id": table.id,
                "table_number": table.table_number,
                "capacity": table.capacity,
                "location_tag": table.location_tag,
                "is_occupied": table.id in occupied_table_ids
            })

        return Response(results)

class WaitlistEntryViewSet(viewsets.ModelViewSet):
    serializer_class = WaitlistEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return WaitlistEntry.objects.all().order_by('-created_at')
        elif user.role == 'owner':
            return WaitlistEntry.objects.filter(restaurant__owner=user).order_by('-created_at')
        else:
            return WaitlistEntry.objects.filter(user=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        data = request.data
        
        restaurant_id = data.get('restaurant')
        date_str = data.get('date')
        time_slot = data.get('time_slot')
        guests_count = int(data.get('guests_count', 2))

        if not (restaurant_id and date_str and time_slot):
            return Response({"detail": "restaurant, date, and time_slot are required."}, status=status.HTTP_400_BAD_REQUEST)

        date = parse_date(date_str)
        if not date:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({"detail": "Restaurant not found."}, status=status.HTTP_404_NOT_FOUND)

        exists = WaitlistEntry.objects.filter(
            user=user,
            restaurant=restaurant,
            date=date,
            time_slot=time_slot,
            status='waiting'
        ).exists()
        if exists:
            return Response({"detail": "You are already on the waitlist for this time slot."}, status=status.HTTP_400_BAD_REQUEST)

        entry = WaitlistEntry.objects.create(
            user=user,
            restaurant=restaurant,
            date=date,
            time_slot=time_slot,
            guests_count=guests_count,
            status='waiting'
        )

        serializer = self.get_serializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
