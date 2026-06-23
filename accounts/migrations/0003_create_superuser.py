from django.db import migrations

def create_superuser(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    if not User.objects.filter(username='micro').exists():
        User.objects.create_superuser(
            username='micro',
            email='mswimamtui0@gmail.com',
            password='1234567'
        )

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(create_superuser),
    ]