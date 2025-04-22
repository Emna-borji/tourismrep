
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime, date
from django.utils.timezone import now
from datetime import timedelta
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator





class CustomUserManager(BaseUserManager):
    def create_user(self, email, firstname, lastname, password=None, **extra_fields):
        """
        Creates and returns a regular user with an email, first name, last name, and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, firstname=firstname, lastname=lastname, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, firstname, lastname, password=None, **extra_fields):
        """
        Creates and returns a superuser with an email, first name, last name, and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, firstname, lastname, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, max_length=150)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)  # Add this line
    firstname = models.CharField(max_length=100)
    lastname = models.CharField(max_length=100)
    phonenumber = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    dateofbirth = models.DateField(blank=True, null=True)
    location = models.ForeignKey(
        'tourism.Destination',  # Or use Destination if it's already defined above
        on_delete=models.SET_NULL,  # or models.CASCADE depending on your logic
        blank=True,
        null=True,
        related_name='related_objects'  # Optional: customize the reverse relation name
    )
    profilepic = models.CharField(max_length=255, blank=True, null=True)
    tripstatus = models.CharField(max_length=50, blank=True, null=True)
    last_login = models.DateTimeField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    blockstartdate = models.DateTimeField(blank=True, null=True)
    blockenddate = models.DateTimeField(blank=True, null=True)
    role = models.CharField(max_length=20, default="user")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["firstname", "lastname"]

    objects = CustomUserManager()

    class Meta:
        db_table = "user"  # Match the existing PostgreSQL table
        managed = False  # Prevent Django from managing migrations for this table

    def __str__(self):
        return self.email
    
    def block_user(self, start_date, end_date):
        """Sets block start and end dates for a user."""
        self.blockstartdate = start_date
        self.blockenddate = end_date
        self.save()
    
    @property
    def is_blocked(self):
        """Check if the user is currently blocked based on blockstartdate and blockenddate."""
        now = timezone.now()  # Get the current time with timezone
        if self.blockstartdate and self.blockenddate:
            start = timezone.make_aware(self.blockstartdate, timezone.get_current_timezone()) if self.blockstartdate.tzinfo is None else self.blockstartdate
            end = timezone.make_aware(self.blockenddate, timezone.get_current_timezone()) if self.blockenddate.tzinfo is None else self.blockenddate
            return start <= now <= end
        return False
    



class ClickHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField()
    clicked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False  # Prevents Django from creating/modifying the table
        db_table = "click_history"  # Matches the existing PostgreSQL table name

    def __str__(self):
        return f"{self.user} clicked on {self.entity_type} (ID: {self.entity_id})"
    
    @classmethod
    def user_recently_clicked(cls, user, entity_type, entity_id, minutes=10):
        """Check if the user has clicked on the same entity within the last X minutes."""
        recent_time = now() - timedelta(minutes=minutes)
        return cls.objects.filter(
            user=user,
            entity_type=entity_type,
            entity_id=entity_id,
            clicked_at__gte=recent_time
        ).exists()
    



        

