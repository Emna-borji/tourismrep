from django.contrib import admin

# Register your models here.
from .models import Destination
from .models import Restaurant

@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'latitude', 'longitude')

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'forks', 'category', 'price', 'latitude', 'longitude', 'created_at', 'updated_at')