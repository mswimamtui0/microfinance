# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group

# Remove default groups (optional)
admin.site.unregister(Group)

# Customize admin site
admin.site.site_header = "MicroFinance Admin"
admin.site.site_title = "MicroFinance System"
admin.site.index_title = "Welcome to MicroFinance Admin"