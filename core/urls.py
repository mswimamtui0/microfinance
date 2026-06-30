# core/urls.py
from django.urls import path, include
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import json

# ============================================
# VIEWS (Defined FIRST before URL patterns)
# ============================================

def home(request):
    return JsonResponse({'message': 'MicroFinance API', 'status': 'running'})

def api_root(request):
    return JsonResponse({
        'message': 'MicroFinance API',
        'endpoints': {
            'admin': '/admin/',
            'auth': '/api/auth/',
            'loans': '/api/loans/',
            'branches': '/api/branches/',
            'payments': '/api/payments/',
        }
    })

# ---------- LOANS VIEW ----------
@api_view(['GET', 'POST'])
def loans_view(request):
    if request.method == 'GET':
        return Response([{'id': 1, 'loan_no': 'LN-001', 'status': 'active'}])
    return Response({'message': 'Loan created'}, status=201)

# ---------- BRANCHES VIEW ----------
@api_view(['GET', 'POST'])
def branches_view(request):
    if request.method == 'GET':
        return Response([
            {'id': 1, 'name': 'Dar es Salaam HQ', 'code': 'DSM001'},
            {'id': 2, 'name': 'Mwanza', 'code': 'MWZ001'},
        ])
    return Response({'message': 'Branch created'}, status=201)

# ---------- PAYMENTS VIEW ----------
@api_view(['GET', 'POST'])
def payments_view(request):
    if request.method == 'GET':
        return Response([{'id': 1, 'amount': 100000, 'status': 'completed'}])
    return Response({'message': 'Payment created'}, status=201)

# ---------- CUSTOMER AUTH VIEW ----------
@api_view(['POST'])
def customer_auth_view(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=400)
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    except:
        return Response({'error': 'Invalid request'}, status=400)

# ============================================
# URL PATTERNS
# ============================================

urlpatterns = [
    path('', home, name='home'),
    path('api/', api_root, name='api-root'),
    path('admin/', admin.site.urls),
     path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('customers.urls')),  # ✅ Make sure this is correct
    path('api/', include('loans.urls')),
    path('api/', include('branches.urls')),
    path('api/', include('payments.urls')),
    
    # Authentication
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App endpoints
    path('api/loans/', loans_view, name='loans'),
    path('api/branches/', branches_view, name='branches'),
    path('api/payments/', payments_view, name='payments'),
    path('api/customer/auth/login/', customer_auth_view, name='customer-auth'),
]