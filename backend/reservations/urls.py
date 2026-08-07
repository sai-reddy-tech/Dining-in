from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReservationViewSet, WaitlistEntryViewSet

router = DefaultRouter()
router.register(r'bookings', ReservationViewSet, basename='reservation')
router.register(r'waitlist', WaitlistEntryViewSet, basename='waitlist')

urlpatterns = [
    path('', include(router.urls)),
]
