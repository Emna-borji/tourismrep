from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from django.utils.translation import gettext_lazy as _

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'firstname', 'lastname', 'is_staff', 'is_active', 'role', 'created_at', 'updated_at')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'role')
    search_fields = ('email', 'firstname', 'lastname')
    ordering = ('email',)
    
    # Fields for the user form
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('firstname', 'lastname', 'phonenumber', 'gender', 'dateofbirth', 'location', 'profilepic', 'tripstatus')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'role')}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
        (_('Block dates'), {'fields': ('blockstartdate', 'blockenddate')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'firstname', 'lastname', 'role', 'is_staff', 'is_active'),
        }),
    )
    
    # Set the custom manager methods for creating users and superusers
    def save_model(self, request, obj, form, change):
        if not change:  # Only set the password if it's a new user
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)

# Register the CustomUser model with the CustomUserAdmin
admin.site.register(CustomUser, CustomUserAdmin)
