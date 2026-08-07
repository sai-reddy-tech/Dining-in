from rest_framework import views, permissions, status
from rest_framework.response import Response
from restaurants.models import Restaurant, Table
from restaurants.serializers import RestaurantSerializer, TableSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q
from .ai_engine import (
    get_hybrid_recommendations,
    recommend_table,
    predict_demand,
    predict_no_show_risk,
    parse_booking_query
)

User = get_user_model()

class RestaurantRecommendationsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurants = Restaurant.objects.all()
        recommended = get_hybrid_recommendations(request.user, restaurants)
        serializer = RestaurantSerializer(recommended, many=True, context={'request': request})
        return Response(serializer.data)

class TableRecommendationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant_id = request.query_params.get('restaurant')
        guests_count_str = request.query_params.get('guests_count')
        occasion = request.query_params.get('occasion')
        pref_loc = request.query_params.get('preferred_location')

        if not (restaurant_id and guests_count_str):
            return Response({"detail": "restaurant and guests_count query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            guests_count = int(guests_count_str)
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except (ValueError, Restaurant.DoesNotExist):
            return Response({"detail": "Invalid restaurant or guests count."}, status=status.HTTP_400_BAD_REQUEST)

        tables = Table.objects.filter(restaurant=restaurant, is_active=True)
        recommended = recommend_table(tables, guests_count, occasion, pref_loc)
        serializer = TableSerializer(recommended, many=True)
        return Response(serializer.data)

class DemandPredictionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['owner', 'admin']:
            return Response({"detail": "You do not have permission to view demand predictions."}, status=status.HTTP_403_FORBIDDEN)

        restaurant_id = request.query_params.get('restaurant')
        if not restaurant_id:
            return Response({"detail": "restaurant query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        predictions = predict_demand(restaurant_id)
        return Response(predictions)

class NoShowPredictionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['owner', 'admin']:
            return Response({"detail": "You do not have permission to view no-show risk reports."}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.query_params.get('user')
        guests_count_str = request.query_params.get('guests_count', '2')
        lead_time_str = request.query_params.get('lead_time_days', '1')

        if not user_id:
            return Response({"detail": "user query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            guests_count = int(guests_count_str)
            lead_time_days = float(lead_time_str)
        except ValueError:
            return Response({"detail": "guests_count and lead_time_days must be numbers."}, status=status.HTTP_400_BAD_REQUEST)

        risk_report = predict_no_show_risk(user_id, guests_count, lead_time_days)
        return Response(risk_report)

class AssistantChatView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '')
        if not query:
            return Response({"detail": "Query cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Parse query
        parsed_params = parse_booking_query(query)
        
        # 2. Match restaurant
        location = parsed_params.get('location')
        matched_restaurant = None
        restaurant_suggestions = []

        if location:
            restaurants = Restaurant.objects.filter(location__icontains=location)
            if restaurants.exists():
                matched_restaurant = restaurants.first()
                restaurant_suggestions = list(restaurants[:3])
            else:
                restaurant_suggestions = list(Restaurant.objects.all()[:3])
        else:
            restaurant_suggestions = list(Restaurant.objects.all()[:3])

        # 3. Generate response text
        response_text = ""
        suggestion_data = []

        if location:
            response_text = f"I've analyzed your request for a table in **{location}** on **{parsed_params['date']}** at **{parsed_params['time_slot']}** for **{parsed_params['guests_count']}** guest(s)."
        else:
            response_text = f"Sure! I extracted: **{parsed_params['guests_count']}** guest(s) on **{parsed_params['date']}** at **{parsed_params['time_slot']}**."

        if matched_restaurant:
            response_text += f"\n\nI recommend booking at **{matched_restaurant.name}** ({matched_restaurant.location})."
        elif restaurant_suggestions:
            response_text += f"\n\nHere are some dining options in our database:"
        else:
            response_text += "\n\nWe couldn't find any active restaurants in the database right now. Please create one in the owner dashboard!"

        for rest in restaurant_suggestions:
            suggestion_data.append({
                "id": rest.id,
                "name": rest.name,
                "location": rest.location,
                "cuisine": rest.cuisine,
                "rating": rest.rating
            })

        return Response({
            "response": response_text,
            "parsed_parameters": parsed_params,
            "suggestions": suggestion_data,
            "suggested_restaurant": {
                "id": matched_restaurant.id,
                "name": matched_restaurant.name
            } if matched_restaurant else None
        })
