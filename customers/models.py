from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.hashers import make_password, check_password
import uuid

class Customer(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('blacklisted', 'Blacklisted'),
        ('deceased', 'Deceased'),
    ]
    
    RISK_LEVEL_CHOICES = [
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
    ]
    
    # Unique Identifiers
    customer_no = models.CharField(max_length=20, unique=True)
    phone = models.CharField(max_length=15, unique=True)
    nida_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    
    # Customer Portal Credentials
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    is_portal_active = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    # Personal Information
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    
    # Address
    region = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    ward = models.CharField(max_length=50, blank=True)
    street = models.CharField(max_length=100, blank=True)
    
    # Employment
    occupation = models.CharField(max_length=100)
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Risk & Status
    risk_level = models.CharField(max_length=10, choices= RISK_LEVEL_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    
    # Relationships
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_customers')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, related_name='customers')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer_no']),
            models.Index(fields=['nida_number']),
            models.Index(fields=['phone']),
            models.Index(fields=['username']),
        ]
    
    def __str__(self):
        return f"{self.customer_no} - {self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.middle_name} {self.last_name}".strip()
    
    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save()
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)


class CustomerOTP(models.Model):
    """Store OTP for customer verification"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='otps')
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=[
        ('registration', 'Registration'),
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
        ('verification', 'Verification'),
    ])
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'customer_otps'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer.phone} - {self.otp_code}"
    
    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and self.expires_at > timezone.now()


class CustomerLoanApplication(models.Model):
    """Customer self-service loan applications"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
        ('completed', 'Completed'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='loan_applications')
    product = models.ForeignKey('loans.LoanProduct', on_delete=models.PROTECT, related_name='customer_applications')
    
    # Application Details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    term_months = models.PositiveIntegerField()
    purpose = models.TextField()
    business_description = models.TextField(blank=True)
    
    # Financial Info
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    existing_loans = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Guarantor Info (optional)
    guarantor_name = models.CharField(max_length=100, blank=True)
    guarantor_phone = models.CharField(max_length=15, blank=True)
    guarantor_nida = models.CharField(max_length=20, blank=True)
    guarantor_relationship = models.CharField(max_length=50, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Documents (stored as JSON)
    documents = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customer_loan_applications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer.full_name} - {self.amount} - {self.status}"