from django.db import models
from django.conf import settings
from restaurants.models import Restaurant

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(default=5) # 1 to 5
    comment = models.TextField()
    food_score = models.FloatField(default=0.0) # 0.0 to 5.0 predicted by AI
    service_score = models.FloatField(default=0.0) # 0.0 to 5.0 predicted by AI
    ambience_score = models.FloatField(default=0.0) # 0.0 to 5.0 predicted by AI
    sentiment_label = models.CharField(max_length=20, default='positive') # positive, neutral, negative
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} -> {self.restaurant.name} ({self.rating})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.update_restaurant_rating()

    def delete(self, *args, **kwargs):
        restaurant = self.restaurant
        super().delete(*args, **kwargs)
        self.update_restaurant_rating_for(restaurant)

    def update_restaurant_rating(self):
        self.update_restaurant_rating_for(self.restaurant)

    @staticmethod
    def update_restaurant_rating_for(restaurant):
        reviews = restaurant.reviews.all()
        if reviews.exists():
            avg = sum([r.rating for r in reviews]) / reviews.count()
            restaurant.rating = round(avg, 2)
        else:
            restaurant.rating = 0.0
        restaurant.save()
