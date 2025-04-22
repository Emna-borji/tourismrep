# your_app/backends/authentication.py
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model

class EmailBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = get_user_model().objects.get(email=username)  # Use email as username
        except get_user_model().DoesNotExist:
            return None
        
        if user.check_password(password):
            return user
        return None
