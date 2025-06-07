from django.db import models
from rest_framework import serializers
from .models import CustomUser
from tourism.models import Cuisine, ActivityCategory
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from .models import Preference, PreferenceActivityCategory, PreferenceCuisine
from tourism.models import Destination
from tourism.models import ActivityCategory
from tourism.models import Cuisine
import re
from datetime import datetime
from tourism.serializers import DestinationSerializer






# class CustomUserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = CustomUser
#         fields = ['email', 'firstname', 'lastname', 'phonenumber', 'gender', 'dateofbirth', 
#             'location', 'profilepic','role','password', 'is_blocked']
#     def validate_password(self, value):
#         if not value:
#             raise serializers.ValidationError("Password is required.")
#         # You can add more password validation logic here if needed.
#         return value

#     def create(self, validated_data):
#         password = validated_data.pop('password')
#         user = CustomUser(**validated_data)
#         user.password = make_password(password)  # Ensure the password is hashed
#         user.save()
#         return user
    

class CustomUserSerializer(serializers.ModelSerializer):
    location = DestinationSerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(), source='location', write_only=True
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'firstname', 'lastname', 'phonenumber', 'gender', 'dateofbirth',
            'location', 'location_id', 'profilepic', 'role', 'password', 'is_blocked', 'blockstartdate', 'blockenddate'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'read_only': True},
            'is_blocked': {'read_only': True},
        }

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("L'email est requis.")
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def validate_firstname(self, value):
        if not value:
            raise serializers.ValidationError("Le prénom est requis.")
        if not re.match(r"^[a-zA-Z\s'-]+$", value):
            raise serializers.ValidationError("Le prénom ne doit contenir que des lettres, espaces, tirets ou apostrophes.")
        return value

    def validate_lastname(self, value):
        if not value:
            raise serializers.ValidationError("Le nom est requis.")
        if not re.match(r"^[a-zA-Z\s'-]+$", value):
            raise serializers.ValidationError("Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes.")
        return value

    def validate_phonenumber(self, value):
        if not value:
            raise serializers.ValidationError("Le numéro de téléphone est requis.")
        if not re.match(r"^\+216\d{8}$", value):
            raise serializers.ValidationError("Le numéro de téléphone doit être au format +21612345678.")
        return value

    def validate_gender(self, value):
        if not value:
            raise serializers.ValidationError("Le genre est requis.")
        if value not in ['male', 'female']:
            raise serializers.ValidationError("Le genre doit être 'male' ou 'female'.")
        return value

    def validate_dateofbirth(self, value):
        if not value:
            raise serializers.ValidationError("La date de naissance est requise.")
        today = datetime.strptime("2025-06-03", "%Y-%m-%d").date()  # Current date is June 03, 2025
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("Vous devez avoir au moins 18 ans.")
        return value

    def validate_profilepic(self, value):
        if not value:
            raise serializers.ValidationError("L'URL de la photo de profil est requis.")
        if not re.match(r'^(https?://[^\s+])', value):
            raise serializers.ValidationError("L'URL doit être valide pour la photo de profil.")
        return value

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Le mot de passe est requis.")
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un caractère chiffre et un caractère spécial.")
        return value

    def create(self, validated_data):
        try:
            password = validated_data.pop('password')
            location_id = validated_data.pop('location_id', None)
            user = CustomUser(**validated_data)
            if location_id:
                user.location = location_id  # Assign the location object
            if password:
                user.set_password(password)
            user.save()
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Erreur lors de la création de l'utilisateur : {str(e)}")




class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user is None:
            raise serializers.ValidationError('Identifiants invalides')  # Changed to French
        return {'user': user}
    


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['firstname', 'lastname', 'phonenumber', 'location', 'profilepic']




class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value




class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'role'] 



class ClickHistorySerializer(serializers.Serializer):
    entity_type = serializers.CharField(max_length=100)
    entity_id = serializers.IntegerField()

    def validate_entity_type(self, value):
        # You can add validation here if you have a list of allowed entity types
        return value



VALID_ENTITY_TYPES = [
    'restaurant', 'guest_house', 'museum', 'hotel',
    'festival', 'destination', 'archaeological_site', 'activity'
]

class SearchHistoryInputSerializer(serializers.Serializer):
    q = serializers.CharField(max_length=255)
    entity_type = serializers.CharField(max_length=100)

    def validate_entity_type(self, value):
        value = value.strip().lower()
        if value not in VALID_ENTITY_TYPES:
            raise serializers.ValidationError("Invalid entity type.")
        return value
    


# class PreferenceCuisineSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PreferenceCuisine
#         fields = ['cuisine']

# class PreferenceActivityCategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PreferenceActivityCategory
#         fields = ['activity_category']

# class PreferenceSerializer(serializers.ModelSerializer):
#     cuisines = serializers.PrimaryKeyRelatedField(
#         queryset=Cuisine.objects.all(), many=True, write_only=True
#     )
#     activity_categories = serializers.PrimaryKeyRelatedField(
#         queryset=ActivityCategory.objects.all(), many=True, write_only=True
#     )

#     class Meta:
#         model = Preference
#         fields = [
#             'id', 'user', 'budget', 'accommodation', 'stars',
#             'departure_city', 'arrival_city',
#             'departure_date', 'arrival_date', 'forks',
#             'cuisines', 'activity_categories'
#         ]

