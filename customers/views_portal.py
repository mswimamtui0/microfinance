from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from .models import Customer, CustomerOTP, CustomerLoanApplication
from .serializers_portal import *
from loans.models import Loan, LoanProduct
from payments.models import Payment
import random
import logging

logger = logging.getLogger(__name__)


class CustomerAuthViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def send_otp(self, request):
        """Send OTP to customer's phone"""
        serializer = CustomerOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            purpose = serializer.validated_data['purpose']
            
            try:
                customer = Customer.objects.get(phone=phone)
            except Customer.DoesNotExist:
                return Response({
                    'error': 'Phone number not registered. Please register first.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            otp_code = f"{random.randint(100000, 999999)}"
            CustomerOTP.objects.filter(customer=customer, purpose=purpose, is_used=False).delete()
            
            otp = CustomerOTP.objects.create(
                customer=customer,
                otp_code=otp_code,
                purpose=purpose,
                expires_at=timezone.now() + timezone.timedelta(minutes=5)
            )
            
            print(f"OTP for {phone}: {otp_code}")
            
            return Response({
                'message': 'OTP sent successfully',
                'otp': otp_code,
                'expires_in': '5 minutes'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        """Verify OTP"""
        serializer = CustomerVerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            otp_code = serializer.validated_data['otp_code']
            purpose = serializer.validated_data['purpose']
            
            try:
                customer = Customer.objects.get(phone=phone)
            except Customer.DoesNotExist:
                return Response({
                    'error': 'Customer not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            try:
                otp = CustomerOTP.objects.get(
                    customer=customer,
                    otp_code=otp_code,
                    purpose=purpose,
                    is_used=False
                )
            except CustomerOTP.DoesNotExist:
                return Response({
                    'error': 'Invalid or expired OTP'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not otp.is_valid():
                return Response({
                    'error': 'OTP has expired'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            otp.is_used = True
            otp.save()
            
            return Response({
                'message': 'OTP verified successfully',
                'verified': True
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new customer"""
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            return Response({
                'success': True,
                'message': 'Registration successful!',
                'phone': customer.phone,
                'customer_id': customer.id
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
           @action(detail=False, methods=['post'])
    def login(self, request):
        """Login customer"""
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response({
                    'error': 'Username and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Try to authenticate
            user = authenticate(username=username, password=password)
            
            if user is None:
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get the phone number - handle both username and phone fields
            phone = None
            if hasattr(user, 'phone') and user.phone:
                phone = user.phone
            else:
                # Try to find customer by username
                try:
                    customer_by_phone = Customer.objects.filter(phone=username).first()
                    if customer_by_phone:
                        phone = customer_by_phone.phone
                except:
                    pass
            
            # Get customer by phone or create one
            try:
                if phone:
                    customer = Customer.objects.get(phone=phone)
                else:
                    # Create customer if doesn't exist
                    customer = Customer.objects.create(
                        user=user,
                        phone=username,
                        first_name=user.first_name or 'User',
                        last_name=user.last_name or 'Unknown',
                        account_status='active'
                    )
            except Customer.DoesNotExist:
                # Create customer if doesn't exist
                customer = Customer.objects.create(
                    user=user,
                    phone=username,
                    first_name=user.first_name or 'User',
                    last_name=user.last_name or 'Unknown',
                    account_status='active'
                )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'customer': {
                    'id': customer.id,
                    'phone': customer.phone,
                    'first_name': customer.first_name,
                    'last_name': customer.last_name,
                    'email': customer.email,
                    'account_status': customer.account_status,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                'error': f'Login failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerPortalViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_customer(self):
        """Get the customer from the authenticated user"""
        try:
            return Customer.objects.get(phone=self.request.user.phone)
        except Customer.DoesNotExist:
            return None
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get customer profile"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        serializer = CustomerProfileSerializer(customer)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get customer dashboard data"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        loans = Loan.objects.filter(customer=customer)
        
        total_loans = loans.count()
        active_loans = loans.filter(status='active').count()
        total_borrowed = loans.aggregate(total=models.Sum('principal'))['total'] or 0
        total_paid = loans.aggregate(total=models.Sum('amount_paid'))['total'] or 0
        total_outstanding = loans.aggregate(total=models.Sum('outstanding_balance'))['total'] or 0
        
        next_payment = None
        next_payment_amount = None
        if loans.exists():
            from loans.models import LoanSchedule
            next_schedule = LoanSchedule.objects.filter(
                loan__in=loans,
                status='pending',
                due_date__gte=timezone.now().date()
            ).order_by('due_date').first()
            if next_schedule:
                next_payment = next_schedule.due_date
                next_payment_amount = next_schedule.total_due
        
        recent_loans = loans.order_by('-created_at')[:5]
        
        return Response({
            'profile': CustomerProfileSerializer(customer).data,
            'summary': {
                'total_loans': total_loans,
                'active_loans': active_loans,
                'total_borrowed': total_borrowed,
                'total_paid': total_paid,
                'total_outstanding': total_outstanding,
                'next_payment': next_payment,
                'next_payment_amount': next_payment_amount,
            },
            'recent_loans': [
                {
                    'id': loan.id,
                    'loan_no': loan.loan_no,
                    'principal': loan.principal,
                    'outstanding_balance': loan.outstanding_balance,
                    'status': loan.status,
                    'maturity_date': loan.maturity_date,
                }
                for loan in recent_loans
            ]
        })
    
    @action(detail=False, methods=['get'])
    def loans(self, request):
        """Get all loans for customer"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        loans = Loan.objects.filter(customer=customer).order_by('-created_at')
        
        return Response([
            {
                'id': loan.id,
                'loan_no': loan.loan_no,
                'principal': loan.principal,
                'outstanding_balance': loan.outstanding_balance,
                'status': loan.status,
                'maturity_date': loan.maturity_date,
                'total_interest': loan.total_interest,
                'total_payable': loan.total_payable,
                'amount_paid': loan.amount_paid,
                'disbursement_date': loan.disbursement_date,
            }
            for loan in loans
        ])
    
    @action(detail=False, methods=['get'])
    def payment_history(self, request):
        """Get payment history for customer"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        payments = Payment.objects.filter(loan__customer=customer).order_by('-payment_date')
        
        return Response([
            {
                'id': payment.id,
                'transaction_ref': payment.transaction_ref,
                'loan_no': payment.loan.loan_no,
                'amount_paid': payment.amount_paid,
                'payment_method': payment.payment_method,
                'payment_date': payment.payment_date,
                'status': payment.status,
                'notes': payment.notes,
            }
            for payment in payments
        ])
    
    @action(detail=False, methods=['post'])
    def apply_loan(self, request):
        """Apply for a new loan"""
        customer = self.get_customer()
        if not customer:
            return Response({
                'error': 'Customer not found. Please complete your profile first.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        
        try:
            product = LoanProduct.objects.get(id=data['product'], is_active=True)
        except LoanProduct.DoesNotExist:
            return Response({'error': 'Invalid loan product'}, status=400)
        
        amount = float(data.get('amount', 0))
        if amount < product.min_amount or amount > product.max_amount:
            return Response({
                'error': f'Amount must be between {product.min_amount} and {product.max_amount}'
            }, status=400)
        
        term = int(data.get('term_months', 0))
        if term < product.min_term_months or term > product.max_term_months:
            return Response({
                'error': f'Term must be between {product.min_term_months} and {product.max_term_months} months'
            }, status=400)
        
        # Create application
        application = CustomerLoanApplication.objects.create(
            customer=customer,
            loan_type=data.get('loan_type', 'personal'),
            amount_requested=amount,
            amount_approved=amount,
            interest_rate=product.interest_rate,
            processing_fee=product.processing_fee,
            term_months=term,
            repayment_frequency=product.repayment_frequency,
            purpose=data.get('purpose', ''),
            description=data.get('business_description', ''),
            guarantor_name=data.get('guarantor_name', ''),
            guarantor_phone=data.get('guarantor_phone', ''),
            guarantor_nida=data.get('guarantor_nida', ''),
            guarantor_relationship=data.get('guarantor_relationship', ''),
            status='pending',
        )
        
        return Response({
            'success': True,
            'message': 'Loan application submitted successfully!',
            'application': {
                'id': application.id,
                'amount': application.amount_requested,
                'term_months': application.term_months,
                'status': application.status,
                'submitted_at': application.application_date,
            },
            'next_steps': 'Your application is being reviewed. You will receive a notification within 24-48 hours.'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def applications(self, request):
        """Get all loan applications for customer"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        applications = CustomerLoanApplication.objects.filter(customer=customer).order_by('-created_at')
        
        return Response([
            {
                'id': app.id,
                'loan_type': app.loan_type,
                'amount_requested': app.amount_requested,
                'term_months': app.term_months,
                'status': app.status,
                'application_date': app.application_date,
                'purpose': app.purpose,
            }
            for app in applications
        ])
    
    @action(detail=False, methods=['get'])
    def loan_calculator(self, request):
        """Calculate loan payments before applying"""
        amount = float(request.query_params.get('amount', 0))
        term = int(request.query_params.get('term', 0))
        product_id = int(request.query_params.get('product_id', 0))
        
        try:
            product = LoanProduct.objects.get(id=product_id, is_active=True)
        except LoanProduct.DoesNotExist:
            return Response({'error': 'Invalid product'}, status=400)
        
        if amount < product.min_amount or amount > product.max_amount:
            return Response({
                'error': f'Amount must be between {product.min_amount} and {product.max_amount}'
            }, status=400)
        
        if term < product.min_term_months or term > product.max_term_months:
            return Response({
                'error': f'Term must be between {product.min_term_months} and {product.max_term_months} months'
            }, status=400)
        
        # Calculate interest
        if product.interest_method == 'flat':
            total_interest = amount * (product.interest_rate / 100) * term
            monthly_payment = (amount + total_interest) / term
        else:
            # Declining balance (simplified)
            monthly_rate = product.interest_rate / 100 / 12
            if monthly_rate > 0:
                monthly_payment = amount * monthly_rate * (1 + monthly_rate) ** term
                monthly_payment /= (1 + monthly_rate) ** term - 1
                total_interest = monthly_payment * term - amount
            else:
                monthly_payment = amount / term
                total_interest = 0
        
        total_payable = amount + total_interest
        
        return Response({
            'product': product.product_name,
            'principal': amount,
            'interest_rate': product.interest_rate,
            'term_months': term,
            'total_interest': total_interest,
            'total_payable': total_payable,
            'monthly_payment': monthly_payment,
            'repayment_frequency': product.repayment_frequency,
            'affordability': {
                'monthly_payment': monthly_payment,
            }
        })