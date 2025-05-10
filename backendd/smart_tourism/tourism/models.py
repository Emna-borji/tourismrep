from django.db import models
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import requests
from users.models import CustomUser
from django.core.validators import MinValueValidator, MaxValueValidator, URLValidator, RegexValidator

# Create your models here.

class EntityImage(models.Model):
    id = models.AutoField(primary_key=True)
    entity_type = models.CharField(
        max_length=50,
        choices=[
            ('restaurant', 'Restaurant'),
            ('hotel', 'Hotel'),
            ('museum', 'Museum'),
            ('festival', 'Festival'),
            ('guest_house', 'Guest House'),
            ('activity', 'Activity'),
            ('archaeological_site', 'Archaeological Site'),
        ]
    )
    entity_id = models.IntegerField()
    image_url = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'entity_images'
        app_label = 'tourism'
        managed = False

    def __str__(self):
        return f"Image for {self.entity_type} {self.entity_id}"

class Equipment(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    hotel = models.BooleanField(default=False)
    guest_house = models.BooleanField(default=False)

    class Meta:
        db_table = 'equipment'
        managed = False

    def __str__(self):
        return f"{self.name} (Hotel: {self.hotel}, Guest House: {self.guest_house})"

class Destination(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()

    class Meta:
        db_table = 'destination'
        app_label = 'tourism'
        managed = False

    def __str__(self):
        return self.name

class ActivityCategory(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'activity_category'
        app_label = 'tourism'
        managed = False

    def __str__(self):
        return self.name

class Cuisine(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'cuisine'
        managed = False

    def __str__(self):
        return self.name

class Restaurant(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        validators=[
            RegexValidator(
                r'^[a-zA-ZÀ-ÿ0-9\-\' ]*$',
                'Name must contain only letters (including accented), numbers, spaces, dashes, and apostrophes.'
            )
        ]    )
    forks = models.IntegerField(
        validators=[
            MinValueValidator(1, message="Forks must be at least 1."),
            MaxValueValidator(3, message="Forks cannot be more than 3.")
        ]
    )
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.01, 'Price must be greater than zero')]
    )
    image = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        validators=[RegexValidator(r'^\+?[0-9]*$', 'Phone number must be numeric and can optionally start with a "+"')]
    )
    site_web = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    address = models.TextField(blank=True, null=True)  # Already exists
    destination = models.ForeignKey(
        Destination,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    cuisine = models.ForeignKey(
        'Cuisine',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'restaurant'
        app_label = 'tourism'
        managed = False

    def __str__(self):
        return self.name

    @staticmethod
    def get_governorate(lat, lon):
        if lat is None or lon is None:
            return None
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "Accept-Language": "fr",
            "User-Agent": "smart_tourism/1.0 (emnaborji2578@gmail.com)"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('address', {}).get('state', "Inconnu")
        except requests.RequestException as e:
            print(f"Error fetching governorate: {e}")
            return None

    def save(self, *args, **kwargs):
        self.full_clean()
        governorate = self.get_governorate(self.latitude, self.longitude)
        if governorate:
            normalized_governorate = governorate.replace("Gouvernorat ", "").strip()
            destination = Destination.objects.filter(name__icontains=normalized_governorate).first()
            if destination:
                self.destination = destination
            else:
                print(f"Destination not found for governorate: {governorate}")
        super().save(*args, **kwargs)

class Activity(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                r'^[a-zA-ZÀ-ÿ0-9\-\' ]*$',
                'Name must contain only letters (including accented), numbers, spaces, dashes, and apostrophes.'
            )
        ]
    )
    category = models.ForeignKey(
        ActivityCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='category_id'
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.01, 'Price must be greater than zero')]
    )
    description = models.TextField(blank=True, null=True)
    site_web = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    address = models.TextField(blank=True, null=True)  # Added address field
    image_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    destination = models.ForeignKey('Destination', on_delete=models.SET_NULL, null=True, blank=True, db_column='destination_id')

    class Meta:
        db_table = 'activity'
        managed = False

    def __str__(self):
        return self.name if self.name else "Unnamed Activity"

    @staticmethod
    def get_governorate(lat, lon):
        if lat is None or lon is None:
            return None
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "Accept-Language": "fr",
            "User-Agent": "smart_tourism/1.0 (emnaborji2578@gmail.com)"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('address', {}).get('state', "Inconnu")
        except requests.RequestException as e:
            print(f"Error fetching governorate: {e}")
            return None

    def save(self, *args, **kwargs):
        self.full_clean()
        governorate = self.get_governorate(self.latitude, self.longitude)
        if governorate:
            normalized_governorate = governorate.replace("Gouvernorat ", "").strip()
            destination = Destination.objects.filter(name__icontains=normalized_governorate).first()
            if destination:
                self.destination = destination
            else:
                print(f"Destination not found for governorate: {governorate}")
        super().save(*args, **kwargs)

