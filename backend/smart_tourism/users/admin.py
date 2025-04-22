from django.contrib import admin
from .models import User

# Register your models here.

# Register the User model to appear in the admin panel
admin.site.register(User)
