from django.db import models
from users.models import CustomUser


# Create your models here.

from django.core.validators import (
    MinValueValidator,
    MaxValueValidator,
    RegexValidator,
)
from django.core.exceptions import ValidationError

# Just a reusable validator for names, codes, etc.
alphanumeric_validator = RegexValidator(r'^[0-9a-zA-Z\s\-]+$', 'Only alphanumeric characters and dashes are allowed.')



class Guide(models.Model):
    id = models.AutoField(primary_key=True)
    num_gd = models.CharField(max_length=100, blank=True, null=True)
    descatl = models.CharField(max_length=255, blank=True, null=True)
    nom_gui = models.CharField(max_length=255)  # Keep as required
    pre_guide = models.CharField(max_length=255, blank=True)  # Make optional
    sexe = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')], blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    tel = models.CharField(max_length=20, blank=True, null=True)
    dat_deb_activ = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'guide'
        managed = False  # Since the table is already created in the database

    def __str__(self):
        return f"{self.pre_guide} {self.nom_gui}"

class Circuit(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        validators=[alphanumeric_validator]
    )
    circuit_code = models.CharField(
        max_length=50,
        unique=True,
        validators=[RegexValidator(r'^[A-Z0-9]{3,}$', 'Minimum 3 uppercase letters or digits required.')]
    )
    departure_city = models.ForeignKey("tourism.Destination", on_delete=models.CASCADE, related_name="departure_circuits")
    arrival_city = models.ForeignKey("tourism.Destination", on_delete=models.CASCADE, related_name="arrival_circuits")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.0)]
    )
    duration = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(30)]
    )
    description = models.TextField(blank=True, null=True)

    def clean(self):
        if self.departure_city == self.arrival_city:
            raise ValidationError("La ville de départ et d'arrivée doivent être différentes.")

    def __str__(self):
        return self.name
    
    class Meta:
        # unique_together = ('preference', 'activity_category')
        db_table = 'circuit'
        managed = False
    
    

class CircuitSchedule(models.Model):
    circuit = models.ForeignKey(Circuit, on_delete=models.CASCADE, related_name='schedules')
    destination = models.ForeignKey("tourism.Destination", on_delete=models.CASCADE)
    order = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    day = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    distance_km = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0)]
    )

    # Optional relationships
    activity = models.ForeignKey('tourism.Activity', on_delete=models.SET_NULL, null=True, blank=True)
    festival = models.ForeignKey('tourism.Festival', on_delete=models.SET_NULL, null=True, blank=True)
    museum = models.ForeignKey('tourism.Museum', on_delete=models.SET_NULL, null=True, blank=True)
    hotel = models.ForeignKey('tourism.Hotel', on_delete=models.SET_NULL, null=True, blank=True)
    guest_house = models.ForeignKey('tourism.GuestHouse', on_delete=models.SET_NULL, null=True, blank=True)
    restaurant = models.ForeignKey('tourism.Restaurant', on_delete=models.SET_NULL, null=True, blank=True)
    archaeological_site = models.ForeignKey('tourism.ArchaeologicalSite', on_delete=models.SET_NULL, null=True, blank=True)

    def clean(self):
        if self.day > self.circuit.duration:
            raise ValidationError(f"Le jour ({self.day}) dépasse la durée du circuit ({self.circuit.duration}).")

    def __str__(self):
        return f"{self.circuit.name} - Jour {self.day} : {self.destination.name}"
    
    class Meta:
        # unique_together = ('preference', 'activity_category')
        db_table = 'circuit_schedule'
        managed = False
    



class CircuitHistory(models.Model):
    circuit = models.ForeignKey(Circuit, on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, db_column='user_id')
    departure_date = models.DateField()
    arrival_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"History for {self.circuit.name} ({self.departure_date} - {self.arrival_date})"

    class Meta:
        db_table = 'circuit_history'
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=['circuit', 'departure_date', 'arrival_date', 'user'],
                name='unique_circuit_dates_per_user'
            )
        ]
    



