# loans/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.http import JsonResponse
from .models import Loan, LoanProduct, LoanSchedule
from .serializers import LoanSerializer, LoanProductSerializer, LoanScheduleSerializer
from .utils.calculations import LoanCalculator, RepaymentScheduleGenerator
from customers.models import Customer
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]  # ✅ Only one permission_classes
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin can see all loans
        if user.is_superuser or user.role == 'admin':
            pass
        # Manager sees only their branch
        elif user.role == 'manager':
            if user.branch:
                queryset = queryset.filter(branch=user.branch)
            else:
                queryset = queryset.none()
        # Officer sees only loans they created
        elif user.role == 'officer':
            queryset = queryset.filter(created_by=user)
        # Teller sees all loans in their branch
        elif user.role == 'teller':
            if user.branch:
                queryset = queryset.filter(branch=user.branch)
            else:
                queryset = queryset.none()
        # Viewer sees all loans (read-only)
        elif user.role == 'viewer':
            pass
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new loan and generate schedule"""
        try:
            data = request.data
            logger.info(f"Creating loan with data: {data}")
            
            # Validate required fields
            required_fields = ['customer', 'product', 'principal', 'term_months']
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                return Response({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get product
            try:
                product = LoanProduct.objects.get(id=data['product'], is_active=True)
                logger.info(f"Product found: {product.product_name}")
            except LoanProduct.DoesNotExist:
                return Response({
                    'error': 'Invalid or inactive loan product'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get customer
            try:
                customer = Customer.objects.get(id=data['customer'])
                logger.info(f"Customer found: {customer.full_name}")
            except Customer.DoesNotExist:
                return Response({
                    'error': 'Customer does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate amount - convert to Decimal
            try:
                principal = Decimal(str(data['principal']))
                if principal < Decimal(str(product.min_amount)):
                    return Response({
                        'error': f'Principal amount must be at least {product.min_amount}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                if principal > Decimal(str(product.max_amount)):
                    return Response({
                        'error': f'Principal amount cannot exceed {product.max_amount}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError) as e:
                return Response({
                    'error': f'Invalid principal amount: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate term
            try:
                term_months = int(data['term_months'])
                if term_months < product.min_term_months:
                    return Response({
                        'error': f'Term must be at least {product.min_term_months} months'
                    }, status=status.HTTP_400_BAD_REQUEST)
                if term_months > product.max_term_months:
                    return Response({
                        'error': f'Term cannot exceed {product.max_term_months} months'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid term months'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user
            user = request.user
            if not user or not user.id:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get branch from user
            branch = None
            if hasattr(user, 'branch') and user.branch:
                branch = user.branch
            
            # Create loan with Decimal values
            loan = Loan(
                loan_no=f"LN-{timezone.now().strftime('%Y%m%d')}-{timezone.now().microsecond}",
                customer=customer,
                product=product,
                branch=branch,
                principal=principal,
                interest_rate=Decimal(str(product.interest_rate)),
                term_months=term_months,
                repayment_frequency=product.repayment_frequency,
                interest_method=product.interest_method,
                status='draft',
                created_by=user,
                application_date=timezone.now().date()
            )
            
            # Calculate total payable
            loan.total_interest = loan.calculate_total_interest()
            loan.total_payable = loan.principal + loan.total_interest
            loan.outstanding_balance = loan.total_payable
            loan.save()
            
            logger.info(f"Loan created: {loan.loan_no}")
            
            # Generate repayment schedule
            try:
                schedule_generator = RepaymentScheduleGenerator()
                schedule_generator.generate_schedule(loan)
                logger.info(f"Schedule generated for loan: {loan.loan_no}")
            except Exception as e:
                logger.error(f"Error generating schedule: {str(e)}")
            
            # Get serialized loan
            serializer = self.get_serializer(loan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating loan: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Failed to create loan: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def calculate_summary(self, request, pk=None):
        """Get loan summary with real-time calculations"""
        loan = self.get_object()
        calculator = LoanCalculator(loan)
        summary = calculator.generate_summary()
        return Response(summary)
    
    @action(detail=True, methods=['get'])
    def realtime_status(self, request, pk=None):
        """Get real-time loan status"""
        loan = self.get_object()
        
        from datetime import date, timedelta
        
        today = date.today()
        
        total_payable = float(loan.total_payable)
        amount_paid = float(loan.amount_paid)
        outstanding = float(loan.outstanding_balance)
        
        if loan.disbursement_date:
            days_elapsed = (today - loan.disbursement_date).days
            total_days = loan.term_months * 30
            days_remaining = max(0, total_days - days_elapsed)
        else:
            days_elapsed = 0
            total_days = loan.term_months * 30
            days_remaining = total_days
        
        if total_days > 0 and total_payable > 0:
            per_day = total_payable / total_days
            per_hour = per_day / 24
            per_minute = per_hour / 60
            per_second = per_minute / 60
        else:
            per_day = 0
            per_hour = 0
            per_minute = 0
            per_second = 0
        
        next_due = None
        if loan.schedules.exists():
            next_schedule = loan.schedules.filter(status='pending').first()
            if next_schedule:
                next_due = next_schedule.due_date
            else:
                last_schedule = loan.schedules.last()
                if last_schedule:
                    next_due = last_schedule.due_date
        
        return Response({
            'loan_id': loan.id,
            'loan_no': loan.loan_no,
            'status': loan.status,
            'total_payable': total_payable,
            'amount_paid': amount_paid,
            'outstanding_balance': outstanding,
            'per_second': per_second,
            'per_minute': per_minute,
            'per_hour': per_hour,
            'per_day': per_day,
            'time_elapsed': {
                'days': days_elapsed,
            },
            'total_days': total_days,
            'days_remaining': days_remaining,
            'next_due_date': next_due,
            'is_overdue': loan.is_overdue,
            'days_overdue': loan.days_overdue,
        })
    
    @action(detail=True, methods=['post'])
    def calculate_early_repayment(self, request, pk=None):
        """Calculate early repayment amount"""
        loan = self.get_object()
        payment_date = request.data.get('payment_date')
        
        if payment_date:
            from datetime import datetime
            try:
                payment_date = datetime.strptime(payment_date, '%Y-%m-%d').date()
            except ValueError:
                payment_date = None
        
        calculator = LoanCalculator(loan)
        result = calculator.calculate_early_repayment(payment_date)
        return Response(result)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a loan"""
        loan = self.get_object()
        
        if loan.status not in ['draft', 'pending']:
            return Response({
                'error': 'Loan can only be approved from draft or pending status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        loan.status = 'approved'
        loan.approved_by = request.user
        loan.approval_date = timezone.now().date()
        loan.approved_amount = loan.principal
        loan.save()
        
        return Response({'message': 'Loan approved successfully'})
    
    @action(detail=True, methods=['post'])
    def disburse(self, request, pk=None):
        """Disburse approved loan"""
        loan = self.get_object()
        
        if loan.status != 'approved':
            return Response({
                'error': 'Loan must be in approved status to disburse'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        loan.status = 'active'
        loan.disbursed_by = request.user
        loan.disbursement_date = timezone.now().date()
        
        total_days = loan.term_months * 30
        loan.maturity_date = loan.disbursement_date + timezone.timedelta(days=total_days)
        
        period_days = loan.product.get_frequency_days()
        loan.first_payment_date = loan.disbursement_date + timezone.timedelta(days=period_days)
        
        loan.save()
        
        schedules = loan.schedules.all()
        period_days = loan.product.get_frequency_days()
        
        for idx, schedule in enumerate(schedules):
            schedule.due_date = loan.disbursement_date + timezone.timedelta(days=period_days * (idx + 1))
            schedule.save()
        
        return Response({'message': 'Loan disbursed successfully'})
    
    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Get loan repayment schedule"""
        loan = self.get_object()
        schedules = loan.schedules.all()
        serializer = LoanScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def calculate_penalty(self, request, pk=None):
        """Calculate penalty for overdue loan"""
        loan = self.get_object()
        data = request.data
        days_overdue = data.get('days_overdue', loan.days_overdue)
        overdue_amount = data.get('overdue_amount', float(loan.outstanding_balance))
        
        calculator = LoanCalculator(loan)
        penalty = calculator.calculate_penalty(
            overdue_amount=overdue_amount,
            days_overdue=days_overdue,
            penalty_rate=float(loan.product.penalty_rate)
        )
        
        return Response({'penalty_amount': penalty})


class LoanProductViewSet(viewsets.ModelViewSet):
    queryset = LoanProduct.objects.all()
    serializer_class = LoanProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset