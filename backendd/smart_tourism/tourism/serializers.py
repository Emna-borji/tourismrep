from rest_framework import serializers
from django.db.models import Avg
from django.core.validators import MinValueValidator, MaxValueValidator, URLValidator, RegexValidator
from .models import Hotel, Restaurant, Activity, Museum, ArchaeologicalSite, Festival, GuestHouse, Destination, Review, Favorite, Cuisine, ActivityCategory, Equipment, EntityImage
from users.models import CustomUser

class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['id', 'name']

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
    def __str__(self):
        return self.name

# tourism/serializers.py
class HotelSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    equipments = EquipmentSerializer(many=True, read_only=True)
    equipments_ids = serializers.PrimaryKeyRelatedField(
        queryset=Equipment.objects.all(),
        many=True,
        write_only=True,
        source='equipments'
    )
    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)

    name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(regex=r'^[A-Za-z0-9\s]+$', message="Le nom de l'hôtel doit contenir uniquement des lettres et des chiffres.")]
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
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Format de numéro de téléphone invalide.")]
    )
    website = serializers.CharField(
        max_length=255, required=False,
        validators=[URLValidator(message="Entrez une URL de site web valide.")]
    )
    latitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )

    class Meta:
        model = Hotel
        fields = '__all__'

    def get_rating(self, obj):
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        avg_rating = Review.objects.filter(entity_type=entity_type, entity_id=obj.id).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_equipments(self, value):
        invalid = [eq for eq in value if not eq.hotel]
        if invalid:
            raise serializers.ValidationError(f"Certaines équipements ne sont pas valides pour les hôtels : {[e.id for e in invalid]}")
        return value

    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Le nom de l'hôtel doit contenir au moins 3 caractères.")
        return value

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value

    def validate_stars(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Les étoiles doivent être entre 1 et 5.")
        return value

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("La latitude doit être entre -90 et 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("La longitude doit être entre -180 et 180.")
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not None and longitude is not None:
            if Hotel.objects.filter(latitude=latitude, longitude=longitude).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Un hôtel avec cette latitude et longitude existe déjà.'
                })

        return data

    def create(self, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        hotel = Hotel.objects.create(destination_id=destination_id, **validated_data)
        for equipment in equipments_data:
            hotel.equipments.add(equipment)
        return hotel

    def update(self, instance, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.equipments.clear()
        for equipment in equipments_data:
            instance.equipments.add(equipment)
        instance.save()
        return instance

class RestaurantSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)
    cuisine = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)
    cuisine_id = serializers.IntegerField(write_only=True, required=False)
    additional_images = EntityImageSerializer(many=True, required=False)
    latitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )
    phone = serializers.CharField(
        max_length=20, required=False,
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Format de numéro de téléphone invalide.")]
    )

    class Meta:
        model = Restaurant
        fields = '__all__'

    def get_rating(self, obj):
        entity_type_map = {
            'Hotel': 'hotel',
            'GuestHouse': 'guest_house',
            'Restaurant': 'restaurant',
            'Festival': 'festival',
            'Museum': 'museum',
            'ArchaeologicalSite': 'archaeological_site',
        }
        entity_type = entity_type_map.get(obj.__class__.__name__, '')
        avg_rating = Review.objects.filter(entity_type=entity_type, entity_id=obj.id).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not None and longitude is not None:
            if Restaurant.objects.filter(latitude=latitude, longitude=longitude).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Un restaurant avec cette latitude et longitude existe déjà.'
                })

        return data

    def create(self, validated_data):
        additional_images_data = validated_data.pop('additional_images', [])
        destination_id = validated_data.pop('destination_id', None)
        cuisine_id = validated_data.pop('cuisine_id', None)
        restaurant = Restaurant.objects.create(destination_id=destination_id, cuisine_id=cuisine_id, **validated_data)
        for image_data in additional_images_data:
            EntityImage.objects.create(entity_type='restaurant', entity_id=restaurant.id, image_url=image_data['image_url'])
        return restaurant

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        additional_images = EntityImage.objects.filter(entity_type='restaurant', entity_id=instance.id)
        representation['additional_images'] = EntityImageSerializer(additional_images, many=True).data
        return representation

class GuestHouseSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    equipments = EquipmentSerializer(many=True, read_only=True)
    equipments_ids = serializers.PrimaryKeyRelatedField(
        queryset=Equipment.objects.all(),
        many=True,
        write_only=True,
        source='equipments'
    )
    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)
    latitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )
    phone = serializers.CharField(
        max_length=20, required=False,
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Format de numéro de téléphone invalide.")]
    )
    website = serializers.CharField(
        max_length=255, required=False,
        validators=[URLValidator(message="Entrez une URL de site web valide.")]
    )

    class Meta:
        model = GuestHouse
        fields = '__all__'

    def get_rating(self, obj):
        avg_rating = Review.objects.filter(entity_type='guest_house', entity_id=obj.id).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_equipments(self, value):
        invalid = [eq for eq in value if not eq.guest_house]
        if invalid:
            raise serializers.ValidationError(f"Certaines équipements ne sont pas valides pour les maisons d’hôtes : {[e.id for e in invalid]}")
        return value

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("La latitude doit être entre -90 et 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("La longitude doit être entre -180 et 180.")
        return value

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not None and longitude is not None:
            if GuestHouse.objects.filter(latitude=latitude, longitude=longitude).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Une maison d’hôtes avec cette latitude et longitude existe déjà.'
                })

        return data

    def create(self, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        guest_house = GuestHouse.objects.create(destination_id=destination_id, **validated_data)
        for equipment in equipments_data:
            guest_house.equipments.add(equipment)
        return guest_house

    def update(self, instance, validated_data):
        equipments_data = validated_data.pop('equipments', [])
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.equipments.clear()
        for equipment in equipments_data:
            instance.equipments.add(equipment)
        instance.save()
        return instance

class MuseumSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)
    latitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )
    website = serializers.CharField(
        max_length=255, required=False,
        validators=[URLValidator(message="Entrez une URL de site web valide.")]
    )
    name = serializers.CharField(
        max_length=255,
        validators=[RegexValidator(regex=r'^[A-Za-z0-9\s]+$', message="Le nom du musée doit contenir uniquement des lettres et des chiffres.")]
    )
    phone = serializers.CharField(
        max_length=20, required=False,
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Format de numéro de téléphone invalide.")]
    )

    class Meta:
        model = Museum
        fields = '__all__'

    def get_rating(self, obj):
        avg_rating = Review.objects.filter(entity_type='museum', entity_id=obj.id).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("La latitude doit être entre -90 et 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("La longitude doit être entre -180 et 180.")
        return value

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not None and longitude is not None:
            if Museum.objects.filter(latitude=latitude, longitude=longitude).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Un musée avec cette latitude et longitude existe déjà.'
                })

        return data

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        return Museum.objects.create(destination_id=destination_id, **validated_data)

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

class ArchaeologicalSiteSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)
    latitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        model = ArchaeologicalSite
        fields = '__all__'

    def get_rating(self, obj):
        avg_rating = Review.objects.filter(entity_type='archaeological_site', entity_id=obj.id).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("La latitude doit être entre -90 et 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("La longitude doit être entre -180 et 180.")
        return value

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not None and longitude is not None:
            if ArchaeologicalSite.objects.filter(latitude=latitude, longitude=longitude).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Un site archéologique avec cette latitude et longitude existe déjà.'
                })

        return data

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        return ArchaeologicalSite.objects.create(destination_id=destination_id, **validated_data)

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

class FestivalSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)
    latitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        model = Festival
        fields = '__all__'

    def get_rating(self, obj):
        avg_rating = Review.objects.filter(entity_type='festival', entity_id=obj.id).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("La latitude doit être entre -90 et 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("La longitude doit être entre -180 et 180.")
        return value

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not None and longitude is not None:
            if Festival.objects.filter(latitude=latitude, longitude=longitude).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Un festival avec cette latitude et longitude existe déjà.'
                })

        return data

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        return Festival.objects.create(destination_id=destination_id, **validated_data)

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

class ActivitySerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    destination = serializers.StringRelatedField(read_only=True)
    destination_id = serializers.IntegerField(write_only=True)
    latitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = serializers.FloatField(
        required=False,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        validators=[MinValueValidator(0)]
    )
    phone = serializers.CharField(
        max_length=20, required=False,
        validators=[RegexValidator(regex=r'^\+?[0-9]+$', message="Format de numéro de téléphone invalide.")]
    )
    website = serializers.CharField(
        max_length=255, required=False,
        validators=[URLValidator(message="Entrez une URL de site web valide.")]
    )

    class Meta:
        model = Activity
        fields = '__all__'

    def get_rating(self, obj):
        avg_rating = Review.objects.filter(entity_type='activity', entity_id=obj.id).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 1) if avg_rating is not None else None

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("La latitude doit être entre -90 et 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("La longitude doit être entre -180 et 180.")
        return value

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value

    def validate(self, data):
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is not None and longitude is not None:
            if Activity.objects.filter(latitude=latitude, longitude=longitude).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Une activité avec cette latitude et longitude existe déjà.'
                })

        return data

    def create(self, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        return Activity.objects.create(destination_id=destination_id, **validated_data)

    def update(self, instance, validated_data):
        destination_id = validated_data.pop('destination_id', None)
        if destination_id is not None:
            instance.destination_id = destination_id
        instance = super().update(instance, validated_data)
        instance.save()
        return instance

class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'firstname', 'lastname', 'username', 'role']

class ReviewSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'entity_type', 'entity_id', 'user', 'rating', 'comment', 'image', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
        extra_kwargs = {
            'entity_type': {'required': False},
            'entity_id': {'required': False},
        }

    def validate(self, data):
        if self.context['request'].method == 'POST':
            if 'entity_type' not in data or not data['entity_type']:
                raise serializers.ValidationError("entity_type est requis.")
            if 'entity_id' not in data or data['entity_id'] is None:
                raise serializers.ValidationError("entity_id est requis et ne peut pas être null.")
        elif self.context['request'].method in ['PUT', 'PATCH']:
            instance = getattr(self, 'instance', None)
            if instance:
                if 'entity_type' in data and data['entity_type'] != instance.entity_type:
                    raise serializers.ValidationError("entity_type ne peut pas être mis à jour.")
                if 'entity_id' in data and data['entity_id'] != instance.entity_id:
                    raise serializers.ValidationError("entity_id ne peut pas être mis à jour.")
        return data

    def validate_rating(self, value):
        if value not in [1, 2, 3, 4, 5]:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value

    def validate_image(self, value):
        if value and not value.startswith('data:image/'):
            raise serializers.ValidationError("L'image doit être une chaîne d'image encodée en base64 valide (ex. commençant par 'data:image/').")
        return value

    def validate_entity_type(self, value):
        valid_types = [choice[0] for choice in Review.ENTITY_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Type d'entité invalide. Doit être l'un des suivants : {valid_types}")
        return value

class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['user', 'entity_type', 'entity_id', 'created_at', 'updated_at']