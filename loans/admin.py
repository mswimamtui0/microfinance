# loans/admin.py
from django.contrib import admin
from django import forms
from .models import LoanProduct, Loan, LoanSchedule


class LoanProductAdminForm(forms.ModelForm):
    class Meta:
        model = LoanProduct
        fields = '__all__'
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
        }


@admin.register(LoanProduct)
class LoanProductAdmin(admin.ModelAdmin):
    form = LoanProductAdminForm
    
    list_display = [
        'product_code',
        'product_name', 
        'interest_rate', 
        'min_amount', 
        'max_amount', 
        'min_term_months', 
        'max_term_months',
        'repayment_frequency',
        'is_active'
    ]
    
    list_filter = [
        'is_active', 
        'interest_method', 
        'repayment_frequency',
        'requires_guarantor',
        'requires_collateral'
    ]
    
    search_fields = [
        'product_name', 
        'product_code', 
        'description'
    ]
    
    ordering = ['product_name']
    
    readonly_fields = [
        'created_at', 
        'updated_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('product_name', 'product_code', 'description', 'is_active')
        }),
        ('Financial Limits', {
            'fields': ('min_amount', 'max_amount', 'interest_rate', 'interest_method')
        }),
        ('Loan Terms', {
            'fields': ('min_term_months', 'max_term_months', 'repayment_frequency', 'repayment_percentage')
        }),
        ('Custom Frequency', {
            'fields': ('custom_frequency_days',),
            'classes': ('collapse',)
        }),
        ('Fees & Penalties', {
            'fields': ('processing_fee', 'penalty_rate', 'grace_period_days', 'max_overdue_days')
        }),
        ('Features', {
            'fields': ('allow_early_repayment', 'early_repayment_fee', 'requires_guarantor', 'requires_collateral')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_fieldsets(self, request, obj=None):
        """Override to conditionally show/hide custom frequency days"""
        fieldsets = super().get_fieldsets(request, obj)
        if obj and obj.repayment_frequency != 'custom':
            # Hide custom frequency days if not custom frequency
            pass
        return fieldsets


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = [
        'loan_no', 
        'customer', 
        'principal', 
        'status', 
        'application_date',
        'disbursement_date',
        'maturity_date'
    ]
    
    list_filter = [
        'status', 
        'application_date',
        'disbursement_date'
    ]
    
    search_fields = [
        'loan_no', 
        'customer__phone', 
        'customer__first_name', 
        'customer__last_name'
    ]
    
    readonly_fields = [
        'created_at', 
        'updated_at'
    ]
    
    fieldsets = (
        ('Loan Information', {
            'fields': ('loan_no', 'customer', 'product', 'branch')
        }),
        ('Amount Details', {
            'fields': ('principal', 'approved_amount', 'interest_rate', 'term_months')
        }),
        ('Payment Details', {
            'fields': ('repayment_frequency', 'interest_method', 'total_interest', 'total_payable')
        }),
        ('Payment Status', {
            'fields': ('amount_paid', 'outstanding_balance', 'status')
        }),
        ('Dates', {
            'fields': ('application_date', 'approval_date', 'disbursement_date', 'first_payment_date', 'maturity_date', 'closed_date')
        }),
        ('Overdue Information', {
            'fields': ('is_overdue', 'days_overdue', 'notes'),
            'classes': ('collapse',)
        }),
        ('Staff', {
            'fields': ('approved_by', 'disbursed_by', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Save the model with created_by set to current user"""
        if not obj.pk:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(LoanSchedule)
class LoanScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'loan', 
        'installment_no', 
        'due_date', 
        'total_due', 
        'status', 
        'paid_date'
    ]
    
    list_filter = [
        'status', 
        'due_date'
    ]
    
    search_fields = [
        'loan__loan_no', 
        'loan__customer__phone'
    ]
    
    fieldsets = (
        ('Schedule Information', {
            'fields': ('loan', 'installment_no', 'due_date')
        }),
        ('Amount Details', {
            'fields': ('principal_amount', 'interest_amount', 'penalty_amount', 'total_due', 'amount_paid')
        }),
        ('Payment Status', {
            'fields': ('status', 'paid_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )