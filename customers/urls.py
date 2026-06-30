# customers/urls.py
from django.urls import path, include
from .views import home, options_handler 
from rest_framework.routers import DefaultRouter
from .views_portal import CustomerAuthViewSet, CustomerPortalViewSet

router = DefaultRouter()
router.register(r'auth', CustomerAuthViewSet, basename='customer-auth')
router.register(r'', CustomerPortalViewSet, basename='customer-portal')

urlpatterns = [
    path('', include(router.urls)),
    path('<path:path>', options_handler),
    
]