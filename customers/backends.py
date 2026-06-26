# customers/backends.py
from django.contrib.auth.backends import ModelBackend
from .models import CustomUser

class PhoneAuthBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            return None
        
        try:
            # Try to find user by username
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            try:
                # Try to find user by phone
                user = CustomUser.objects.get(phone=username)
            except CustomUser.DoesNotExist:
                return None
        
        if user and user.check_password(password):
            return user
        return None
    
    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None