# customers/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_portal import CustomerAuthViewSet, CustomerPortalViewSet

# ✅ Remove the incorrect import entirely. No 'home' or 'options_handler' here.

router = DefaultRouter()
router.register(r'auth', CustomerAuthViewSet, basename='customer-auth')
router.register(r'', CustomerPortalViewSet, basename='customer-portal')

urlpatterns = [
    path('', include(router.urls)),
]