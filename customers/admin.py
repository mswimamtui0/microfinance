# customers/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Customer, Guarantor, CustomerOTP, CustomerLoanApplication, CustomerDocument

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'phone', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser']
    list_filter = ['is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'phone', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': ('phone', 'is_customer'),
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {
            'fields': ('phone', 'is_customer'),
        }),
    )

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['phone', 'first_name', 'last_name', 'email', 'account_status', 'created_at']
    list_filter = ['account_status', 'kyc_status', 'gender']
    search_fields = ['phone', 'first_name', 'last_name', 'email', 'nida_number']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

@admin.register(Guarantor)
class GuarantorAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'customer', 'relationship', 'is_verified']
    list_filter = ['relationship', 'is_verified']
    search_fields = ['full_name', 'phone', 'email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(CustomerOTP)
class CustomerOTPAdmin(admin.ModelAdmin):
    list_display = ['phone', 'code', 'purpose', 'is_used', 'created_at']
    list_filter = ['purpose', 'is_used']
    search_fields = ['phone', 'code']
    readonly_fields = ['created_at']

@admin.register(CustomerLoanApplication)
class CustomerLoanApplicationAdmin(admin.ModelAdmin):
    list_display = ['customer', 'loan_type', 'amount_requested', 'status', 'application_date']
    list_filter = ['status', 'loan_type']
    search_fields = ['customer__phone', 'customer__first_name']
    readonly_fields = ['application_date', 'created_at', 'updated_at']

@admin.register(CustomerDocument)
class CustomerDocumentAdmin(admin.ModelAdmin):
    list_display = ['customer', 'document_type', 'is_verified', 'uploaded_at']
    list_filter = ['document_type', 'is_verified']
    search_fields = ['customer__phone', 'document_number']
    readonly_fields = ['uploaded_at']