class SearchHistory(models.Model):
    ENTITY_CHOICES = [
        ('restaurant', 'Restaurant'),
        ('guest_house', 'Guest House'),
        ('museum', 'Museum'),
        ('hotel', 'Hotel'),
        ('festival', 'Festival'),
        ('destination', 'Destination'),
        ('archaeological_site', 'Archaeological Site'),
        ('activity', 'Activity'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    entity_type = models.CharField(max_length=50, choices=ENTITY_CHOICES)
    search_term = models.CharField(max_length=255)
    searched_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.search_term


    class Meta:
        managed = False  # Prevents Django from creating/modifying the table
        db_table = "search_history"  # Matches the existing PostgreSQL table name
        unique_together = ('user', 'entity_type', 'search_term')



# class Preference(models.Model):
#     ACCOMMODATION_CHOICES = [
#         ('hôtel', 'Hôtel'),
#         ("maison d'hôte", "Maison d’hôte"),
#     ]

#     user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, db_column='user_id')
    
#     budget = models.DecimalField(
#         max_digits=10,
#         decimal_places=2,
#         validators=[MinValueValidator(0)],
#         help_text="Maximum budget allowed for the trip."
#     )

#     accommodation = models.CharField(
#         max_length=255,
#         choices=ACCOMMODATION_CHOICES,
#         help_text="Preferred type of accommodation."
#     )

#     stars = models.IntegerField(
#         validators=[MinValueValidator(1), MaxValueValidator(5)],
#         help_text="Preferred accommodation star rating (1-5)."
#     )

#     departure_city = models.ForeignKey(
#         'tourism.Destination',
#         on_delete=models.PROTECT,
#         db_column='departure_city_id',
#         related_name='departure_preferences',
#         help_text="City of departure."
#     )

#     arrival_city = models.ForeignKey(
#         'tourism.Destination',
#         on_delete=models.PROTECT,
#         db_column='arrival_city_id',
#         related_name='arrival_preferences',
#         help_text="City of arrival."
#     )

#     departure_date = models.DateField(help_text="Date of departure.")
#     arrival_date = models.DateField(help_text="Date of arrival.")

#     forks = models.IntegerField(
#         validators=[MinValueValidator(1)],
#         help_text="Number of forks to represent culinary preferences (1+)."
#     )

#     cuisines = models.ManyToManyField(
#         'tourism.Cuisine',
#         through='PreferenceCuisine',
#         related_name='preferences',
#         blank=True
#     )

#     activity_categories = models.ManyToManyField(
#         'tourism.ActivityCategory',
#         through='PreferenceActivityCategory',
#         related_name='preferences',
#         blank=True
#     )

#     class Meta:
#         db_table = 'preference'
#         managed = False  # You created the table manually in PostgreSQL

#     def __str__(self):
#         return f"Preference of {self.user} from {self.departure_city} to {self.arrival_city}"


# # in users/models.py
# class PreferenceCuisine(models.Model):
#     preference = models.ForeignKey(Preference, on_delete=models.CASCADE, db_column='preference_id')
#     cuisine = models.ForeignKey('Cuisine', on_delete=models.CASCADE, db_column='cuisine_id')

#     class Meta:
#         db_table = 'preference_cuisine'
#         unique_together = ('preference', 'cuisine')
#         managed = False

#     def __str__(self):
#         return f"{self.preference} likes {self.cuisine}"


# class PreferenceActivityCategory(models.Model):
#     preference = models.ForeignKey(Preference, on_delete=models.CASCADE, db_column='preference_id')
#     activity_category = models.ForeignKey('ActivityCategory', on_delete=models.CASCADE, db_column='activity_category_id')

#     class Meta:
#         db_table = 'preference_activity_category'
#         unique_together = ('preference', 'activity_category')
#         managed = False

#     def __str__(self):
#         return f"{self.preference} prefers {self.activity_category}"




class Preference(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    
    accommodation = models.CharField(max_length=255, choices=[
        ('hôtel', 'Hôtel'),
        ("maison d'hôte", "Maison d'hôte")
    ])
    
    stars = models.PositiveIntegerField(null=True, blank=True)  # make it nullable to match DB
    guest_house_category = models.CharField(
        max_length=255,
        choices=[
            ('Luxe', 'Luxe'),
            ('Moyenne gamme', 'Moyenne gamme'),
            ('Économie', 'Économie')
        ],
        null=True,
        blank=True
    )

    departure_city = models.ForeignKey(
        "tourism.Destination", on_delete=models.SET_NULL, null=True, related_name="departure_preferences"
    )
    arrival_city = models.ForeignKey(
        "tourism.Destination", on_delete=models.SET_NULL, null=True, related_name="arrival_preferences"
    )
    departure_date = models.DateField()
    arrival_date = models.DateField()
    forks = models.IntegerField()

    def __str__(self):
        return f"{self.user.username}'s preference"

    class Meta:
        db_table = 'preference'
        managed = False  # make sure you don't run migrations



class PreferenceActivityCategory(models.Model):
    preference = models.ForeignKey(Preference, on_delete=models.CASCADE, related_name='activities')
    activity_category = models.ForeignKey("tourism.ActivityCategory", on_delete=models.CASCADE)

    class Meta:
        unique_together = ('preference', 'activity_category')
        db_table = 'preference_activity_category'
        managed = False


class PreferenceCuisine(models.Model):
    preference = models.ForeignKey(Preference, on_delete=models.CASCADE, related_name='cuisines')
    cuisine = models.ForeignKey("tourism.Cuisine", on_delete=models.CASCADE)

    class Meta:
        unique_together = ('preference', 'cuisine')
        db_table = 'preference_cuisine'
        managed = False
