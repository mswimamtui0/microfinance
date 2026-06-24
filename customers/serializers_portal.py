from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Customer, CustomerOTP, CustomerLoanApplication
from loans.models import Loan, LoanSchedule
from payments.models import Payment
import re

class CustomerRegistrationSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    nida_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    gender = serializers.ChoiceField(choices=['M', 'F', 'O'])
    date_of_birth = serializers.DateField()
    region = serializers.CharField(max_length=50)
    district = serializers.CharField(max_length=50)
    occupation = serializers.CharField(max_length=100)
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    
    def validate_phone(self, value):
        # Validate Tanzanian phone number
        if not re.match(r'^(0|\+255)[67]\d{8}$', value):
            raise serializers.ValidationError("Invalid phone number format. Use 0712345678 or +255712345678")
        
        if Customer.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already registered")
        return value
    
    def validate_nida_number(self, value):
        if value and Customer.objects.filter(nida_number=value).exists():
            raise serializers.ValidationError("NIDA number already registered")
        return value
    
    def validate_email(self, value):
        if value and Customer.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data
    
    def save(self):
        # Generate customer number
        import uuid
        customer_no = f"CUST{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:4].upper()}"
        
        customer = Customer.objects.create(
            customer_no=customer_no,
            phone=self.validated_data['phone'],
            nida_number=self.validated_data.get('nida_number', ''),
            email=self.validated_data.get('email', ''),
            first_name=self.validated_data['first_name'],
            last_name=self.validated_data['last_name'],
            gender=self.validated_data['gender'],
            date_of_birth=self.validated_data['date_of_birth'],
            region=self.validated_data['region'],
            district=self.validated_data['district'],
            occupation=self.validated_data['occupation'],
            monthly_income=self.validated_data['monthly_income'],
            username=self.validated_data['phone'],
            is_portal_active=True,
        )
        customer.set_password(self.validated_data['password'])
        
        return customer


class CustomerLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class CustomerOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    purpose = serializers.ChoiceField(choices=['registration', 'login', 'password_reset'])


class CustomerVerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)
    purpose = serializers.ChoiceField(choices=['registration', 'login', 'password_reset'])


class CustomerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_no', 'phone', 'nida_number', 'email',
            'first_name', 'middle_name', 'last_name', 'full_name',
            'gender', 'date_of_birth', 'age',
            'region', 'district', 'ward', 'street',
            'occupation', 'monthly_income',
            'risk_level', 'status',
            'is_portal_active', 'last_login',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['customer_no', 'created_at', 'updated_at']


class CustomerLoanApplicationSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerLoanApplication
        fields = '__all__'
        read_only_fields = ['customer', 'status', 'submitted_at', 'created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        return obj.customer.full_name
    
    def get_product_name(self, obj):
        return obj.product.product_name
    
    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user.customer
        return super().create(validated_data)


class CustomerLoanSummarySerializer(serializers.Serializer):
    total_loans = serializers.IntegerField()
    active_loans = serializers.IntegerField()
    total_borrowed = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_outstanding = serializers.DecimalField(max_digits=12, decimal_places=2)
    next_payment = serializers.DateField(allow_null=True)
    next_payment_amount = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)


class CustomerLoanDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    schedules = serializers.SerializerMethodField()
    payment_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Loan
        fields = [
            'id', 'loan_no', 'customer_name', 'product_name',
            'principal', 'total_interest', 'total_payable',
            'amount_paid', 'outstanding_balance',
            'disbursement_date', 'maturity_date', 'status',
            'schedules', 'payment_summary'
        ]
    
    def get_customer_name(self, obj):
        return obj.customer.full_name
    
    def get_product_name(self, obj):
        return obj.product.product_name
    
    def get_schedules(self, obj):
        from loans.serializers import LoanScheduleSerializer
        return LoanScheduleSerializer(obj.schedules.all(), many=True).data
    
    def get_payment_summary(self, obj):
        payments = obj.payments.all()
        return {
            'total_payments': payments.count(),
            'total_amount': sum(p.amount_paid for p in payments),
            'completed_payments': payments.filter(status='completed').count(),
        }


class CustomerPaymentHistorySerializer(serializers.ModelSerializer):
    loan_no = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'transaction_ref', 'loan_no', 'amount_paid',
            'payment_method', 'payment_date', 'status', 'notes'
        ]
    
    def get_loan_no(self, obj):
        return obj.loan.loan_no if obj.loan else None


class CustomerDashboardSerializer(serializers.Serializer):
    profile = CustomerProfileSerializer()
    summary = CustomerLoanSummarySerializer()
    recent_loans = CustomerLoanDetailSerializer(many=True)
    upcoming_payments = serializers.ListField()
    notifications = serializers.ListField()