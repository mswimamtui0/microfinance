# payments/admin.py
from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['loan', 'amount_paid', 'payment_method', 'status', 'payment_date']
    list_filter = ['status', 'payment_method']
    search_fields = ['loan__loan_no', 'transaction_ref']
    readonly_fields = ['payment_date', 'created_at', 'updated_at']
    ordering = ['-payment_date']