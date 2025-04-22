# from django.db import models

# # Create your models here.


# class CustomUser(models.Model):
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     email = models.EmailField(max_length=150, unique=True)
#     phone_number = models.CharField(max_length=20, blank=True, null=True)
#     gender = models.CharField(max_length=10, blank=True, null=True)
#     password = models.CharField(max_length=255)
#     date_of_birth = models.DateField(blank=True, null=True)
#     location = models.CharField(max_length=255, blank=True, null=True)
#     profile_pic = models.CharField(max_length=255, blank=True, null=True)
#     trip_status = models.CharField(max_length=50, blank=True, null=True)
#     last_login = models.DateTimeField(blank=True, null=True)
#     is_active = models.BooleanField(default=True)
#     is_blocked = models.BooleanField(default=False)
#     block_start_date = models.DateTimeField(blank=True, null=True)
#     block_end_date = models.DateTimeField(blank=True, null=True)
#     role = models.CharField(max_length=20, choices=[('user', 'User'), ('admin', 'Admin')], default='user')

#     # Remove managed = False if you want Django to manage the table
#     class Meta:
#         db_table = 'user'
#         app_label = 'tourism'

#     def __str__(self):
#         return f"{self.first_name} {self.last_name} ({self.role})"
