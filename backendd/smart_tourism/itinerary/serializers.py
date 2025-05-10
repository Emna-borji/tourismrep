from rest_framework import serializers
from .models import Circuit, CircuitSchedule, Guide
from .models import CircuitHistory
import logging

from tourism.serializers import (
    HotelSerializer,
    GuestHouseSerializer,
    RestaurantSerializer,
    ActivitySerializer,
    MuseumSerializer,
    FestivalSerializer,
    ArchaeologicalSiteSerializer,
)

logger = logging.getLogger(__name__)


# class CircuitScheduleSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = CircuitSchedule
#         exclude = ['circuit']  # Don't include 'circuit' in the request payload

class GuideSerializer(serializers.ModelSerializer):
    num_gd = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    descatl = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    nom_gui = serializers.CharField(required=True, allow_blank=False)
    pre_guide = serializers.CharField(required=False, allow_blank=True)
    sexe = serializers.ChoiceField(choices=[('', 'None'), ('M', 'Male'), ('F', 'Female')], required=False, allow_blank=True, allow_null=True)
    adresse = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tel = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dat_deb_activ = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Guide
        fields = ['id', 'num_gd', 'descatl', 'nom_gui', 'pre_guide', 'sexe', 'adresse', 'tel', 'dat_deb_activ']



