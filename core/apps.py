# core/apps.py
from django.apps import AppConfig
import os
import sys

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        Run migrations and create superuser after Django is fully loaded.
        This avoids the "translation infrastructure cannot be initialized" error.
        """
        # Skip if running migrations or makemigrations
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv:
            return
        
        # Skip if not in production (DEBUG=False)
        from django.conf import settings
        if settings.DEBUG:
            return
        
        try:
            from django.core.management import call_command
            print("=" * 50)
            print("Running migrations on startup...")
            call_command('migrate', verbosity=0, interactive=False)
            print("Migrations completed successfully!")
            
            # Create superuser if missing
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(username='admin').exists():
                print("Creating superuser...")
                User.objects.create_superuser(
                    username='admin',
                    phone='0757170544',
                    email='admin@example.com',
                    password='admin123'
                )
                print("Superuser created successfully!")
            else:
                print("Superuser already exists.")
            print("=" * 50)
        except Exception as e:
            print(f"Startup task error: {e}")