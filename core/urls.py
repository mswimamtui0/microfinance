# core/urls.py
# core/urls.py
import django
django.setup()  # ✅ This ensures Django is fully loaded
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from loans.views import LoanViewSet, LoanProductViewSet
from customers.views import CustomerViewSet
from customers.views_portal import CustomerAuthViewSet, CustomerPortalViewSet
from payments.views import PaymentViewSet
from reports.views import PortfolioReportView, CollectionsReportView

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

router = DefaultRouter()
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'loan-products', LoanProductViewSet, basename='loan-product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'payments', PaymentViewSet, basename='payment')

customer_router = DefaultRouter()
customer_router.register(r'auth', CustomerAuthViewSet, basename='customer-auth')
customer_router.register(r'', CustomerPortalViewSet, basename='customer-portal')

urlpatterns = [
    path('', home, name='home'),
    path('api/', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/customer/', include(customer_router.urls)),
    path('api/', include('branches.urls')),
    path('api/reports/portfolio/', PortfolioReportView.as_view(), name='portfolio-report'),
    path('api/reports/collections/', CollectionsReportView.as_view(), name='collections-report'),
]