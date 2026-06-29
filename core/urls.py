# core/urls.py
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Simple home view
def home(request):
    return JsonResponse({'message': 'MicroFinance API', 'status': 'running'})

# Simple API root
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

urlpatterns = [
    # Home
    path('', home, name='home'),
    path('api/', api_root, name='api-root'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication - Simple JWT
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # App endpoints - Direct views (NO includes)
    path('api/loans/', include_loans),
    path('api/branches/', include_branches),
    path('api/payments/', include_payments),
    path('api/customer/', include_customer),
]

# ============================================
# DIRECT VIEWS (No separate URL files needed)
# ============================================

from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
import json

# ---------- LOANS ----------
@api_view(['GET', 'POST'])
def include_loans(request):
    if request.method == 'GET':
        return Response([{'id': 1, 'loan_no': 'LN-001', 'status': 'active'}])
    return Response({'message': 'Loan created'}, status=201)

# ---------- BRANCHES ----------
@api_view(['GET', 'POST'])
def include_branches(request):
    if request.method == 'GET':
        return Response([
            {'id': 1, 'name': 'Dar es Salaam HQ', 'code': 'DSM001'},
            {'id': 2, 'name': 'Mwanza', 'code': 'MWZ001'},
        ])
    return Response({'message': 'Branch created'}, status=201)

# ---------- PAYMENTS ----------
@api_view(['GET', 'POST'])
def include_payments(request):
    if request.method == 'GET':
        return Response([{'id': 1, 'amount': 100000, 'status': 'completed'}])
    return Response({'message': 'Payment created'}, status=201)

# ---------- CUSTOMER ----------
@api_view(['POST'])
def include_customer(request):
    if request.method == 'POST':
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