# models.py (only showing the ArchaeologicalSite model for brevity)
class ArchaeologicalSite(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        validators=[
        RegexValidator(
                r'^[a-zA-ZÀ-ÿ0-9\-\' ]*$',
                'Name must contain only letters (including accented), numbers, spaces, dashes, and apostrophes.'
            )
        ]
    )
    address = models.TextField(blank=True, null=True)  # Add address field
    description = models.TextField(blank=True, null=True)
    period = models.CharField(max_length=100, blank=True, null=True)
    site_type = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                   validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                    validators=[MinValueValidator(-180), MaxValueValidator(180)])
    image = models.TextField(blank=True, null=True)
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'archaeological_site'
        managed = False

    def __str__(self):
        return self.name

    @staticmethod
    def get_governorate(lat, lon):
        if lat is None or lon is None:
            return None
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "Accept-Language": "fr",
            "User-Agent": "smart_tourism/1.0 (emnaborji2578@gmail.com)"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('address', {}).get('state', "Inconnu")
        except requests.RequestException as e:
            print(f"Error fetching governorate: {e}")
            return None

    def save(self, *args, **kwargs):
        self.full_clean()
        governorate = self.get_governorate(self.latitude, self.longitude)
        if governorate:
            normalized_governorate = governorate.replace("Gouvernorat ", "").strip()
            destination = Destination.objects.filter(name__icontains=normalized_governorate).first()
            if destination:
                self.destination = destination
            else:
                print(f"Destination not found for governorate: {governorate}")
        super().save(*args, **kwargs)

class Festival(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        validators=[
        RegexValidator(
                r'^[a-zA-ZÀ-ÿ0-9\-\' ]*$',
                'Name must contain only letters (including accented), numbers, spaces, dashes, and apostrophes.'
            )
        ]
    )
    description = models.TextField()
    image = models.CharField(max_length=255)
    date = models.DateField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                   validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                    validators=[MinValueValidator(-180), MaxValueValidator(180)])
    address = models.TextField(blank=True, null=True)  # Added address field
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        validators=[MinValueValidator(0.01, 'Price must be greater than zero')]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'festival'
        managed = False

    def __str__(self):
        return self.name

    @staticmethod
    def get_governorate(lat, lon):
        if lat is None or lon is None:
            return None
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "Accept-Language": "fr",
            "User-Agent": "smart_tourism/1.0 (emnaborji2578@gmail.com)"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('address', {}).get('state', "Inconnu")
        except requests.RequestException as e:
            print(f"Error fetching governorate: {e}")
            return None

    def save(self, *args, **kwargs):
        self.full_clean()
        governorate = self.get_governorate(self.latitude, self.longitude)
        if governorate:
            normalized_governorate = governorate.replace("Gouvernorat ", "").strip()
            destination = Destination.objects.filter(name__icontains=normalized_governorate).first()
            if destination:
                self.destination = destination
            else:
                print(f"Destination not found for governorate: {governorate}")
        super().save(*args, **kwargs)

class GuestHouse(models.Model):
    CATEGORY_CHOICES = [
        ('Basique', 'Basique'),
        ('Standard', 'Standard'),
        ('Premium', 'Premium'),
        ('Luxe', 'Luxe'),
    ]
    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        validators=[
            RegexValidator(
                r'^[a-zA-ZÀ-ÿ0-9\-\' ]*$',
                'Name must contain only letters (including accented), numbers, spaces, dashes, and apostrophes.'
            )
        ]
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Standard')
    description = models.TextField(null=True, blank=True)
    phone = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        validators=[RegexValidator(r'^\+?[0-9]*$', 'Phone number must be numeric and can optionally start with a "+"')]
    )
    email = models.EmailField(max_length=100, null=True, blank=True)
    website = models.CharField(max_length=255, null=True, blank=True,
                               validators=[URLValidator(message="Enter a valid website URL.")])
    equipments = models.ManyToManyField(Equipment, related_name="guest_houses", blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                   validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                    validators=[MinValueValidator(-180), MaxValueValidator(180)])
    address = models.TextField(blank=True, null=True)  # Added address field
    images = models.TextField(null=True, blank=True)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        validators=[MinValueValidator(0.01, 'Price must be greater than zero')]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'guest_house'
        managed = False

    def __str__(self):
        return self.name if self.name else "Guest House"

    @staticmethod
    def get_governorate(lat, lon):
        if lat is None or lon is None:
            return None
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "Accept-Language": "fr",
            "User-Agent": "smart_tourism/1.0 (emnaborji2578@gmail.com)"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('address', {}).get('state', "Inconnu")
        except requests.RequestException as e:
            print(f"Error fetching governorate: {e}")
            return None

    def save(self, *args, **kwargs):
        self.full_clean()
        governorate = self.get_governorate(self.latitude, self.longitude)
        if governorate:
            normalized_governorate = governorate.replace("Gouvernorat ", "").strip()
            destination = Destination.objects.filter(name__icontains=normalized_governorate).first()
            if destination:
                self.destination = destination
            else:
                print(f"Destination not found for governorate: {governorate}")
        super().save(*args, **kwargs)

class Guide(models.Model):
    num_gd = models.AutoField(primary_key=True)
    descatl = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    gender = models.CharField(max_length=1, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guide'
        managed = False

    def __str__(self):
        return self.name if self.name else "Guide"

class Hotel(models.Model):
    name = models.CharField(max_length=255,
                            validators=[
            RegexValidator(
                r'^[a-zA-ZÀ-ÿ0-9\-\' ]*$',
                'Name must contain only letters (including accented), numbers, spaces, dashes, and apostrophes.'
            )
        ])
    stars = models.IntegerField(null=True, blank=True,
                                validators=[MinValueValidator(1), MaxValueValidator(5)])
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                validators=[MinValueValidator(0)])
    image = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True,
                             validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Invalid phone number format.")])
    website = models.CharField(max_length=255, null=True, blank=True,
                               validators=[URLValidator(message="Enter a valid website URL.")])
    equipments = models.ManyToManyField(Equipment, related_name="hotels", blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                   validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True,
                                    validators=[MinValueValidator(-180), MaxValueValidator(180)])
    address = models.TextField(blank=True, null=True)  # Added address field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    destination = models.ForeignKey('Destination', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'hotel'
        managed = False

    def __str__(self):
        return self.name

    @staticmethod
    def get_governorate(lat, lon):
        if lat is None or lon is None:
            return None
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "Accept-Language": "fr",
            "User-Agent": "smart_tourism/1.0 (emnaborji2578@gmail.com)"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('address', {}).get('state', "Inconnu")
        except requests.RequestException as e:
            print(f"Error fetching governorate: {e}")
            return None

    def save(self, *args, **kwargs):
        if self.price is not None and self.price < 0:
            raise ValueError("Price cannot be negative.")
        if self.stars is not None and (self.stars < 1 or self.stars > 5):
            raise ValueError("Stars must be between 1 and 5.")
        if self.phone and not self.phone.isdigit():
            raise ValueError("Phone number should contain only digits.")
        governorate = self.get_governorate(self.latitude, self.longitude)
        if governorate:
            from tourism.models import Destination
            normalized_governorate = governorate.replace("Gouvernorat ", "").strip()
            destination = Destination.objects.filter(name__icontains=normalized_governorate).first()
            if destination:
                self.destination = destination
            else:
                print(f"Destination not found for governorate: {governorate}")
        super().save(*args, **kwargs)

