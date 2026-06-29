# customers/serializers_portal.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Customer, CustomUser
import re


class CustomerRegistrationSerializer(serializers.Serializer):
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
        value = re.sub(r'[^0-9]', '', value)
        if len(value) < 10:
            raise serializers.ValidationError("Phone number must be at least 10 digits")
        if Customer.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already registered")
        return value

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        phone = re.sub(r'[^0-9]', '', validated_data.get('phone'))
        
        user = CustomUser.objects.create(
            username=phone,
            phone=phone,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            password=make_password(password)
        )
        
        customer = Customer.objects.create(
            user=user,
            phone=phone,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            gender=validated_data.get('gender', 'M'),
            date_of_birth=validated_data.get('date_of_birth'),
            nida_number=validated_data.get('nida_number', ''),
            region=validated_data.get('region', ''),
            district=validated_data.get('district', ''),
            occupation=validated_data.get('occupation', ''),
            monthly_income=validated_data.get('monthly_income', 0),
            account_status='pending',
            is_phone_verified=False
        )
        return customer

    def save(self, **kwargs):
        return self.create(self.validated_data)


class CustomerLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True)


class CustomerOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    purpose = serializers.CharField(max_length=20, required=False, default='registration')


class CustomerVerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp_code = serializers.CharField(max_length=6)
    purpose = serializers.CharField(max_length=20, required=False, default='registration')


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'phone', 'first_name', 'last_name', 'email', 'gender',
            'date_of_birth', 'nida_number', 'region', 'district', 'occupation',
            'monthly_income', 'account_status', 'kyc_status', 'is_phone_verified',
            'is_nida_verified', 'credit_score'
        ]