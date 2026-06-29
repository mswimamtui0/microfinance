# notifications/admin.py
from django.contrib import admin
from .models import Notification, SMSLog, EmailLog

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'is_read', 'created_at']
    list_filter = ['is_read']
    search_fields = ['title']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'phone', 'message', 'sent_at']
    list_filter = ['sent_at']
    search_fields = ['phone', 'message']
    readonly_fields = ['sent_at']
    ordering = ['-sent_at']

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'email', 'subject', 'delivery_status', 'sent_at']
    list_filter = ['delivery_status']
    search_fields = ['email', 'subject']
    readonly_fields = ['sent_at']
    ordering = ['-sent_at']
    