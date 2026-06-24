from rest_framework import status, viewsets, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import transaction
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
            
            # Generate OTP
            otp_code = f"{random.randint(100000, 999999)}"
            
            # Delete old OTPs
            CustomerOTP.objects.filter(customer=customer, purpose=purpose, is_used=False).delete()
            
            # Create new OTP
            otp = CustomerOTP.objects.create(
                customer=customer,
                otp_code=otp_code,
                purpose=purpose,
                expires_at=timezone.now() + timezone.timedelta(minutes=5)
            )
            
            # TODO: Send SMS with OTP
            # send_sms(customer.phone, f"Your OTP is {otp_code}")
            
            return Response({
                'message': 'OTP sent successfully',
                'otp': otp_code,  # Remove in production
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
            
            # Mark OTP as used
            otp.is_used = True
            otp.save()
            
            return Response({
                'message': 'OTP verified successfully',
                'verified': True
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register new customer"""
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(customer)
            
            return Response({
                'success': True,
                'message': 'Registration successful!',
                'customer': CustomerProfileSerializer(customer).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Login customer"""
        serializer = CustomerLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            # Try to authenticate
            customer = Customer.objects.filter(username=username).first()
            if customer and customer.check_password(password):
                if not customer.is_portal_active:
                    return Response({
                        'error': 'Your account is not active. Contact support.'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                refresh = RefreshToken.for_user(customer)
                customer.last_login = timezone.now()
                customer.save()
                
                return Response({
                    'success': True,
                    'message': 'Login successful!',
                    'customer': CustomerProfileSerializer(customer).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_200_OK)
            
            return Response({
                'error': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerPortalViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_customer(self):
        """Get the customer associated with the authenticated user"""
        # Since Customer is not a Django User, we need to get it differently
        # In this case, we'll use the phone number from the request
        # This is a simplified approach - you should implement proper association
        try:
            # For demo, get customer from the request
            phone = self.request.data.get('phone')
            if not phone:
                return None
            return Customer.objects.get(phone=phone)
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
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update customer profile"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        serializer = CustomerProfileSerializer(customer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get customer dashboard data"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        # Get loans
        loans = Loan.objects.filter(customer=customer)
        
        # Calculate summary
        total_loans = loans.count()
        active_loans = loans.filter(status='active').count()
        total_borrowed = loans.aggregate(total=models.Sum('principal'))['total'] or 0
        total_paid = loans.aggregate(total=models.Sum('amount_paid'))['total'] or 0
        total_outstanding = loans.aggregate(total=models.Sum('outstanding_balance'))['total'] or 0
        
        # Get next payment
        next_payment = None
        next_payment_amount = None
        if loans.exists():
            # Get next due schedule
            from loans.models import LoanSchedule
            next_schedule = LoanSchedule.objects.filter(
                loan__in=loans,
                status='pending',
                due_date__gte=timezone.now().date()
            ).order_by('due_date').first()
            if next_schedule:
                next_payment = next_schedule.due_date
                next_payment_amount = next_schedule.total_due
        
        # Get upcoming payments (next 5)
        upcoming_payments = []
        schedules = LoanSchedule.objects.filter(
            loan__in=loans,
            status='pending',
            due_date__gte=timezone.now().date()
        ).order_by('due_date')[:5]
        
        for schedule in schedules:
            upcoming_payments.append({
                'id': schedule.id,
                'loan_no': schedule.loan.loan_no,
                'due_date': schedule.due_date,
                'amount': schedule.total_due,
                'status': schedule.status,
            })
        
        # Get notifications
        from notifications.models import Notification
        notifications = Notification.objects.filter(
            customer=customer,
            is_read=False
        ).order_by('-created_at')[:5]
        
        # Get recent loans
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
            'recent_loans': CustomerLoanDetailSerializer(recent_loans, many=True).data,
            'upcoming_payments': upcoming_payments,
            'notifications': [
                {
                    'id': n.id,
                    'title': n.title,
                    'message': n.message,
                    'created_at': n.created_at,
                    'is_read': n.is_read,
                }
                for n in notifications
            ],
        })
    
    @action(detail=False, methods=['get'])
    def loans(self, request):
        """Get all loans for customer"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        loans = Loan.objects.filter(customer=customer).order_by('-created_at')
        serializer = CustomerLoanDetailSerializer(loans, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def loan_detail(self, request, loan_id=None):
        """Get specific loan details"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        try:
            loan = Loan.objects.get(id=loan_id, customer=customer)
        except Loan.DoesNotExist:
            return Response({'error': 'Loan not found'}, status=404)
        
        serializer = CustomerLoanDetailSerializer(loan)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def payment_history(self, request):
        """Get payment history for customer"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        payments = Payment.objects.filter(loan__customer=customer).order_by('-payment_date')
        serializer = CustomerPaymentHistorySerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def apply_loan(self, request):
        """Apply for a new loan"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        data = request.data
        data['customer'] = customer.id
        
        # Validate product
        try:
            product = LoanProduct.objects.get(id=data['product'], is_active=True)
        except LoanProduct.DoesNotExist:
            return Response({'error': 'Invalid loan product'}, status=400)
        
        # Validate amount
        amount = float(data.get('amount', 0))
        if amount < product.min_amount or amount > product.max_amount:
            return Response({
                'error': f'Amount must be between {product.min_amount} and {product.max_amount}'
            }, status=400)
        
        # Validate term
        term = int(data.get('term_months', 0))
        if term < product.min_term_months or term > product.max_term_months:
            return Response({
                'error': f'Term must be between {product.min_term_months} and {product.max_term_months} months'
            }, status=400)
        
        # Calculate potential loan amount
        # Simple affordability check: monthly payment <= 40% of monthly income
        monthly_income = float(customer.monthly_income)
        monthly_payment = (amount * (product.interest_rate / 100)) / term  # Simplified
        
        if monthly_payment > monthly_income * 0.4:
            return Response({
                'warning': 'This loan may exceed your repayment capacity.',
                'affordability': 'Monthly payment would be {:.2f} TZS, which is {:.1f}% of your income'.format(
                    monthly_payment, (monthly_payment / monthly_income) * 100
                )
            }, status=400)
        
        # Create application
        application = CustomerLoanApplication.objects.create(
            customer=customer,
            product=product,
            amount=amount,
            term_months=term,
            purpose=data.get('purpose', ''),
            business_description=data.get('business_description', ''),
            monthly_income=customer.monthly_income,
            existing_loans=data.get('existing_loans', 0),
            monthly_expenses=data.get('monthly_expenses', 0),
            guarantor_name=data.get('guarantor_name', ''),
            guarantor_phone=data.get('guarantor_phone', ''),
            guarantor_nida=data.get('guarantor_nida', ''),
            guarantor_relationship=data.get('guarantor_relationship', ''),
            status='submitted',
            submitted_at=timezone.now(),
        )
        
        # Send notification
        # TODO: Send email/SMS to customer
        
        serializer = CustomerLoanApplicationSerializer(application)
        return Response({
            'success': True,
            'message': 'Loan application submitted successfully!',
            'application': serializer.data,
            'next_steps': 'Your application is being reviewed. You will receive a notification within 24-48 hours.'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def applications(self, request):
        """Get all loan applications for customer"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        applications = CustomerLoanApplication.objects.filter(customer=customer).order_by('-created_at')
        serializer = CustomerLoanApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def track_application(self, request, app_id=None):
        """Track specific application status"""
        customer = self.get_customer()
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        
        try:
            application = CustomerLoanApplication.objects.get(id=app_id, customer=customer)
        except CustomerLoanApplication.DoesNotExist:
            return Response({'error': 'Application not found'}, status=404)
        
        serializer = CustomerLoanApplicationSerializer(application)
        return Response(serializer.data)
    
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
        else:
            # Declining balance (simplified)
            monthly_rate = product.interest_rate / 100 / 12
            monthly_payment = amount * monthly_rate * (1 + monthly_rate) ** term
            monthly_payment /= (1 + monthly_rate) ** term - 1
            total_interest = monthly_payment * term - amount
            monthly_payment = (amount + total_interest) / term
        
        total_payable = amount + total_interest
        
        # Generate schedule
        from loans.utils.calculations import LoanCalculator
        from datetime import date, timedelta
        
        disbursement_date = date.today()
        calculator = LoanCalculator(
            principal=amount,
            annual_interest_rate=float(product.interest_rate),
            term_months=term,
            disbursement_date=disbursement_date,
            repayment_frequency=product.repayment_frequency
        )
        
        try:
            schedule_summary = calculator.generate_summary(method=product.interest_method)
            schedule = schedule_summary.get('schedule', [])
        except:
            schedule = []
        
        return Response({
            'product': product.product_name,
            'principal': amount,
            'interest_rate': product.interest_rate,
            'term_months': term,
            'total_interest': total_interest,
            'total_payable': total_payable,
            'monthly_payment': (amount + total_interest) / term,
            'repayment_frequency': product.repayment_frequency,
            'schedule': schedule,
            'affordability': {
                'monthly_payment': (amount + total_interest) / term,
                'recommended_income': (amount + total_interest) / term * 2.5,
            }
        })