# core/wsgi.py
import os
from django.core.wsgi import get_wsgi_application
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Run migrations automatically
try:
    call_command('migrate', verbosity=0)
    print("Migrations applied successfully!")
except Exception as e:
    print(f"Migration error: {e}")

application = get_wsgi_application()