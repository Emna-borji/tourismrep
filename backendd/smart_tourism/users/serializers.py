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

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Le mot de passe est requis.")
        
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        if password:
            user.password = make_password(password)
        user.save()
        return user




class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user is None:
            raise serializers.ValidationError('Invalid credentials')
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


class PreferenceSerializer(serializers.ModelSerializer):
    activities = PreferenceActivityCategorySerializer(many=True, write_only=True)
    cuisines = PreferenceCuisineSerializer(many=True, write_only=True)

    class Meta:
        model = Preference
        fields = '__all__'

    def create(self, validated_data):
        activities_data = validated_data.pop('activities')
        cuisines_data = validated_data.pop('cuisines')
        preference = Preference.objects.create(**validated_data)

        for activity in activities_data:
            PreferenceActivityCategory.objects.create(preference=preference, **activity)

        for cuisine in cuisines_data:
            PreferenceCuisine.objects.create(preference=preference, **cuisine)

        return preference

