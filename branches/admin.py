# branches/admin.py
from django.contrib import admin
from .models import Branch

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'region', 'phone', 'is_active']
    list_filter = ['is_active', 'region']
    search_fields = ['name', 'code', 'region']