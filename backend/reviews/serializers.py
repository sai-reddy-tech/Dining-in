from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_name', 'restaurant', 'restaurant_name', 'rating', 
                  'comment', 'food_score', 'service_score', 'ambience_score', 
                  'sentiment_label', 'created_at')
        read_only_fields = ('id', 'user', 'food_score', 'service_score', 'ambience_score', 'sentiment_label', 'created_at')
