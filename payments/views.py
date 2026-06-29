# payments/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum
from .models import Payment
from .serializers import PaymentSerializer
from loans.models import Loan, LoanSchedule
import logging
import uuid

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by loan
        loan_id = self.request.query_params.get('loan')
        if loan_id:
            queryset = queryset.filter(loan_id=loan_id)
        
        # Filter by customer (through loan)
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(loan__customer_id=customer_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new payment"""
        try:
            data = request.data
            logger.info(f"Creating payment with data: {data}")
            
            # Validate required fields
            required_fields = ['loan', 'amount_paid', 'payment_method', 'payment_date']
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                return Response({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get loan
            try:
                loan = Loan.objects.get(id=data['loan'])
                logger.info(f"Loan found: {loan.loan_no}")
            except Loan.DoesNotExist:
                return Response({
                    'error': 'Loan does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check loan status
            if loan.status not in ['active', 'disbursed']:
                return Response({
                    'error': f'Loan is not active (status: {loan.status})'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate amount
            try:
                amount = float(data['amount_paid'])
                if amount <= 0:
                    return Response({
                        'error': 'Amount must be greater than 0'
                    }, status=status.HTTP_400_BAD_REQUEST)
                if amount > float(loan.outstanding_balance):
                    return Response({
                        'error': f'Amount exceeds outstanding balance of {loan.outstanding_balance}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid amount'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user
            user = request.user
            if not user or not user.id:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate transaction reference
            transaction_ref = f"PAY-{uuid.uuid4().hex[:8].upper()}"
            
            # Create payment
            payment = Payment(
                loan=loan,
                amount_paid=amount,
                payment_method=data['payment_method'],
                payment_date=data['payment_date'],
                received_by=user,
                status='completed',
                notes=data.get('notes', ''),
                transaction_ref=transaction_ref
            )
            payment.save()
            logger.info(f"Payment created: {payment.id}")
            
            # Update loan
            loan.amount_paid = float(loan.amount_paid) + amount
            loan.outstanding_balance = float(loan.total_payable) - float(loan.amount_paid)
            
            if loan.outstanding_balance <= 0:
                loan.status = 'paid'
                loan.closed_date = timezone.now().date()
            else:
                loan.status = 'active'
            
            loan.save()
            
            # Update payment status
            if loan.outstanding_balance <= 0:
                payment.status = 'completed'
            else:
                payment.status = 'partial'
            payment.save()
            
            # Update loan schedule
            self._update_loan_schedule(loan, payment)
            
            serializer = self.get_serializer(payment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Failed to create payment: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _update_loan_schedule(self, loan, payment):
        """Update loan schedule based on payment"""
        try:
            # Get pending schedules ordered by due date
            schedules = loan.schedules.filter(
                status__in=['pending', 'partial']
            ).order_by('due_date')
            
            remaining = float(payment.amount_paid)
            
            for schedule in schedules:
                if remaining <= 0:
                    break
                
                due_amount = float(schedule.total_due) - float(schedule.amount_paid)
                
                if remaining >= due_amount:
                    # Full payment for this schedule
                    schedule.amount_paid = float(schedule.total_due)
                    schedule.status = 'paid'
                    schedule.paid_date = payment.payment_date
                    remaining -= due_amount
                else:
                    # Partial payment
                    schedule.amount_paid = float(schedule.amount_paid) + remaining
                    schedule.status = 'partial'
                    remaining = 0
                
                schedule.save()
                
        except Exception as e:
            logger.warning(f"Error updating loan schedule: {str(e)}")
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payment summary"""
        total_payments = Payment.objects.filter(status='completed').aggregate(
            total=Sum('amount_paid')
        )['total'] or 0
        
        today = timezone.now().date()
        today_payments = Payment.objects.filter(
            status='completed',
            payment_date__date=today
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        return Response({
            'total_collected': total_payments,
            'today_collected': today_payments,
            'total_transactions': Payment.objects.filter(status='completed').count(),
        })