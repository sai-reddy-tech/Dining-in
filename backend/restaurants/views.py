from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Restaurant, Table, MenuItem
from .serializers import RestaurantSerializer, TableSerializer, MenuItemSerializer

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['owner', 'admin']

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role == 'admin':
            return True
        if isinstance(obj, Restaurant):
            return obj.owner == request.user
        return obj.restaurant.owner == request.user

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        queryset = Restaurant.objects.all()
        location = self.request.query_params.get('location')
        cuisine = self.request.query_params.get('cuisine')
        price_range = self.request.query_params.get('price_range')
        query = self.request.query_params.get('q')

        if location:
            queryset = queryset.filter(location__icontains=location)
        if cuisine:
            queryset = queryset.filter(cuisine__icontains=cuisine)
        if price_range:
            queryset = queryset.filter(price_range=price_range)
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(cuisine__icontains=query) |
                Q(location__icontains=query)
            )
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_restaurants(self, request):
        if request.user.role not in ['owner', 'admin']:
            return Response({"detail": "You do not have permission to view owner resources."}, status=status.HTTP_403_FORBIDDEN)
        restaurants = Restaurant.objects.filter(owner=request.user)
        serializer = self.get_serializer(restaurants, many=True)
        return Response(serializer.data)

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            return Table.objects.filter(restaurant_id=restaurant_id)
        return Table.objects.all()

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            return MenuItem.objects.filter(restaurant_id=restaurant_id)
        return MenuItem.objects.all()
