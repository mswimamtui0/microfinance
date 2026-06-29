# loans/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoanViewSet, LoanProductViewSet

router = DefaultRouter()
router.register(r'', LoanViewSet, basename='loan')
router.register(r'products', LoanProductViewSet, basename='loan-product')

urlpatterns = [
    path('', include(router.urls)),
]