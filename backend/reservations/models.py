from django.db import models
from django.conf import settings
from restaurants.models import Restaurant, Table

class Reservation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reservations')
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')
    date = models.DateField()
    time_slot = models.CharField(max_length=5, help_text="Format: HH:MM, e.g. 19:30")
    guests_count = models.IntegerField(default=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    special_requests = models.TextField(blank=True, null=True)
    qr_code_image = models.ImageField(upload_to='reservations/qrcodes/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} @ {self.restaurant.name} on {self.date} {self.time_slot}"

class WaitlistEntry(models.Model):
    STATUS_CHOICES = (
        ('waiting', 'Waiting'),
        ('matched', 'Matched'),
        ('notified', 'Notified'),
        ('expired', 'Expired'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='waitlist_entries')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='waitlist_entries')
    date = models.DateField()
    time_slot = models.CharField(max_length=5)
    guests_count = models.IntegerField(default=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Waitlist: {self.user.email} for {self.restaurant.name} ({self.guests_count} guests)"
