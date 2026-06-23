from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.utils import timezone


class LoanProduct(models.Model):
    INTEREST_METHOD_CHOICES = [
        ('declining', 'Declining Balance'),
        ('flat', 'Flat Rate'),
    ]
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom'),
    ]
    
    product_name = models.CharField(max_length=100)
    product_code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    
    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    interest_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    interest_method = models.CharField(
        max_length=20, 
        choices=INTEREST_METHOD_CHOICES, 
        default='declining'
    )
    
    min_term_months = models.PositiveIntegerField(default=1)
    max_term_months = models.PositiveIntegerField(default=24)
    
    repayment_frequency = models.CharField(
        max_length=10, 
        choices=FREQUENCY_CHOICES, 
        default='monthly'
    )
    repayment_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=10.00,
        help_text="Percentage of total loan to pay per period"
    )
    custom_frequency_days = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Number of days between payments for custom frequency"
    )
    
    processing_fee = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Percentage of loan amount"
    )
    
    penalty_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=2.0,
        help_text="Penalty percentage per overdue period"
    )
    grace_period_days = models.PositiveIntegerField(
        default=0,
        help_text="Days after due date before penalty starts"
    )
    max_overdue_days = models.PositiveIntegerField(
        default=30,
        help_text="Days after which loan is marked as defaulted"
    )
    
    allow_early_repayment = models.BooleanField(default=True)
    early_repayment_fee = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Fee percentage for early repayment"
    )
    
    requires_guarantor = models.BooleanField(default=True)
    requires_collateral = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loan_products'
        ordering = ['product_name']
    
    def __str__(self):
        return f"{self.product_name} ({self.interest_rate}%)"
    
    def get_frequency_days(self):
        """Get the number of days between payments"""
        if self.repayment_frequency == 'daily':
            return 1
        elif self.repayment_frequency == 'weekly':
            return 7
        elif self.repayment_frequency == 'monthly':
            return 30
        elif self.repayment_frequency == 'custom':
            return self.custom_frequency_days or 30
        return 30
    
    def get_repayment_percentage(self):
        """Get the percentage to pay per period"""
        return self.repayment_percentage / 100


