# core/wsgi.py
import os
from django.core.wsgi import get_wsgi_application
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Auto-run migrations on every startup
try:
    call_command('migrate', verbosity=0)
    print("Migrations applied!")
    
    # Auto-create superuser if missing
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        print("Superuser created!")
except Exception as e:
    print(f"Startup error: {e}")

application = get_wsgi_application()