# Serializer for CircuitSchedule, including related fields with names and IDs
class CircuitScheduleSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    hotel = HotelSerializer(allow_null=True, required=False)
    guest_house = GuestHouseSerializer(allow_null=True, required=False)
    restaurant = RestaurantSerializer(allow_null=True, required=False)
    activity = ActivitySerializer(allow_null=True, required=False)
    museum = MuseumSerializer(allow_null=True, required=False)
    festival = FestivalSerializer(allow_null=True, required=False)
    archaeological_site = ArchaeologicalSiteSerializer(allow_null=True, required=False)

    destination_id = serializers.PrimaryKeyRelatedField(
        source='destination',
        queryset=CircuitSchedule._meta.get_field('destination').remote_field.model.objects.all(),
    )
    hotel_id = serializers.PrimaryKeyRelatedField(
        source='hotel',
        queryset=CircuitSchedule._meta.get_field('hotel').remote_field.model.objects.all(),
        allow_null=True,
        required=False
    )
    guest_house_id = serializers.PrimaryKeyRelatedField(
        source='guest_house',
        queryset=CircuitSchedule._meta.get_field('guest_house').remote_field.model.objects.all(),
        allow_null=True,
        required=False
    )
    restaurant_id = serializers.PrimaryKeyRelatedField(
        source='restaurant',
        queryset=CircuitSchedule._meta.get_field('restaurant').remote_field.model.objects.all(),
        allow_null=True,
        required=False
    )
    activity_id = serializers.PrimaryKeyRelatedField(
        source='activity',
        queryset=CircuitSchedule._meta.get_field('activity').remote_field.model.objects.all(),
        allow_null=True,
        required=False
    )
    museum_id = serializers.PrimaryKeyRelatedField(
        source='museum',
        queryset=CircuitSchedule._meta.get_field('museum').remote_field.model.objects.all(),
        allow_null=True,
        required=False
    )
    festival_id = serializers.PrimaryKeyRelatedField(
        source='festival',
        queryset=CircuitSchedule._meta.get_field('festival').remote_field.model.objects.all(),
        allow_null=True,
        required=False
    )
    archaeological_site_id = serializers.PrimaryKeyRelatedField(
        source='archaeological_site',
        queryset=CircuitSchedule._meta.get_field('archaeological_site').remote_field.model.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = CircuitSchedule
        fields = [
            'id', 'destination_id', 'destination_name', 'day', 'order', 'distance_km',
            'hotel', 'hotel_id', 'guest_house', 'guest_house_id',
            'restaurant', 'restaurant_id', 'activity', 'activity_id',
            'museum', 'museum_id', 'festival', 'festival_id',
            'archaeological_site', 'archaeological_site_id'
        ]

    def validate(self, data):
        logger.info(f"Validating CircuitSchedule data: {data}")
        validated_data = super().validate(data)
        return validated_data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Ensure null values are handled consistently
        for field in ['hotel', 'guest_house', 'restaurant', 'activity', 'museum', 'festival', 'archaeological_site']:
            if representation[field] is None:
                representation[field] = {}
        return representation


# Serializer for Circuit, to be used in CircuitHistorySerializer
class CircuitSerializer(serializers.ModelSerializer):
    departure_city = serializers.StringRelatedField()
    arrival_city = serializers.StringRelatedField()
    schedules = CircuitScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Circuit
        fields = ['id', 'name', 'circuit_code', 'departure_city', 'arrival_city', 'price', 'duration', 'description', 'schedules']

class CircuitCreateSerializer(serializers.ModelSerializer):
    schedules = CircuitScheduleSerializer(many=True, required=False)
    stops = CircuitScheduleSerializer(many=True, required=False)

    class Meta:
        model = Circuit
        fields = '__all__'

    def validate(self, data):
        logger.info(f"Validating CircuitCreate data: {data}")
        if data.get('departure_city') == data.get('arrival_city'):
            raise serializers.ValidationError("La ville de départ et d'arrivée doivent être différentes.")
        return data

    def create(self, validated_data):
        logger.info(f"Creating Circuit with validated data: {validated_data}")
        schedules_data = validated_data.pop('schedules', [])
        stops_data = validated_data.pop('stops', [])
        logger.info(f"Schedules data: {schedules_data}")
        logger.info(f"Stops data: {stops_data}")

        circuit = Circuit.objects.create(**validated_data)
        all_schedules = schedules_data + stops_data

        for schedule_data in all_schedules:
            logger.info(f"Processing schedule: {schedule_data}")
            schedule_data['circuit'] = circuit
            if 'day' not in schedule_data or 'destination' not in schedule_data:
                logger.error("Missing required fields in schedule data")
                raise serializers.ValidationError("Each schedule must include 'day' and 'destination'.")
            # Directly create the CircuitSchedule instance since the data is already validated
            CircuitSchedule.objects.create(
                circuit=circuit,
                destination=schedule_data['destination'],
                day=schedule_data['day'],
                order=schedule_data.get('order', 0),
                distance_km=schedule_data.get('distance_km', 0),
                hotel=schedule_data.get('hotel'),
                guest_house=schedule_data.get('guest_house'),
                restaurant=schedule_data.get('restaurant'),
                activity=schedule_data.get('activity'),
                museum=schedule_data.get('museum'),
                festival=schedule_data.get('festival'),
                archaeological_site=schedule_data.get('archaeological_site')
            )

        return circuit



class CircuitHistorySerializer(serializers.ModelSerializer):
    circuit = serializers.PrimaryKeyRelatedField(queryset=Circuit.objects.all(), required=True)
    circuit_details = CircuitSerializer(source='circuit', read_only=True)  # Nested serializer for reading

    class Meta:
        model = CircuitHistory
        fields = ['id', 'circuit', 'circuit_details', 'departure_date', 'arrival_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        circuit = data.get('circuit')
        departure_date = data.get('departure_date')
        arrival_date = data.get('arrival_date')
        user = self.context['request'].user

        if circuit and departure_date and arrival_date:
            # Check for existing entry for this user
            exists = CircuitHistory.objects.filter(
                circuit=circuit,
                departure_date=departure_date,
                arrival_date=arrival_date,
                user=user  # Ensure uniqueness per user
            ).exists()
            if exists:
                raise serializers.ValidationError(
                    "Un historique avec ce circuit et ces dates existe déjà pour cet utilisateur."
                )
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)








# class PreferenceInputSerializer(serializers.Serializer):
#     budget = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
#     accommodation = serializers.CharField(max_length=50, required=True)
#     stars = serializers.IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
#     guest_house_category = serializers.CharField(max_length=50, required=False, allow_null=True)
#     departure_city_id = serializers.IntegerField(required=True)
#     arrival_city_id = serializers.IntegerField(required=True)
#     departure_date = serializers.DateField(required=True)
#     arrival_date = serializers.DateField(required=True)
#     forks = serializers.IntegerField(min_value=1, max_value=3, required=True)
#     activity_category_id = serializers.IntegerField(required=True)
#     cuisine_id = serializers.IntegerField(required=True)
#     destination_ids = serializers.ListField(child=serializers.IntegerField(), required=True)


