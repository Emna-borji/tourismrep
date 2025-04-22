from django.db import models

# Create your models here.



class Destination(models.Model):
    id = models.AutoField(primary_key=True)  # Explicitly set the primary key
    name = models.CharField(max_length=255)
    latitude = models.FloatField()  # Matches 'double precision' in PostgreSQL
    longitude = models.FloatField()  # Matches 'double precision' in PostgreSQL

    class Meta:
        db_table = 'destination'  # Explicitly specify schema
        app_label = 'tourism'
        managed = False

    def __str__(self):
        return self.name
    


class Restaurant(models.Model):
    id = models.AutoField(primary_key=True)  # Primary key, auto-incrementing
    name = models.CharField(max_length=255)  # VARCHAR(255) field
    forks = models.IntegerField()  # Integer field (with a range check in PostgreSQL)
    category = models.CharField(max_length=255, null=True, blank=True)  # Optional VARCHAR(255) field
    description = models.TextField(null=True, blank=True)  # Optional Text field
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Numeric field
    image = models.CharField(max_length=255, null=True, blank=True)  # Optional image field
    phone = models.CharField(max_length=200, null=True, blank=True)  # Optional phone field
    site_web = models.CharField(max_length=255, null=True, blank=True)  # Optional website URL field
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)  # Numeric field for latitude
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)  # Numeric field for longitude
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp for creation
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp for last update

    class Meta:
        db_table = 'tourism.restaurant'  # Specify the exact table name in PostgreSQL
        app_label = 'tourism'  # Link to your 'tourism' app
        managed = False

    def __str__(self):
        return self.name

    


