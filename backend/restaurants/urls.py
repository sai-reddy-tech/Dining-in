from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestaurantViewSet, TableViewSet, MenuItemViewSet

router = DefaultRouter()
router.register(r'profiles', RestaurantViewSet, basename='restaurant')
router.register(r'tables', TableViewSet, basename='table')
router.register(r'menu', MenuItemViewSet, basename='menuitem')

urlpatterns = [
    path('', include(router.urls)),
]
