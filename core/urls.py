# core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

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
        }
    })

urlpatterns = [
    path('', home, name='home'),
    path('api/', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/customer/', include('customers.urls')),
    path('api/loans/', include('loans.urls')),
    path('api/branches/', include('branches.urls')),
    path('api/payments/', include('payments.urls')),
]