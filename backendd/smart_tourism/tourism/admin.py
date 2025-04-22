from django.contrib import admin

# Register your models here.
from .models import Destination
from .models import Restaurant
from .models import Activity
from .models import ArchaeologicalSite
from .models import Festival
from .models import GuestHouse
from .models import Guide
from .models import Hotel
from .models import Museum

@admin.register(Museum)
class MuseumAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'hours', 'website', 'latitude', 'longitude', 'created_at', 'updated_at', 'destination')

@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'stars', 'price', 'phone', 'created_at', 'updated_at', 'destination')

@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ('num_gd', 'name', 'gender', 'phone', 'created_at', 'updated_at')

@admin.register(GuestHouse)
class GuestHouseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'email', 'website', 'latitude', 'longitude', 'created_at', 'updated_at', 'destination')

@admin.register(Festival)
class FestivalAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'date', 'latitude', 'longitude', 'created_at', 'updated_at', 'destination')





@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'latitude', 'longitude')






