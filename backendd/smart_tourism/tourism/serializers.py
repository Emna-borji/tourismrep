from rest_framework import serializers
from django.db.models import Avg
from django.core.validators import MinValueValidator, MaxValueValidator, URLValidator, RegexValidator
from .models import Hotel, Restaurant, Activity, Museum, ArchaeologicalSite, Festival, GuestHouse, Destination, Review, Favorite, Cuisine, ActivityCategory, Equipment, EntityImage


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'

class EntityImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntityImage
        fields = ['id', 'image_url', 'created_at', 'updated_at']

class DestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = '__all__'

class ActivityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityCategory
        fields = ['id', 'name']

class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['id', 'name']

# tourism/serializers.py
class HotelSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    # Use EquipmentSerializer for reading (API response)
    equipments = EquipmentSerializer(many=True, read_only=True)
    # Use PrimaryKeyRelatedField for writing (creating/updating)
    equipments_ids = serializers.PrimaryKeyRelatedField(
        queryset=Equipment.objects.all(),
        many=True,
        write_only=True,
        source='equipments'  # Maps to the equipments field on the model
    )

    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)

    name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(regex=r'^[A-Za-z0-9\s]+$', message="Hotel name should contain only letters and numbers.")]
    )
    stars = serializers.IntegerField(
        required=False,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )
    phone = serializers.CharField(
        max_length=20, required=False,
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Invalid phone number format.")]
    )
    website = serializers.CharField(
        max_length=255, required=False,
        validators=[URLValidator(message="Enter a valid website URL.")]
    )

    class Meta:
        model = Hotel
        fields = '__all__'
    
    def get_rating(self, obj):
    # Map model classes to entity types
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        # Get the entity type based on the model class name
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        
        # Calculate the average rating from the review table
        avg_rating = Review.objects.filter(
            entity_type=entity_type,
            entity_id=obj.id
        ).aggregate(Avg('rating'))['rating__avg']
        
        # Round to 1 decimal place, or return None if there are no reviews
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_equipments(self, value):
        """
        Only allow equipments where hotel=True.
        """
        invalid = [eq for eq in value if not eq.hotel]
        if invalid:
            raise serializers.ValidationError(f"Some equipments are not valid for hotels: {[e.id for e in invalid]}")
        return value

    def validate_name(self, value):
        """Custom validation for hotel name."""
        if len(value) < 3:
            raise serializers.ValidationError("Hotel name must be at least 3 characters long.")
        return value

    def validate_price(self, value):
        """Custom validation for price."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_stars(self, value):
        """Custom validation for stars."""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Stars must be between 1 and 5.")
        return value

    def create(self, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        hotel = Hotel.objects.create(destination_id=destination_id, **validated_data)

        # Add equipment to the hotel
        for equipment in equipments_data:
            hotel.equipments.add(equipment)

        return hotel

    def update(self, instance, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)

        # Clear current equipment assignments and add new ones
        instance.equipments.clear()
        for equipment in equipments_data:
            instance.equipments.add(equipment)

        instance.save()
        return instance

class RestaurantSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)  # Already correct
    cuisine = serializers.StringRelatedField(read_only=True)      # Already correct
    destination_id = serializers.IntegerField(write_only=True)    # Already correct
    cuisine_id = serializers.IntegerField(write_only=True, required=False)  # Already correct
    additional_images = EntityImageSerializer(many=True, required=False)

    class Meta:
        model = Restaurant
        fields = '__all__'

    def get_rating(self, obj):
    # Map model classes to entity types
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        # Get the entity type based on the model class name
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        
        # Calculate the average rating from the review table
        avg_rating = Review.objects.filter(
            entity_type=entity_type,
            entity_id=obj.id
        ).aggregate(Avg('rating'))['rating__avg']
        
        # Round to 1 decimal place, or return None if there are no reviews
        return round(avg_rating, 1) if avg_rating is not None else None

    def create(self, validated_data):
        # Extract additional_images data if present
        additional_images_data = validated_data.pop('additional_images', [])
        
        # Extract destination_id and cuisine_id
        destination_id = validated_data.pop('destination_id', None)
        cuisine_id = validated_data.pop('cuisine_id', None)

        # Create the restaurant
        restaurant = Restaurant.objects.create(
            destination_id=destination_id,
            cuisine_id=cuisine_id,
            **validated_data
        )

        # Create the additional images
        for image_data in additional_images_data:
            EntityImage.objects.create(
                entity_type='restaurant',
                entity_id=restaurant.id,
                image_url=image_data['image_url']
            )

        return restaurant

    def to_representation(self, instance):
        # Customize the response to include the additional_images
        representation = super().to_representation(instance)
        additional_images = EntityImage.objects.filter(entity_type='restaurant', entity_id=instance.id)
        representation['additional_images'] = EntityImageSerializer(additional_images, many=True).data
        return representation

class ActivitySerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)  # Add this to resolve destination name
    destination_id = serializers.IntegerField(write_only=True)    # Add this for creating/updating

    class Meta:
        model = Activity
        fields = '__all__'

    def get_rating(self, obj):
    # Map model classes to entity types
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        # Get the entity type based on the model class name
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        
        # Calculate the average rating from the review table
        avg_rating = Review.objects.filter(
            entity_type=entity_type,
            entity_id=obj.id
        ).aggregate(Avg('rating'))['rating__avg']
        
        # Round to 1 decimal place, or return None if there are no reviews
        return round(avg_rating, 1) if avg_rating is not None else None

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)  # Extract destination_id
        activity = Activity.objects.create(destination_id=destination_id, **validated_data)
        return activity

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)  # Extract destination_id
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

class MuseumSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)  # Add this to resolve destination name
    destination_id = serializers.IntegerField(write_only=True)    # Add this for creating/updating

    name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(regex=r'^[A-Za-z0-9\s]+$', message="Museum name should contain only letters and numbers.")]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )
    phone = serializers.CharField(
        max_length=20, required=False,
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Invalid phone number format.")]
    )
    website = serializers.CharField(
        max_length=255, required=False,
        validators=[URLValidator(message="Enter a valid website URL.")]
    )

    class Meta:
        model = Museum
        fields = '__all__'

    def get_rating(self, obj):
    # Map model classes to entity types
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        # Get the entity type based on the model class name
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        
        # Calculate the average rating from the review table
        avg_rating = Review.objects.filter(
            entity_type=entity_type,
            entity_id=obj.id
        ).aggregate(Avg('rating'))['rating__avg']
        
        # Round to 1 decimal place, or return None if there are no reviews
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be a non-negative value.")
        return value

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)  # Extract destination_id
        museum = Museum.objects.create(destination_id=destination_id, **validated_data)
        return museum

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)  # Extract destination_id
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

# serializers.py (only showing the ArchaeologicalSiteSerializer for brevity)
class ArchaeologicalSiteSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ArchaeologicalSite
        fields = '__all__'
    
    def get_rating(self, obj):
    # Map model classes to entity types
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        # Get the entity type based on the model class name
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        
        # Calculate the average rating from the review table
        avg_rating = Review.objects.filter(
            entity_type=entity_type,
            entity_id=obj.id
        ).aggregate(Avg('rating'))['rating__avg']
        
        # Round to 1 decimal place, or return None if there are no reviews
        return round(avg_rating, 1) if avg_rating is not None else None

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        site = ArchaeologicalSite.objects.create(destination_id=destination_id, **validated_data)
        return site

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

class FestivalSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)  # Add this to resolve destination name
    destination_id = serializers.IntegerField(write_only=True)    # Add this for creating/updating

    class Meta:
        model = Festival
        fields = '__all__'
    
    def get_rating(self, obj):
    # Map model classes to entity types
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        # Get the entity type based on the model class name
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        
        # Calculate the average rating from the review table
        avg_rating = Review.objects.filter(
            entity_type=entity_type,
            entity_id=obj.id
        ).aggregate(Avg('rating'))['rating__avg']
        
        # Round to 1 decimal place, or return None if there are no reviews
        return round(avg_rating, 1) if avg_rating is not None else None
        

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)  # Extract destination_id
        festival = Festival.objects.create(destination_id=destination_id, **validated_data)
        return festival

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)  # Extract destination_id
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'

# tourism/serializers.py
class GuestHouseSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    # Use EquipmentSerializer for reading (API response)
    equipments = EquipmentSerializer(many=True, read_only=True)
    # Use PrimaryKeyRelatedField for writing (creating/updating)
    equipments_ids = serializers.PrimaryKeyRelatedField(
        queryset=Equipment.objects.all(),
        many=True,
        write_only=True,
        source='equipments'  # Maps to the equipments field on the model
    )

    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)

    name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(regex=r'^[A-Za-z0-9\s]+$', message="Guest house name should contain only letters and numbers.")]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )
    phone = serializers.CharField(
        max_length=20, required=False,
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Invalid phone number format.")]
    )
    website = serializers.CharField(
        max_length=255, required=False,
        validators=[URLValidator(message="Enter a valid website URL.")]
    )

    class Meta:
        model = GuestHouse
        fields = '__all__'

    def get_rating(self, obj):
    # Map model classes to entity types
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        # Get the entity type based on the model class name
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        
        # Calculate the average rating from the review table
        avg_rating = Review.objects.filter(
            entity_type=entity_type,
            entity_id=obj.id
        ).aggregate(Avg('rating'))['rating__avg']
        
        # Round to 1 decimal place, or return None if there are no reviews
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_equipments(self, value):
        """
        Only allow equipments where guest_house=True.
        """
        invalid = [eq for eq in value if not eq.guest_house]
        if invalid:
            raise serializers.ValidationError(f"Some equipments are not valid for guest houses: {[e.id for e in invalid]}")
        return value

    def validate_latitude(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be a non-negative value.")
        return value

    def create(self, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        guest_house = GuestHouse.objects.create(destination_id=destination_id, **validated_data)

        # Add equipment to the guest house
        for equipment in equipments_data:
            guest_house.equipments.add(equipment)

        return guest_house

    def update(self, instance, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)

        # Clear current equipment assignments and add new ones
        instance.equipments.clear()
        for equipment in equipments_data:
            instance.equipments.add(equipment)

        instance.save()
        return instance


# class ReviewSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Review
#         fields = ['id', 'entity_type', 'entity_id', 'user', 'rating', 'comment', 'image', 'created_at', 'updated_at']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    def get_user(self, obj):
        from users.serializers import AdminUserSerializer
        return AdminUserSerializer(obj.user).data

    class Meta:
        model = Review
        fields = ['id', 'entity_type', 'entity_id', 'user', 'rating', 'comment', 'image', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
        extra_kwargs = {
            'entity_type': {'required': False},
            'entity_id': {'required': False},
        }

    def validate(self, data):
        # Ensure entity_type and entity_id are provided only for POST requests
        if self.context['request'].method == 'POST':
            if 'entity_type' not in data or not data['entity_type']:
                raise serializers.ValidationError("entity_type is required.")
            if 'entity_id' not in data or data['entity_id'] is None:
                raise serializers.ValidationError("entity_id is required and cannot be null.")
        # For PUT/PATCH, validate only if provided and ensure they match the instance
        elif self.context['request'].method in ['PUT', 'PATCH']:
            instance = getattr(self, 'instance', None)
            if instance:
                if 'entity_type' in data and data['entity_type'] != instance.entity_type:
                    raise serializers.ValidationError("entity_type cannot be updated.")
                if 'entity_id' in data and data['entity_id'] != instance.entity_id:
                    raise serializers.ValidationError("entity_id cannot be updated.")
        return data

    def validate_rating(self, value):
        if value not in [1, 2, 3, 4, 5]:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_image(self, value):
        if value and not value.startswith('data:image/'):
            raise serializers.ValidationError("Image must be a valid base64-encoded image string (e.g., starting with 'data:image/').")
        return value

    def validate_entity_type(self, value):
        valid_types = [choice[0] for choice in Review.ENTITY_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid entity_type. Must be one of: {valid_types}")
        return value
    


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['user', 'entity_type', 'entity_id', 'created_at', 'updated_at']