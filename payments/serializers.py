from rest_framework import serializers
from .models import Payment
from loans.models import Loan

class PaymentSerializer(serializers.ModelSerializer):
    loan_details = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    
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
                'customer': {
                    'id': obj.loan.customer.id,
                    'first_name': obj.loan.customer.first_name,
                    'last_name': obj.loan.customer.last_name,
                }
            }
        return None
    
    def get_received_by_name(self, obj):
        if obj.received_by:
            return obj.received_by.get_full_name()
        return None
    
    def validate_amount_paid(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def create(self, validated_data):
        # Generate transaction reference
        import uuid
        validated_data['transaction_ref'] = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        return super().create(validated_data)