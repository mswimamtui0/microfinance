# customers/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import re

# ============================================
# CUSTOM USER MODEL
# ============================================
class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, unique=True)
    is_customer = models.BooleanField(default=True)
    
    groups = models.ManyToManyField(
        Group,
        related_name='customuser_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return f"{self.phone} - {self.get_full_name()}"

# ============================================
# OTP MODEL - Simple OTP (keep for compatibility)
# ============================================
class OTP(models.Model):
    PURPOSES = (
        ('registration', 'Registration'),
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
    )
    
    phone = models.CharField(max_length=15)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSES, default='registration')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
    
    def has_exceeded_attempts(self):
        return self.attempts >= self.max_attempts
    
    def increment_attempts(self):
        self.attempts += 1
        self.save()
    
    def __str__(self):
        return f"{self.phone} - {self.code} ({self.purpose})"

# ============================================
# CUSTOMER MODEL - Main Customer Profile
# ============================================
class Customer(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='customer',
        null=True,
        blank=True
    )
    
    phone = models.CharField(max_length=15, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=254, blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='M')
    date_of_birth = models.DateField(null=True, blank=True)
    nida_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    profile_image = models.ImageField(upload_to='customers/', blank=True, null=True)
    
    region = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    ward = models.CharField(max_length=100, blank=True, null=True)
    street = models.CharField(max_length=100, blank=True, null=True)
    
    occupation = models.CharField(max_length=100, blank=True, null=True)
    employer = models.CharField(max_length=200, blank=True, null=True)
    monthly_income = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    employment_type = models.CharField(max_length=50, blank=True, null=True)
    
    business_name = models.CharField(max_length=200, blank=True, null=True)
    business_type = models.CharField(max_length=100, blank=True, null=True)
    business_registration = models.CharField(max_length=50, blank=True, null=True)
    
    account_status = models.CharField(
        max_length=20, 
        choices=(
            ('pending', 'Pending'),
            ('active', 'Active'),
            ('suspended', 'Suspended'),
            ('blocked', 'Blocked'),
            ('closed', 'Closed'),
        ),
        default='pending'
    )
    kyc_status = models.CharField(
        max_length=20,
        choices=(
            ('not_started', 'Not Started'),
            ('pending', 'Pending'),
            ('verified', 'Verified'),
            ('rejected', 'Rejected'),
        ),
        default='not_started'
    )
    is_phone_verified = models.BooleanField(default=False)
    is_nida_verified = models.BooleanField(default=False)
    
    credit_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(1000)]
    )
    total_borrowed = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_repaid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    active_loans = models.IntegerField(default=0)
    defaulted_loans = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['nida_number']),
            models.Index(fields=['account_status']),
        ]
    
    def __str__(self):
        return f"{self.phone} - {self.first_name} {self.last_name}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_age(self):
        if self.date_of_birth:
            today = timezone.now().date()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None
    
    def is_eligible_for_loan(self):
        return (
            self.account_status == 'active' and
            self.kyc_status == 'verified' and
            self.credit_score >= 300 and
            self.defaulted_loans < 2
        )
    
    def can_apply_for_loan(self):
        return (
            self.is_eligible_for_loan() and
            self.active_loans < 3 and
            self.total_borrowed < (self.monthly_income * 5)
        )
    
    def get_full_address(self):
        parts = []
        if self.street:
            parts.append(self.street)
        if self.ward:
            parts.append(self.ward)
        if self.district:
            parts.append(self.district)
        if self.region:
            parts.append(self.region)
        return ', '.join(parts) if parts else 'No address provided'

# ============================================
# GUARANTOR MODEL
# ============================================
class Guarantor(models.Model):
    RELATIONSHIP_CHOICES = (
        ('spouse', 'Spouse'),
        ('parent', 'Parent'),
        ('sibling', 'Sibling'),
        ('friend', 'Friend'),
        ('colleague', 'Colleague'),
        ('business_partner', 'Business Partner'),
        ('other', 'Other'),
    )
    
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        related_name='guarantors'
    )
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15)
    email = models.EmailField(max_length=254, blank=True, null=True)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    nida_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    occupation = models.CharField(max_length=100, blank=True, null=True)
    employer = models.CharField(max_length=200, blank=True, null=True)
    monthly_income = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    address = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.full_name} - {self.customer.phone}"
    
    class Meta:
        verbose_name = 'Guarantor'
        verbose_name_plural = 'Guarantors'
        ordering = ['-created_at']

