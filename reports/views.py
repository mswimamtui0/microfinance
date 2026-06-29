# reports/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.db.models.functions import TruncMonth
from loans.models import Loan
from payments.models import Payment
from customers.models import Customer

class PortfolioReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Base queryset
        loans = Loan.objects.all()
        payments = Payment.objects.filter(status='completed')
        
        if start_date:
            loans = loans.filter(disbursement_date__gte=start_date)
            payments = payments.filter(payment_date__date__gte=start_date)
        if end_date:
            loans = loans.filter(disbursement_date__lte=end_date)
            payments = payments.filter(payment_date__date__lte=end_date)
        
        # Portfolio metrics
        total_portfolio = loans.aggregate(total=Sum('principal'))['total'] or 0
        active_loans = loans.filter(status='active').count()
        total_customers = Customer.objects.count()  # ✅ FIXED: use count() not filter(status='active')
        
        # Collection metrics
        total_collected = payments.aggregate(total=Sum('amount_paid'))['total'] or 0
        expected_collections = loans.filter(status='active').aggregate(
            total=Sum('outstanding_balance')  # ✅ FIXED: use outstanding_balance
        )['total'] or 0
        
        collection_rate = (total_collected / expected_collections * 100) if expected_collections > 0 else 0
        
        # Portfolio quality
        total_loans = loans.count()
        overdue_loans = loans.filter(is_overdue=True).count()
        defaulted_loans = loans.filter(status='defaulted').count()
        
        performing_loans = total_loans - overdue_loans - defaulted_loans
        performing_rate = (performing_loans / total_loans * 100) if total_loans > 0 else 0
        overdue_rate = (overdue_loans / total_loans * 100) if total_loans > 0 else 0
        default_rate = (defaulted_loans / total_loans * 100) if total_loans > 0 else 0
        
        # PAR 30 (Portfolio at Risk > 30 days)
        par_30 = loans.filter(
            is_overdue=True,
            days_overdue__gte=30
        ).count()
        par_30_rate = (par_30 / total_loans * 100) if total_loans > 0 else 0
        
        return Response({
            'total_portfolio': float(total_portfolio),
            'active_loans': active_loans,
            'total_customers': total_customers,
            'collection_rate': round(collection_rate, 2),
            'total_collected': float(total_collected),
            'expected_collections': float(expected_collections),
            'performing': round(performing_rate, 2),
            'overdue_rate': round(overdue_rate, 2),
            'default_rate': round(default_rate, 2),
            'par_30': round(par_30_rate, 2),
            'overdue_loans': overdue_loans,
            'defaulted_loans': defaulted_loans,
        })


class CollectionsReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        payments = Payment.objects.filter(status='completed')
        
        if start_date:
            payments = payments.filter(payment_date__date__gte=start_date)
        if end_date:
            payments = payments.filter(payment_date__date__lte=end_date)
        
        total_collected = payments.aggregate(total=Sum('amount_paid'))['total'] or 0
        
        expected = Loan.objects.filter(status='active').aggregate(
            total=Sum('outstanding_balance')  # ✅ FIXED
        )['total'] or 0
        
        overdue_amount = Loan.objects.filter(
            is_overdue=True
        ).aggregate(total=Sum('outstanding_balance'))['total'] or 0  # ✅ FIXED
        
        efficiency = (total_collected / expected * 100) if expected > 0 else 0
        
        monthly_collections = payments.annotate(
            month=TruncMonth('payment_date')
        ).values('month').annotate(
            total=Sum('amount_paid')
        ).order_by('month')
        
        # Convert monthly collections to list
        monthly_data = []
        for item in monthly_collections:
            if item['month']:
                monthly_data.append({
                    'month': item['month'].strftime('%Y-%m'),
                    'total': float(item['total'])
                })
        
        return Response({
            'expected': float(expected),
            'actual': float(total_collected),
            'efficiency': round(efficiency, 2),
            'overdue': float(overdue_amount),
            'monthly_breakdown': monthly_data,
        })