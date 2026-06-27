import os
import sys
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Try to run migrations, but don't fail if they don't work
try:
    from django.core.management import call_command
    call_command('migrate', verbosity=0)
except Exception:
    pass  # Silently ignore migration errors

application = get_wsgi_application()