class Loan(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('active', 'Active'),
        ('paid', 'Paid Off'),
        ('defaulted', 'Defaulted'),
        ('written_off', 'Written Off'),
        ('rejected', 'Rejected'),
    ]
    
    loan_no = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='loans')
    product = models.ForeignKey(LoanProduct, on_delete=models.PROTECT, related_name='loans')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='loans')
    
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    term_months = models.PositiveIntegerField()
    repayment_frequency = models.CharField(max_length=10, choices=LoanProduct.FREQUENCY_CHOICES, default='monthly')
    interest_method = models.CharField(max_length=20, choices=LoanProduct.INTEREST_METHOD_CHOICES, default='declining')
    
    total_interest = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    application_date = models.DateField(auto_now_add=True)
    approval_date = models.DateField(null=True, blank=True)
    disbursement_date = models.DateField(null=True, blank=True)
    first_payment_date = models.DateField(null=True, blank=True)
    maturity_date = models.DateField(null=True, blank=True)
    closed_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_overdue = models.BooleanField(default=False)
    days_overdue = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    
    approved_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_loans'
    )
    disbursed_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disbursed_loans'
    )
    
    created_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_loans'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loans'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['loan_no']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['disbursement_date']),
            models.Index(fields=['maturity_date']),
        ]
    
    def __str__(self):
        return f"{self.loan_no} - {self.customer.full_name}"
    
    def calculate_total_interest(self):
        """Calculate total interest based on method"""
        from decimal import Decimal
        
        principal = Decimal(str(self.principal))
        rate = Decimal(str(self.interest_rate)) / Decimal('100')
        term = Decimal(str(self.term_months))
        
        if self.interest_method == 'flat':
            # Flat rate: Principal × Rate × Term
            return principal * rate * term
        else:
            # Declining balance
            monthly_rate = rate / Decimal('12')
            if monthly_rate == 0:
                return Decimal('0')
            
            # Calculate monthly payment using annuity formula
            one_plus_r = Decimal('1') + monthly_rate
            denominator = Decimal('1') - (one_plus_r ** (-term))
            monthly_payment = (monthly_rate * principal) / denominator
            total_payment = monthly_payment * term
            total_interest = total_payment - principal
            
            return total_interest.quantize(Decimal('0.01'))
    
    def get_total_payable(self):
        """Calculate total amount to repay"""
        self.total_interest = self.calculate_total_interest()
        self.total_payable = self.principal + self.total_interest
        return self.total_payable
    
    def get_payment_period_days(self):
        """Get the number of days between payments"""
        return self.product.get_frequency_days()
    
    def get_number_of_payments(self):
        """Get the total number of payments"""
        total_days = self.term_months * 30
        period_days = self.get_payment_period_days()
        if period_days == 0:
            return 0
        return total_days // period_days
    
    def get_payment_amount(self):
        """Get the amount due per payment period"""
        percentage = self.product.get_repayment_percentage()
        return self.total_payable * Decimal(str(percentage))
    
    def calculate_schedule(self):
        """Generate repayment schedule using the loan calculator"""
        from .utils.calculations import LoanCalculator
        
        calculator = LoanCalculator(
            principal=self.principal,
            annual_interest_rate=float(self.interest_rate),
            term_months=self.term_months,
            disbursement_date=self.disbursement_date or self.application_date,
            repayment_frequency=self.repayment_frequency
        )
        
        schedule_data = calculator.generate_summary(
            method=self.interest_method
        )
        
        return schedule_data
    
    def update_outstanding(self):
        """Update outstanding balance based on payments"""
        from django.db import models
        
        total_paid = self.payments.filter(status='completed').aggregate(
            total=models.Sum('amount_paid')
        )['total'] or 0
        
        self.amount_paid = total_paid
        self.outstanding_balance = self.total_payable - total_paid
        
        if self.outstanding_balance <= 0:
            self.status = 'paid'
            self.closed_date = timezone.now().date()
        
        self.save()
    
    def check_overdue(self):
        """Check if loan has overdue payments"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if self.status in ['paid', 'defaulted', 'written_off', 'rejected']:
            return
        
        overdue_schedules = self.schedules.filter(
            status__in=['pending', 'overdue'],
            due_date__lt=today
        )
        
        if overdue_schedules.exists():
            self.is_overdue = True
            self.days_overdue = (today - overdue_schedules.first().due_date).days
        else:
            self.is_overdue = False
            self.days_overdue = 0
        
        self.save()


class LoanSchedule(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('partial', 'Partially Paid'),
    ]
    
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='schedules')
    installment_no = models.PositiveIntegerField()
    due_date = models.DateField()
    
    principal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_amount = models.DecimalField(max_digits=12, decimal_places=2)
    penalty_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loan_schedules'
        ordering = ['loan', 'installment_no']
        unique_together = [['loan', 'installment_no']]
    
    def __str__(self):
        return f"{self.loan.loan_no} - Installment {self.installment_no}"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.status in ['pending', 'partial'] and self.due_date < timezone.now().date()
    
    def calculate_penalty(self, payment_date):
        """Calculate penalty for this installment"""
        if payment_date <= self.due_date:
            return Decimal('0')
        
        days_overdue = (payment_date - self.due_date).days
        product = self.loan.product
        
        # Check grace period
        if days_overdue <= product.grace_period_days:
            return Decimal('0')
        
        # Calculate penalty
        from decimal import Decimal
        penalty_rate = Decimal(str(product.penalty_rate)) / Decimal('100')
        period_days = self.loan.get_payment_period_days()
        if period_days == 0:
            return Decimal('0')
        overdue_periods = Decimal(str(days_overdue)) / Decimal(str(period_days))
        penalty = Decimal(str(self.total_due)) * penalty_rate * overdue_periods
        
        return penalty.quantize(Decimal('0.01'))
    
    def mark_as_paid(self, amount=None, payment_date=None):
        """Mark schedule as paid"""
        from django.utils import timezone
        from decimal import Decimal
        
        if payment_date is None:
            payment_date = timezone.now().date()
        
        if amount is None:
            amount = self.total_due
        
        # Calculate penalty
        penalty = self.calculate_penalty(payment_date)
        self.penalty_amount = penalty
        
        # Determine total due with penalty
        total_with_penalty = Decimal(str(self.total_due)) + penalty
        
        if amount >= total_with_penalty:
            self.amount_paid = amount
            self.status = 'paid'
            self.paid_date = payment_date
        else:
            self.amount_paid = amount
            self.status = 'partial'
        
        self.save()