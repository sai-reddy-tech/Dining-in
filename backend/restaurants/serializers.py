from rest_framework import serializers
from .models import Restaurant, Table, MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ('id', 'restaurant', 'name', 'description', 'price', 'category', 'image', 'image_url')
        read_only_fields = ('id',)

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return f"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ('id', 'restaurant', 'table_number', 'capacity', 'location_tag', 'is_active')
        read_only_fields = ('id',)

class RestaurantSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.name', read_only=True)
    tables = TableSerializer(many=True, read_only=True)
    menu_items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = Restaurant
        fields = ('id', 'owner', 'owner_name', 'name', 'location', 'cuisine', 'description', 
                  'price_range', 'operating_hours', 'rating', 'cover_image', 'cover_image_url', 
                  'tables', 'menu_items')
        read_only_fields = ('id', 'owner', 'rating')

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        
        # Fallback premium placeholder based on cuisine
        cuisine_lower = obj.cuisine.lower() if obj.cuisine else ""
        if 'italian' in cuisine_lower or 'pizza' in cuisine_lower or 'pasta' in cuisine_lower:
            return "https://images.unsplash.com/photo-1498579150354-97050687a6b7?auto=format&fit=crop&w=800&q=80"
        elif 'indian' in cuisine_lower or 'biryani' in cuisine_lower or 'curry' in cuisine_lower:
            return "https://images.unsplash.com/photo-1585938338392-50a59970d8ee?auto=format&fit=crop&w=800&q=80"
        elif 'chinese' in cuisine_lower or 'asian' in cuisine_lower or 'sushi' in cuisine_lower:
            return "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"
        return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