class Museum(models.Model):
    name = models.CharField(
        max_length=255,
        validators=[
            RegexValidator(
                r'^[a-zA-ZÀ-ÿ0-9\-\' ]*$',
                'Name must contain only letters (including accented), numbers, spaces, dashes, and apostrophes.'
            )
        ]
    )
    description = models.TextField(null=True, blank=True)
    image = models.CharField(max_length=255, null=True, blank=True)
    hours = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        validators=[RegexValidator(
            regex=r'\d{1,2}\s*(AM|PM)\s*-\s*\d{1,2}\s*(AM|PM)', 
            message="Hours must be in the format '9 AM - 5 PM'."
        )]
    )
    website = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        validators=[RegexValidator(
            regex=r'https?://[^\s]+', 
            message="Invalid website URL format."
        )]
    )
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    address = models.TextField(blank=True, null=True)  # Added address field
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'museum'
        managed = False

    def __str__(self):
        return self.name

    @staticmethod
    def get_governorate(lat, lon):
        if lat is None or lon is None:
            return None
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "Accept-Language": "fr",
            "User-Agent": "smart_tourism/1.0 (emnaborji2578@gmail.com)"
        }
        try:
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get('address', {}).get('state', "Inconnu")
        except requests.RequestException as e:
            print(f"Error fetching governorate: {e}")
            return None

    def save(self, *args, **kwargs):
        self.full_clean()
        governorate = self.get_governorate(self.latitude, self.longitude)
        if governorate:
            normalized_governorate = governorate.replace("Gouvernorat ", "").strip()
            destination = Destination.objects.filter(name__icontains=normalized_governorate).first()
            if destination:
                self.destination = destination
            else:
                print(f"Destination not found for governorate: {governorate}")
        super().save(*args, **kwargs)

class Review(models.Model):
    ENTITY_TYPES = [
        ('guest_house', 'Guest House'),
        ('restaurant', 'Restaurant'),
        ('hotel', 'Hotel'),
        ('museum', 'Museum'),
        ('festival', 'Festival'),
        ('activity', 'Activity'),
        ('archaeological_sites', 'Archaeological Sites'),
        ('circuit', 'Circuit'),
    ]
    entity_type = models.CharField(max_length=50, choices=ENTITY_TYPES)
    entity_id = models.IntegerField()
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    comment = models.TextField(null=True, blank=True)
    image = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'review'
        constraints = [
            models.CheckConstraint(check=models.Q(rating__gte=1, rating__lte=5), name='rating_check'),
        ]

    def __str__(self):
        return f"Review by {self.user.username} for {self.entity_type} #{self.entity_id}"

class Favorite(models.Model):
    ENTITY_TYPES = [
        ('activity', 'Activity'),
        ('museum', 'Museum'),
        ('hotel', 'Hotel'),
        ('restaurant', 'Restaurant'),
        ('guest_house', 'Guest House'),
        ('archaeological_site', 'Archaeological Site'),
        ('festival', 'Festival'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    entity_type = models.CharField(max_length=30, choices=ENTITY_TYPES)
    entity_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'favorite'
        unique_together = ('user', 'entity_type', 'entity_id')
        verbose_name = "Favorite"
        verbose_name_plural = "Favorites"

    def __str__(self):
        return f"{self.user.username} favorite - {self.entity_type} {self.entity_id}"
    