#     def create(self, validated_data):
#         cuisines = validated_data.pop('cuisines', [])
#         activities = validated_data.pop('activity_categories', [])
#         preference = Preference.objects.create(**validated_data)

#         # Add cuisines through intermediate table
#         for cuisine in cuisines:
#             PreferenceCuisine.objects.create(preference=preference, cuisine=cuisine)

#         # Add activities through intermediate table
#         for activity in activities:
#             PreferenceActivityCategory.objects.create(preference=preference, activity_category=activity)

#         return preference





class PreferenceActivityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferenceActivityCategory
        fields = ['activity_category']


class PreferenceCuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferenceCuisine
        fields = ['cuisine']


# class PreferenceSerializer(serializers.ModelSerializer):
#     activities = PreferenceActivityCategorySerializer(many=True, write_only=True)
#     cuisines = PreferenceCuisineSerializer(many=True, write_only=True)

#     class Meta:
#         model = Preference
#         fields = '__all__'

#     def create(self, validated_data):
#         activities_data = validated_data.pop('activities')
#         cuisines_data = validated_data.pop('cuisines')
#         preference = Preference.objects.create(**validated_data)

#         for activity in activities_data:
#             PreferenceActivityCategory.objects.create(preference=preference, **activity)

#         for cuisine in cuisines_data:
#             PreferenceCuisine.objects.create(preference=preference, **cuisine)

#         return preference


class PreferenceSerializer(serializers.ModelSerializer):
    cuisines = PreferenceCuisineSerializer(many=True, required=False)
    activities = PreferenceActivityCategorySerializer(many=True, required=False)

    class Meta:
        model = Preference
        fields = [
            'id',
            'budget',
            'accommodation',
            'stars',
            'guest_house_category',
            'forks',
            'cuisines',
            'activities',
            'departure_city',
            'arrival_city',
            'departure_date',
            'arrival_date',
            'user'
        ]
        read_only_fields = ['id']

    def validate_cuisines(self, value):
        # Ensure each cuisine entry has a 'cuisine' field
        for item in value:
            if 'cuisine' not in item:
                raise serializers.ValidationError("Each cuisine entry must have a 'cuisine' field.")
        return value

    def validate_activities(self, value):
        # Ensure each activity entry has an 'activity_category' field
        for item in value:
            if 'activity_category' not in item:
                raise serializers.ValidationError("Each activity entry must have an 'activity_category' field.")
        return value

    def create(self, validated_data):
        # Pop cuisines and activities from validated_data
        cuisines_data = validated_data.pop('cuisines', [])
        activities_data = validated_data.pop('activities', [])

        # Set the user from the request context (authenticated user)
        user = self.context['request'].user
        if not user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated to create a preference.")
        validated_data['user'] = user

        # Create the Preference instance
        preference = Preference.objects.create(**validated_data)

        # Create related PreferenceCuisine objects
        for cuisine_item in cuisines_data:
            # Extract the cuisine ID from the cuisine object
            cuisine = cuisine_item.get('cuisine')
            if not cuisine:
                continue
            cuisine_id = cuisine.id if hasattr(cuisine, 'id') else cuisine  # Handle case where cuisine might already be an ID
            PreferenceCuisine.objects.create(preference=preference, cuisine_id=cuisine_id)

        # Create related PreferenceActivityCategory objects
        for activity_item in activities_data:
            # Extract the activity_category ID from the activity_category object
            activity_category = activity_item.get('activity_category')
            if not activity_category:
                continue
            activity_category_id = activity_category.id if hasattr(activity_category, 'id') else activity_category
            PreferenceActivityCategory.objects.create(preference=preference, activity_category_id=activity_category_id)

        return preference

    def update(self, instance, validated_data):
        cuisines_data = validated_data.pop('cuisines', [])
        activities_data = validated_data.pop('activities', [])

        # Update Preference fields
        instance.budget = validated_data.get('budget', instance.budget)
        instance.accommodation = validated_data.get('accommodation', instance.accommodation)
        instance.stars = validated_data.get('stars', instance.stars)
        instance.guest_house_category = validated_data.get('guest_house_category', instance.guest_house_category)
        instance.forks = validated_data.get('forks', instance.forks)
        instance.departure_city = validated_data.get('departure_city', instance.departure_city)
        instance.arrival_city = validated_data.get('arrival_city', instance.arrival_city)
        instance.departure_date = validated_data.get('departure_date', instance.departure_date)
        instance.arrival_date = validated_data.get('arrival_date', instance.arrival_date)
        instance.save()

        # Clear existing related objects
        instance.cuisines.all().delete()
        instance.activities.all().delete()

        # Create new related objects
        for cuisine_item in cuisines_data:
            cuisine = cuisine_item.get('cuisine')
            if not cuisine:
                continue
            cuisine_id = cuisine.id if hasattr(cuisine, 'id') else cuisine
            PreferenceCuisine.objects.create(preference=instance, cuisine_id=cuisine_id)

        for activity_item in activities_data:
            activity_category = activity_item.get('activity_category')
            if not activity_category:
                continue
            activity_category_id = activity_category.id if hasattr(activity_category, 'id') else activity_category
            PreferenceActivityCategory.objects.create(preference=instance, activity_category_id=activity_category_id)

        return instance

