from django.contrib import admin
from .models import Loan, LoanProduct, LoanSchedule

@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'product_code', 'interest_rate', 'min_amount', 'max_amount', 'is_active']
    list_filter = ['is_active', 'interest_method', 'repayment_frequency']
    search_fields = ['product_name', 'product_code']
    ordering = ['product_name']
    
    fieldsets = (
        ('Product Information', {
            'fields': ('product_name', 'product_code', 'description')
        }),
        ('Amount & Interest', {
            'fields': ('min_amount', 'max_amount', 'interest_rate', 'interest_method')
        }),
        ('Term & Repayment', {
            'fields': ('min_term_months', 'max_term_months', 'repayment_frequency')
        }),
        ('Fees', {
            'fields': ('processing_fee', 'late_penalty_rate')
        }),
        ('Status', {
            'fields': ('requires_guarantor', 'requires_collateral', 'is_active')
        }),
    )

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['loan_no', 'customer', 'product', 'principal', 'status', 'outstanding_balance', 'created_at']
    list_filter = ['status', 'product', 'branch', 'disbursement_date']
    search_fields = ['loan_no', 'customer__first_name', 'customer__last_name']
    readonly_fields = ['loan_no', 'total_interest', 'total_payable', 'amount_paid', 'outstanding_balance']
    
    fieldsets = (
        ('Loan Information', {
            'fields': ('loan_no', 'customer', 'product', 'branch')
        }),
        ('Amount Details', {
            'fields': ('principal', 'approved_amount', 'interest_rate', 'term_months')
        }),
        ('Repayment', {
            'fields': ('repayment_frequency', 'interest_method')
        }),
        ('Calculations', {
            'fields': ('total_interest', 'total_payable', 'amount_paid', 'outstanding_balance')
        }),
        ('Dates', {
            'fields': ('application_date', 'approval_date', 'disbursement_date', 'maturity_date')
        }),
        ('Status', {
            'fields': ('status', 'is_overdue', 'days_overdue', 'notes')
        }),
    )

@admin.register(LoanSchedule)
class LoanScheduleAdmin(admin.ModelAdmin):
    list_display = ['loan', 'installment_no', 'due_date', 'total_due', 'status']
    list_filter = ['status', 'due_date']
    search_fields = ['loan__loan_no']