from django.urls import re_path
from reservations import consumers

websocket_urlpatterns = [
    re_path(r'^ws/restaurant/(?P<restaurant_id>\d+)/availability/$', consumers.RestaurantAvailabilityConsumer.as_asgi()),
    re_path(r'^ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]
