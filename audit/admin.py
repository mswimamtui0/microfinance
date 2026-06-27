# audit/admin.py
from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'action', 'model_name', 'created_at']
    list_filter = ['action', 'model_name']
    search_fields = ['user__username', 'model_name', 'object_id']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Audit Information', {
            'fields': ('user', 'action', 'model_name', 'object_id', 'changes')
        }),
        ('Request Information', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )