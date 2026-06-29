# core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

# Import your views (make sure all exist)
from loans.views import LoanViewSet, LoanProductViewSet
from customers.views import CustomerViewSet
from customers.views_portal import CustomerAuthViewSet, CustomerPortalViewSet
from payments.views import PaymentViewSet

# Try to import reports, if fails create dummy
try:
    from reports.views import PortfolioReportView, CollectionsReportView
except ImportError:
    from rest_framework.views import APIView
    from rest_framework.response import Response
    
    class PortfolioReportView(APIView):
        def get(self, request):
            return Response({'message': 'Portfolio Report', 'status': 'success'})
    
    class CollectionsReportView(APIView):
        def get(self, request):
            return Response({'message': 'Collections Report', 'status': 'success'})

# Main API Router
router = DefaultRouter()
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'loan-products', LoanProductViewSet, basename='loan-product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'payments', PaymentViewSet, basename='payment')

# Customer Portal Router
customer_router = DefaultRouter()
customer_router.register(r'auth', CustomerAuthViewSet, basename='customer-auth')
customer_router.register(r'', CustomerPortalViewSet, basename='customer-portal')

def home(request):
    return JsonResponse({
        'message': 'MicroFinance System API',
        'version': '1.0.0',
        'status': 'running'
    })

def api_root(request):
    return JsonResponse({
        'message': 'MicroFinance System API',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'customer': '/api/customer/',
            'loans': '/api/loans/',
            'branches': '/api/branches/',
            'payments': '/api/payments/',
            'auth': '/api/auth/',
            'reports': '/api/reports/',
        }
    })

urlpatterns = [
    path('', home, name='home'),
    path('api/', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    
    # JWT Authentication endpoints
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Customer Portal endpoints
    path('api/customer/', include(customer_router.urls)),
    
    # Main API router
    path('api/', include(router.urls)),
    
    # Branches
    path('api/', include('branches.urls')),
    
    # Reports
    path('api/reports/portfolio/', PortfolioReportView.as_view(), name='portfolio-report'),
    path('api/reports/collections/', CollectionsReportView.as_view(), name='collections-report'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)