# ============================================
# CUSTOMER OTP MODEL
# ============================================
class CustomerOTP(models.Model):
    PURPOSES = (
        ('registration', 'Registration'),
        ('login', 'Login'),
        ('password_reset', 'Password Reset'),
        ('transaction', 'Transaction'),
        ('profile_update', 'Profile Update'),
    )
    
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        related_name='otps',
        null=True,
        blank=True
    )
    phone = models.CharField(max_length=15, db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSES, default='registration')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
    
    def has_exceeded_attempts(self):
        return self.attempts >= self.max_attempts
    
    def increment_attempts(self):
        self.attempts += 1
        self.save()
    
    def __str__(self):
        return f"{self.phone} - {self.code} ({self.purpose})"
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['code']),
        ]

# ============================================
# CUSTOMER LOAN APPLICATION MODEL
# ============================================
class CustomerLoanApplication(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
        ('completed', 'Completed'),
        ('defaulted', 'Defaulted'),
        ('cancelled', 'Cancelled'),
    )
    
    LOAN_TYPES = (
        ('personal', 'Personal Loan'),
        ('business', 'Business Loan'),
        ('micro', 'Micro Loan'),
        ('group', 'Group Loan'),
        ('emergency', 'Emergency Loan'),
        ('education', 'Education Loan'),
        ('agriculture', 'Agriculture Loan'),
    )
    
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        related_name='loan_applications'
    )
    
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES, default='personal')
    amount_requested = models.DecimalField(max_digits=15, decimal_places=2)
    amount_approved = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    amount_disbursed = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    processing_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    term_months = models.IntegerField(default=12)
    repayment_frequency = models.CharField(
        max_length=20,
        choices=(
            ('weekly', 'Weekly'),
            ('biweekly', 'Bi-Weekly'),
            ('monthly', 'Monthly'),
            ('quarterly', 'Quarterly'),
        ),
        default='monthly'
    )
    
    purpose = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    business_plan = models.FileField(upload_to='loan_documents/', blank=True, null=True)
    
    guarantor_name = models.CharField(max_length=200, blank=True, null=True)
    guarantor_phone = models.CharField(max_length=15, blank=True, null=True)
    guarantor_nida = models.CharField(max_length=20, blank=True, null=True)
    guarantor_relationship = models.CharField(max_length=50, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    application_date = models.DateTimeField(auto_now_add=True)
    review_date = models.DateTimeField(null=True, blank=True)
    approval_date = models.DateTimeField(null=True, blank=True)
    disbursement_date = models.DateTimeField(null=True, blank=True)
    completion_date = models.DateTimeField(null=True, blank=True)
    
    reviewed_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_customer_applications'  # ✅ FIXED
    )
    approved_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_customer_applications'  # ✅ FIXED
    )
    
    notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    admin_comments = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.customer.phone} - {self.loan_type} - {self.status}"
    
    def get_total_repayment(self):
        if self.amount_approved:
            total_interest = self.amount_approved * (self.interest_rate / 100) * (self.term_months / 12)
            return self.amount_approved + total_interest + self.processing_fee
        return 0
    
    def get_monthly_payment(self):
        total = self.get_total_repayment()
        if self.term_months > 0:
            return total / self.term_months
        return 0
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['loan_type']),
        ]

# ============================================
# CUSTOMER DOCUMENTS
# ============================================
class CustomerDocument(models.Model):
    DOCUMENT_TYPES = (
        ('nida', 'NIDA ID'),
        ('passport', 'Passport'),
        ('voter', 'Voter ID'),
        ('driving', 'Driving License'),
        ('business', 'Business Registration'),
        ('profile', 'Profile Photo'),
        ('other', 'Other'),
    )
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document_number = models.CharField(max_length=50, blank=True, null=True)
    document_file = models.FileField(upload_to='documents/')
    document_name = models.CharField(max_length=200)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verified_documents'
    )
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.customer.phone} - {self.get_document_type_display()}"