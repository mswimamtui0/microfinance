from rest_framework import serializers
from .models import Payment
from loans.models import Loan, LoanSchedule

class PaymentSerializer(serializers.ModelSerializer):
    loan_details = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    loan_no = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['transaction_ref', 'received_by', 'status', 'created_at', 'updated_at']
    
    def get_loan_details(self, obj):
        if obj.loan:
            return {
                'id': obj.loan.id,
                'loan_no': obj.loan.loan_no,
                'principal': obj.loan.principal,
                'outstanding_balance': obj.loan.outstanding_balance,
                'total_payable': obj.loan.total_payable,
                'customer': {
                    'id': obj.loan.customer.id,
                    'first_name': obj.loan.customer.first_name,
                    'last_name': obj.loan.customer.last_name,
                }
            }
        return None
    
    def get_loan_no(self, obj):
        if obj.loan:
            return obj.loan.loan_no
        return None
    
    def get_customer_name(self, obj):
        if obj.loan and obj.loan.customer:
            return f"{obj.loan.customer.first_name} {obj.loan.customer.last_name}"
        return None
    
    def get_received_by_name(self, obj):
        if obj.received_by:
            return obj.received_by.get_full_name()
        return None
    
    def to_representation(self, instance):
        """Customize the response data"""
        data = super().to_representation(instance)
        
        # Add loan and customer data directly to the response
        if instance.loan:
            data['loan_no'] = instance.loan.loan_no
            data['customer'] = {
                'id': instance.loan.customer.id,
                'first_name': instance.loan.customer.first_name,
                'last_name': instance.loan.customer.last_name,
                'phone': instance.loan.customer.phone,
            }
            data['loan_details'] = {
                'principal': instance.loan.principal,
                'outstanding_balance': instance.loan.outstanding_balance,
                'total_payable': instance.loan.total_payable,
            }
        
        return data

        # payments/serializers.py
from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'