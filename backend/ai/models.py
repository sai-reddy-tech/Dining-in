from django.db import models
from django.conf import settings
from restaurants.models import Restaurant

class DemandRecord(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='demand_records')
    date = models.DateField()
    time_slot = models.CharField(max_length=5)
    bookings_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('restaurant', 'date', 'time_slot')

    def __str__(self):
        return f"{self.restaurant.name} - {self.date} {self.time_slot}: {self.bookings_count} bookings"

class CustomerBehavior(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='behavior')
    no_shows = models.IntegerField(default=0)
    completions = models.IntegerField(default=0)
    cancellations = models.IntegerField(default=0)
    lead_time_days = models.FloatField(default=1.0) # average number of days in advance user books

    def __str__(self):
        return f"Behavior: {self.user.email} (No-Shows: {self.no_shows}, Cancellations: {self.cancellations})"
