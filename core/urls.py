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

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/customer/', include('customers.urls')),
    path('api/loans/', include('loans.urls')),
    path('api/branches/', include('branches.urls')),
    path('api/payments/', include('payments.urls')),
]