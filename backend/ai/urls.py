from django.urls import path
from .views import (
    RestaurantRecommendationsView,
    TableRecommendationView,
    DemandPredictionView,
    NoShowPredictionView,
    AssistantChatView
)

urlpatterns = [
    path('recommend/restaurants/', RestaurantRecommendationsView.as_view(), name='ai-recommend-restaurants'),
    path('recommend/tables/', TableRecommendationView.as_view(), name='ai-recommend-tables'),
    path('predict/demand/', DemandPredictionView.as_view(), name='ai-predict-demand'),
    path('predict/noshow/', NoShowPredictionView.as_view(), name='ai-predict-noshow'),
    path('chatbot/', AssistantChatView.as_view(), name='ai-chatbot'),
]
