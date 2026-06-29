from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

# Remove this line - it's commented out but still used
# from accounts.views import CustomTokenObtainPairView, AuthViewSet

from loans.views import LoanViewSet, LoanProductViewSet
from customers.views import CustomerViewSet
from customers.views_portal import CustomerAuthViewSet, CustomerPortalViewSet
from payments.views import PaymentViewSet
from reports.views import PortfolioReportView, CollectionsReportView

router = DefaultRouter()
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'loan-products', LoanProductViewSet, basename='loan-product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'payments', PaymentViewSet, basename='payment')

# Customer portal router
customer_router = DefaultRouter()
customer_router.register(r'auth', CustomerAuthViewSet, basename='customer-auth')
customer_router.register(r'', CustomerPortalViewSet, basename='customer-portal')

def home(request):
    return JsonResponse({
        'message': 'MicroFinance System API',
        'version': '1.0.0',
        'status': 'running'
    })
    from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.core.management import call_command

def deploy_view(request):
    """Run migrations and create superuser via URL"""
    try:
        call_command('migrate', verbosity=0)
        
        # Create superuser if not exists
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
        return HttpResponse("Deployment successful! Admin created.")
    except Exception as e:
        return HttpResponse(f"Error: {e}")

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('admin/', admin.site.urls),  
    path('deploy/', deploy_view, name='deploy'),
    
    # JWT Authentication endpoints - FIXED: Use TokenObtainPairView directly
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Customer Portal endpoints
    path('api/customer/', include(customer_router.urls)),
    
    # API router
    path('api/', include(router.urls)),
    
    # Branches
    path('api/', include('branches.urls')),
    
    # Reports
    path('api/reports/portfolio/', PortfolioReportView.as_view(), name='portfolio-report'),
    path('api/reports/collections/', CollectionsReportView.as_view(), name='collections-report'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)