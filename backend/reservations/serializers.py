from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Reservation, WaitlistEntry
from restaurants.models import Restaurant, Table

User = get_user_model()

class ReservationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = ('id', 'user', 'user_name', 'user_email', 'restaurant', 'restaurant_name', 
                  'table', 'table_number', 'date', 'time_slot', 'guests_count', 
                  'status', 'special_requests', 'qr_code_image', 'qr_code_url', 'created_at')
        read_only_fields = ('id', 'user', 'qr_code_image', 'created_at')

    def get_qr_code_url(self, obj):
        if obj.qr_code_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code_image.url)
            return obj.qr_code_image.url
        return None

class WaitlistEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = WaitlistEntry
        fields = ('id', 'user', 'user_name', 'restaurant', 'restaurant_name', 
                  'date', 'time_slot', 'guests_count', 'status', 'created_at')
        read_only_fields = ('id', 'user', 'status', 'created_at')
