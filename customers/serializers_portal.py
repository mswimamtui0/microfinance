# customers/serializers_portal.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Customer, CustomUser
import re


class CustomerRegistrationSerializer(serializers.Serializer):
    """Serializer for customer registration"""
    phone = serializers.CharField(max_length=15)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    gender = serializers.CharField(max_length=1, required=False, default='M')
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    nida_number = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    region = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    district = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    occupation = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate_phone(self, value):
        """Validate phone number is unique and valid"""
        # Remove any spaces or special characters
        value = re.sub(r'[^0-9]', '', value)
        
        if len(value) < 10:
            raise serializers.ValidationError("Phone number must be at least 10 digits")
        
        if Customer.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already registered")
        if CustomUser.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already registered")
        return value

    def validate_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters")
        return value
# customers/serializers_portal.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Customer, CustomUser

class CustomerLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
        else:
            raise serializers.ValidationError('Username and password are required')
        
        data['user'] = user
        return data

    def create(self, validated_data):
        """Create user and customer"""
        # Remove confirm_password
        validated_data.pop('confirm_password', None)
        
        # Get password
        password = validated_data.pop('password')
        
        # Clean phone number
        phone = re.sub(r'[^0-9]', '', validated_data.get('phone'))
        
        # Create user
        user = CustomUser.objects.create(
            username=phone,
            phone=phone,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', '') or '',
            password=make_password(password)
        )
        
        # Create customer
        customer = Customer.objects.create(
            user=user,
            phone=phone,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', '') or '',
            gender=validated_data.get('gender', 'M'),
            date_of_birth=validated_data.get('date_of_birth'),
            nida_number=validated_data.get('nida_number', '') or '',
            region=validated_data.get('region', '') or '',
            district=validated_data.get('district', '') or '',
            occupation=validated_data.get('occupation', '') or '',
            monthly_income=float(validated_data.get('monthly_income', 0)),
            account_status='pending',
            is_phone_verified=False
        )
        
        return customer

    def save(self, **kwargs):
        """Save the customer"""
        return self.create(self.validated_data)


class CustomerLoginSerializer(serializers.Serializer):
    """Serializer for customer login"""
    username = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True)


class CustomerOTPSerializer(serializers.Serializer):
    """Serializer for sending OTP"""
    phone = serializers.CharField(max_length=15)
    purpose = serializers.CharField(max_length=20, required=False, default='registration')


class CustomerVerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP"""
    phone = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)
    purpose = serializers.CharField(max_length=20, required=False, default='registration')


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profile"""
    class Meta:
        model = Customer
        fields = [
            'id', 'phone', 'first_name', 'last_name', 'email', 'gender',
            'date_of_birth', 'nida_number', 'region', 'district', 'occupation',
            'monthly_income', 'account_status', 'kyc_status', 'is_phone_verified',
            'is_nida_verified', 'credit_score'
        ]