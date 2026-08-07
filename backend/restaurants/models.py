from django.db import models
from django.conf import settings

class Restaurant(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='restaurants')
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255) # e.g. "Madhapur, Hyderabad"
    cuisine = models.CharField(max_length=255) # e.g. "Italian, Pizza"
    description = models.TextField(blank=True)
    price_range = models.CharField(max_length=50, default="$$") # $, $$, $$$, $$$$
    operating_hours = models.CharField(max_length=100, default="11:00 AM - 11:00 PM")
    rating = models.FloatField(default=0.0)
    cover_image = models.ImageField(upload_to='restaurants/covers/', blank=True, null=True)

    def __str__(self):
        return self.name

class Table(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tables')
    table_number = models.CharField(max_length=20)
    capacity = models.IntegerField(default=4)
    location_tag = models.CharField(max_length=50, default="Main Room") # Window, Patio, Center, etc.
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('restaurant', 'table_number')

    def __str__(self):
        return f"{self.restaurant.name} - Table {self.table_number} ({self.capacity} Pax)"

class MenuItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, default="Main Course") # Appetizer, Dessert, Drink, etc.
    image = models.ImageField(upload_to='restaurants/menu/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"
