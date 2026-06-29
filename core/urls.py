from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from django.core.management import call_command
from django.shortcuts import redirect
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from loans.views import LoanViewSet, LoanProductViewSet
from customers.views import CustomerViewSet
from customers.views_portal import CustomerAuthViewSet, CustomerPortalViewSet
from payments.views import PaymentViewSet
from reports.views import PortfolioReportView, CollectionsReportView

from django.http import HttpResponse
from django.core.management import call_command

def run_command(request, command):
    try:
        call_command(command)
        return HttpResponse(f"Command '{command}' executed successfully.")
    except Exception as e:
        return HttpResponse(f"Error running command '{command}': {e}")

# In urlpatterns, add:


# ============================================
# DEPLOY VIEW - Run migrations and create admin
# ============================================
def deploy_view(request):
    """Run migrations and create superuser via URL"""
    try:
        call_command('migrate', verbosity=0)
        
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


        from django.http import HttpResponse
from django.core.management import call_command

def collectstatic_view(request):
    try:
        call_command('collectstatic', '--noinput', verbosity=0)
        return HttpResponse("Static files collected successfully!")
    except Exception as e:
        return HttpResponse(f"Error collecting static files: {e}")


# ============================================
# HOME VIEW
# ============================================
def home_view(request):
    return JsonResponse({
        'message': 'MicroFinance System API',
        'version': '1.0.0',
        'status': 'running'
    })


# ============================================
# REDIRECT VIEW
# ============================================
def admin_redirect(request):
    return redirect('/admin/')


# ============================================
# ROUTERS
# ============================================
router = DefaultRouter()
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'loan-products', LoanProductViewSet, basename='loan-product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'payments', PaymentViewSet, basename='payment')

customer_router = DefaultRouter()
customer_router.register(r'auth', CustomerAuthViewSet, basename='customer-auth')
customer_router.register(r'', CustomerPortalViewSet, basename='customer-portal')


# ============================================
# URL PATTERNS
# ============================================
urlpatterns = [
    # Home
    path('', home_view, name='home'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # Deploy - Run migrations
    path('deploy/', deploy_view, name='deploy'),
    
    # JWT Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('run/<str:command>/', run_command, name='run_command'),
    
    # Customer Portal
    path('api/customer/', include(customer_router.urls)),
    
    # API Router
    path('api/', include(router.urls)),
    
    # Branches
    path('api/', include('branches.urls')),
    
    # Reports
    path('api/reports/portfolio/', PortfolioReportView.as_view(), name='portfolio-report'),
    path('api/reports/collections/', CollectionsReportView.as_view(), name='collections-report'),
    path('collectstatic/', collectstatic_view, name='collectstatic'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)