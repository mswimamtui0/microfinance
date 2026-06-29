# notifications/admin.py
from django.contrib import admin
from .models import Notification, SMSLog, EmailLog

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'is_read', 'created_at']
    list_filter = ['is_read']
    search_fields = ['title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

@admin.register(SMSLog)
class SMSLogAdmin(admin.ModelAdmin):
    list_display = ['phone', 'message', 'status', 'sent_at']
    list_filter = ['status']
    search_fields = ['phone', 'message']
    readonly_fields = ['sent_at', 'created_at']
    ordering = ['-sent_at']

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'subject', 'status', 'sent_at']
    list_filter = ['status']
    search_fields = ['recipient', 'subject']
    readonly_fields = ['sent_at', 'created_at']
    ordering = ['-sent_at']