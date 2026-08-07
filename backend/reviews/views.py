from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer
from ai.ai_engine import analyze_sentiment

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            return Review.objects.filter(restaurant_id=restaurant_id).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        comment = self.request.data.get('comment', '')
        rating = int(self.request.data.get('rating', 5))
        
        # Invoke AI sentiment analyzer
        sentiment_results = analyze_sentiment(comment, rating)
        
        serializer.save(
            user=self.request.user,
            food_score=sentiment_results.get('food_score', float(rating)),
            service_score=sentiment_results.get('service_score', float(rating)),
            ambience_score=sentiment_results.get('ambience_score', float(rating)),
            sentiment_label=sentiment_results.get('sentiment_label', 'positive')
        )
