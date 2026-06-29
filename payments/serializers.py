# payments/serializers.py
from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    loan_no = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['payment_date', 'transaction_ref']
    
    def get_loan_no(self, obj):
        return obj.loan.loan_no if obj.loan else None