from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
import time
import random
from rest_framework import viewsets

from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action


from django.utils import timezone
from django.db.models import Avg
from users.models import Preference, PreferenceActivityCategory, PreferenceCuisine, CustomUser
from tourism.models import Hotel, GuestHouse, Restaurant, Activity, Museum, Festival, ArchaeologicalSite, Destination
from itinerary.models import Circuit, CircuitSchedule, CircuitHistory, Guide
from itinerary.serializers import CircuitCreateSerializer, CircuitScheduleSerializer, CircuitHistorySerializer, GuideSerializer
from rest_framework import viewsets
from users.permissions import CircuitPermission
from django.core.cache import cache
import math
from datetime import datetime, date
from rest_framework.serializers import Serializer, IntegerField, DecimalField, CharField, DateField
from users.permissions import IsAdmin
import logging
from django.db import connection
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.db.models import Count
import traceback




class GuideViewSet(viewsets.ModelViewSet):
    queryset = Guide.objects.all()
    serializer_class = GuideSerializer
    permission_classes = [IsAdmin]
    pagination_class = None  # Disable backend pagination

    def update(self, request, *args, **kwargs):
        # Allow partial updates for PUT requests
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)




class PreferenceInputSerializer(Serializer):
    budget = DecimalField(max_digits=10, decimal_places=2, required=True)
    accommodation = CharField(max_length=50, required=True)
    stars = IntegerField(min_value=1, max_value=5, required=False, allow_null=True)
    guest_house_category = CharField(max_length=50, required=False, allow_null=True)
    departure_city_id = IntegerField(required=True)
    arrival_city_id = IntegerField(required=True)
    departure_date = DateField(required=True)
    arrival_date = DateField(required=True)
    forks = IntegerField(min_value=1, max_value=3, required=True)
    activity_category_id = IntegerField(required=True)
    cuisine_id = IntegerField(required=True)

class FilteredEntitiesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cache_key = f'filtered_entities_{request.user.id}_{hash(str(request.data))}'
        cached = cache.get(cache_key)
        if cached:
            return Response({"status": "success", "data": cached})

        serializer = PreferenceInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"status": "error", "message": serializer.errors}, status=400)

        pref_data = serializer.validated_data
        cities = [pref_data['departure_city_id'], pref_data['arrival_city_id']]
        if request.user.location_id:
            cities.append(request.user.location_id)

        try:
            data = {
                'hotels': list(Hotel.objects.filter(
                    destination_id__in=cities,
                    stars__gte=pref_data.get('stars', 0)
                ).select_related('destination').values('id', 'name', 'price', 'stars', 'destination__name', 'destination__id')),
                'guest_houses': list(GuestHouse.objects.filter(
                    destination_id__in=cities,
                    category__in=[pref_data['guest_house_category']] if pref_data.get('guest_house_category') else ['Basique', 'Standard', 'Premium', 'Luxe']
                ).select_related('destination').values('id', 'name', 'price', 'category', 'destination__name', 'destination__id')),
                'activities': list(Activity.objects.filter(
                    destination_id__in=cities,
                    category_id=pref_data['activity_category_id']
                ).select_related('destination', 'category').values('id', 'name', 'destination__name', 'destination__id', 'category__name', 'price')),
                'restaurants': list(Restaurant.objects.filter(
                    destination_id__in=cities,
                    cuisine_id=pref_data['cuisine_id'],
                    forks__gte=pref_data['forks']
                ).select_related('destination', 'cuisine').values('id', 'name', 'destination__name', 'destination__id', 'cuisine__name', 'forks', 'price')),
                'museums': list(Museum.objects.filter(
                    destination_id__in=cities
                ).select_related('destination').values('id', 'name', 'destination__name', 'destination__id', 'price')),
                'festivals': list(Festival.objects.filter(
                    destination_id__in=cities,
                    date__gte=pref_data['departure_date'],
                    date__lte=pref_data['arrival_date']
                ).select_related('destination').values('id', 'name', 'date', 'destination__name', 'destination__id', 'price')),
                'archaeological_sites': list(ArchaeologicalSite.objects.filter(
                    destination_id__in=cities
                ).select_related('destination').values('id', 'name', 'destination__name', 'destination__id')),
                'destinations': list(Destination.objects.filter(id__in=cities).values('id', 'name', 'latitude', 'longitude'))
            }
            cache.set(cache_key, data, timeout=600)
            return Response({"status": "success", "data": data})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=400)

class CircuitTemplatesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cache_key = f'circuit_templates_{request.user.id}_{hash(str(request.data))}'
        cached = cache.get(cache_key)
        if cached:
            return Response({"status": "success", "templates": cached})

        serializer = PreferenceInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"status": "error", "message": serializer.errors}, status=400)

        pref_data = serializer.validated_data
        templates = []
        try:
            # Template 1: Coastal Adventure
            hotels = Hotel.objects.filter(
                destination_id=pref_data['departure_city_id'],
                stars__gte=pref_data.get('stars', 0)
            )[:1]
            activities = Activity.objects.filter(
                destination_id=pref_data['departure_city_id'],
                category_id=pref_data['activity_category_id']
            )[:1]
            circuit_data = {
                'name': 'Aventure Côtière',
                'departure_city_id': pref_data['departure_city_id'],
                'arrival_city_id': pref_data['arrival_city_id'],
                'duration': 3,
                'price': 0,
                'destinations': [
                    {'destination_id': pref_data['departure_city_id'], 'days': 2},
                    {'destination_id': pref_data['arrival_city_id'], 'days': 1}
                ],
                'stops': []
            }
            for hotel in hotels:
                circuit_data['stops'].append({
                    'destination_id': pref_data['departure_city_id'],
                    'day': 1,
                    'hotel_id': hotel.id
                })
                circuit_data['price'] += hotel.price or 0
            for activity in activities:
                circuit_data['stops'].append({
                    'destination_id': pref_data['departure_city_id'],
                    'day': 1,
                    'activity_id': activity.id
                })
            templates.append(circuit_data)

            # Template 2: Cultural Journey
            museums = Museum.objects.filter(destination_id=pref_data['arrival_city_id'])[:1]
            circuit_data = {
                'name': 'Voyage Culturel',
                'departure_city_id': pref_data['departure_city_id'],
                'arrival_city_id': pref_data['arrival_city_id'],
                'duration': 2,
                'price': 0,
                'destinations': [
                    {'destination_id': pref_data['arrival_city_id'], 'days': 2}
                ],
                'stops': []
            }
            for museum in museums:
                circuit_data['stops'].append({
                    'destination_id': pref_data['arrival_city_id'],
                    'day': 1,
                    'museum_id': museum.id
                })
                circuit_data['price'] += museum.price or 0
            templates.append(circuit_data)

            cache.set(cache_key, templates, timeout=600)
            return Response({"status": "success", "templates": templates})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=400)

# class ComposeCircuitView(APIView):
#     permission_classes = [IsAuthenticated]

#     def haversine(self, lat1, lon1, lat2, lon2):
#         """Calculate distance between two points in km using Haversine formula."""
#         R = 6371
#         lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
#         dlat = lat2 - lat1
#         dlon = lon2 - lon1
#         a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
#         c = 2 * math.asin(math.sqrt(a))
#         return R * c

#     def get_shortest_path(self, destinations, departure_city_id, arrival_city_id):
#         dests = destinations.copy()
#         ordered = [departure_city_id]
#         dest_ids = [d['destination_id'] for d in dests if d['destination_id'] not in [departure_city_id, arrival_city_id]]
#         dest_data = {d['id']: d for d in Destination.objects.filter(id__in=[d['destination_id'] for d in dests] + [departure_city_id, arrival_city_id]).values('id', 'latitude', 'longitude')}
#         current_id = departure_city_id

#         while dest_ids:
#             min_dist = float('inf')
#             next_id = None
#             current = dest_data[current_id]
#             for did in dest_ids:
#                 candidate = dest_data[did]
#                 dist = self.haversine(current['latitude'], current['longitude'], candidate['latitude'], candidate['longitude'])
#                 if dist < min_dist:
#                     min_dist = dist
#                     next_id = did
#             if next_id:
#                 ordered.append(next_id)
#                 dest_ids.remove(next_id)
#                 current_id = next_id

#         if arrival_city_id not in ordered:
#             ordered.append(arrival_city_id)
#         elif ordered[-1] != arrival_city_id:
#             ordered.remove(arrival_city_id)
#             ordered.append(arrival_city_id)

#         result = []
#         for oid in ordered:
#             for d in dests:
#                 if d['destination_id'] == oid:
#                     result.append(d)
#                     break
#             if oid == departure_city_id and departure_city_id not in [d['destination_id'] for d in dests]:
#                 result.append({'destination_id': departure_city_id, 'days': 0})
#             elif oid == arrival_city_id and arrival_city_id not in [d['destination_id'] for d in dests]:
#                 result.append({'destination_id': arrival_city_id, 'days': 0})
#         return result

#     @transaction.atomic
#     def post(self, request):
#         user = request.user
#         data = request.data
#         pref_data = data.get('preferences', {})

#         serializer = PreferenceInputSerializer(data=pref_data)
#         if not serializer.is_valid():
#             return Response({"status": "error", "message": serializer.errors}, status=400)

#         pref = serializer.validated_data
#         try:
#             departure_city_id = data.get('departure_city_id')
#             arrival_city_id = data.get('arrival_city_id')
#             destinations = data.get('destinations', [])
#             stops = data.get('stops', [])
#             name = data.get('name', f"Circuit Personnalisé {user.username}")

#             if not (departure_city_id and arrival_city_id):
#                 return Response({"status": "error", "message": "Villes de départ et d'arrivée requises"}, status=400)

#             trip_days = (pref['arrival_date'] - pref['departure_date']).days + 1
#             total_days = sum(d['days'] for d in destinations)
#             if total_days > trip_days:
#                 return Response({"status": "error", "message": f"Total des jours ({total_days}) dépasse la durée du voyage ({trip_days})"}, status=400)
#             if len(destinations) > trip_days:
#                 return Response({"status": "error", "message": f"Trop de destinations ({len(destinations)}) pour la durée du voyage ({trip_days})"}, status=400)

#             ordered_destinations = self.get_shortest_path(destinations, departure_city_id, arrival_city_id)

#             total_price = 0
#             duration = total_days
#             for stop in stops:
#                 if stop.get('hotel_id'):
#                     hotel = Hotel.objects.get(id=stop['hotel_id'])
#                     total_price += (hotel.price or 0) * stop.get('days', 1)
#                 elif stop.get('guest_house_id'):
#                     gh = GuestHouse.objects.get(id=stop['guest_house_id'])
#                     total_price += (gh.price or 0) * stop.get('days', 1)
#                 if stop.get('restaurant_id'):
#                     rest = Restaurant.objects.get(id=stop['restaurant_id'])
#                     total_price += rest.price or 0
#                 if stop.get('activity_id'):
#                     act = Activity.objects.get(id=stop['activity_id'])
#                     total_price += act.price or 0
#                 if stop.get('museum_id'):
#                     mus = Museum.objects.get(id=stop['museum_id'])
#                     total_price += mus.price or 0
#                 if stop.get('festival_id'):
#                     fest = Festival.objects.get(id=stop['festival_id'])
#                     total_price += fest.price or 0

#             if total_price > pref['budget']:
#                 return Response({"status": "error", "message": f"Prix total ({total_price}) dépasse le budget ({pref['budget']})"}, status=400)

#             circuit = Circuit.objects.create(
#                 name=name,
#                 circuit_code=f"CIRCUIT_{int(timezone.now().timestamp())}",
#                 departure_city_id=departure_city_id,
#                 arrival_city_id=arrival_city_id,
#                 price=total_price,
#                 duration=duration,
#                 description=data.get('description', '')
#             )

#             current_day = 1
#             order = 1
#             for dest in ordered_destinations:
#                 dest_id = dest['destination_id']
#                 days = dest['days']
#                 if days == 0:
#                     continue
#                 for day in range(current_day, current_day + days):
#                     dest_stops = [s for s in stops if s['destination_id'] == dest_id and s.get('day', 1) == day - current_day + 1]
#                     for stop in dest_stops:
#                         schedule = CircuitSchedule.objects.create(
#                             circuit=circuit,
#                             destination_id=dest_id,
#                             order=order,
#                             day=day
#                         )
#                         if stop.get('hotel_id'):
#                             schedule.hotel_id = stop['hotel_id']
#                         if stop.get('guest_house_id'):
#                             schedule.guest_house_id = stop['guest_house_id']
#                         if stop.get('restaurant_id'):
#                             schedule.restaurant_id = stop['restaurant_id']
#                         if stop.get('activity_id'):
#                             schedule.activity_id = stop['activity_id']
#                         if stop.get('museum_id'):
#                             schedule.museum_id = stop['museum_id']
#                         if stop.get('festival_id'):
#                             schedule.festival_id = stop['festival_id']
#                         if stop.get('archaeological_site_id'):
#                             schedule.archaeological_site_id = stop['archaeological_site_id']
#                         schedule.save()
#                         order += 1
#                 current_day += days

#             CircuitHistory.objects.create(
#                 circuit=circuit,
#                 user=user,
#                 departure_date=pref['departure_date'],
#                 arrival_date=pref['arrival_date']
#             )

#             # Optionally save Preference to database
#             if data.get('save_preference', False):
#                 Preference.objects.create(
#                     user=user,
#                     budget=pref['budget'],
#                     accommodation=pref['accommodation'],
#                     stars=pref.get('stars'),
#                     guest_house_category=pref.get('guest_house_category'),
#                     departure_city_id=pref['departure_city_id'],
#                     arrival_city_id=pref['arrival_city_id'],
#                     departure_date=pref['departure_date'],
#                     arrival_date=pref['arrival_date'],
#                     forks=pref['forks']
#                 )
#                 PreferenceActivityCategory.objects.create(
#                     preference=Preference.objects.latest('id'),
#                     activity_category_id=pref['activity_category_id']
#                 )
#                 PreferenceCuisine.objects.create(
#                     preference=Preference.objects.latest('id'),
#                     cuisine_id=pref['cuisine_id']
#                 )

#             return Response({"status": "success", "circuit_id": circuit.id})
#         except Exception as e:
#             return Response({"status": "error", "message": str(e)}, status=400)

# Set up logging
logger = logging.getLogger(__name__)




class ComposeCircuitView(APIView):
    permission_classes = [IsAuthenticated]

    def haversine(self, lat1, lon1, lat2, lon2):
        if not all([lat1, lon1, lat2, lon2]):
            return 0
        R = 6371
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance = R * c
        return min(round(distance, 2), 9999.99)

    def get_ordered_destinations(self, destinations, departure_city_id, arrival_city_id):
        logger.info(f"Starting get_ordered_destinations with departure: {departure_city_id}, arrival: {arrival_city_id}, destinations: {destinations}")

        all_dest_ids = [d['destination_id'] for d in destinations] + [departure_city_id, arrival_city_id]
        dest_data = {
            d['id']: d for d in Destination.objects.filter(id__in=all_dest_ids).values('id', 'name', 'latitude', 'longitude')
        }
        logger.info(f"Destination data: {dest_data}")

        missing_dests = [did for did in all_dest_ids if did not in dest_data]
        if missing_dests:
            raise ValueError(f"Destinations not found: {missing_dests}")

        for did, data in dest_data.items():
            if data['latitude'] is None or data['longitude'] is None:
                raise ValueError(f"Destination {data['name']} (ID: {did}) is missing latitude or longitude")

        route = []
        departure_dest = next((d for d in destinations if d['destination_id'] == departure_city_id), None)
        if departure_dest:
            route.append(departure_city_id)
        else:
            raise ValueError(f"Departure city {departure_city_id} not found in destinations")

        for dest in destinations:
            dest_id = dest['destination_id']
            if dest_id not in (departure_city_id, arrival_city_id):
                route.append(dest_id)

        arrival_dest = next((d for d in destinations if d['destination_id'] == arrival_city_id), None)
        if arrival_dest:
            if arrival_city_id not in route:
                route.append(arrival_city_id)
        else:
            raise ValueError(f"Arrival city {arrival_city_id} not found in destinations")

        logger.info(f"Final route (user-selected order): {route}")

        ordered_destinations = []
        for rid in route:
            dest_info = next((d for d in destinations if d['destination_id'] == rid), None)
            dest_full = dest_data.get(rid, {})
            days = dest_info['days'] if dest_info else 1
            ordered_destinations.append({
                'id': rid,
                'name': dest_full.get('name', 'Unknown'),
                'days': days
            })
        logger.info(f"Ordered destinations: {ordered_destinations}")

        return ordered_destinations

    @transaction.atomic
    def post(self, request):
        user = request.user
        data = request.data
        pref_data = data.get('preferences', {})
        logger.info(f"Received request data: {data}")

        # Unique deployment marker
        logger.info("ComposeCircuitView Version: 2025-05-04-v8")

        serializer = PreferenceInputSerializer(data=pref_data)
        if not serializer.is_valid():
            logger.error(f"Preference serializer errors: {serializer.errors}")
            return Response({"status": "error", "message": serializer.errors}, status=400)

        pref = serializer.validated_data
        try:
            # Use the validated departure_city_id and arrival_city_id from preferences
            departure_city_id = pref['departure_city_id']
            arrival_city_id = pref['arrival_city_id']
            destinations = data.get('destinations', [])
            stops = data.get('stops', [])
            name = data.get('name', f"Circuit {departure_city_id} to {arrival_city_id} {int(datetime.now().timestamp())}")
            circuit_code = data.get('circuit_code', f"CIRC{int(datetime.now().timestamp())}")

            logger.info(f"Processing stops: {stops}")

            trip_days = (pref['arrival_date'] - pref['departure_date']).days + 1
            total_days = sum(d['days'] for d in destinations)
            if total_days > trip_days:
                return Response({"status": "error", "message": f"Total days ({total_days}) exceeds trip duration ({trip_days})"}, status=400)
            if len(destinations) > trip_days:
                return Response({"status": "error", "message": f"Too many destinations ({len(destinations)}) for the trip duration ({trip_days})"}, status=400)

            ordered_destinations = self.get_ordered_destinations(destinations, departure_city_id, arrival_city_id)

            dest_data = {d['id']: d for d in Destination.objects.filter(id__in=[d['id'] for d in ordered_destinations]).values('id', 'latitude', 'longitude')}
            distances = []
            for i in range(len(ordered_destinations) - 1):
                from_dest = dest_data.get(ordered_destinations[i]['id'], {})
                to_dest = dest_data.get(ordered_destinations[i + 1]['id'], {})
                distance = self.haversine(
                    from_dest.get('latitude', 0), from_dest.get('longitude', 0),
                    to_dest.get('latitude', 0), to_dest.get('longitude', 0)
                )
                rounded_distance = min(round(distance, 2), 9999.99)
                distances.append(rounded_distance)

            total_price = 0
            duration = total_days
            for stop in stops:
                if stop.get('hotel_id'):
                    try:
                        hotel = Hotel.objects.get(id=stop['hotel_id'])
                        total_price += (hotel.price or 0) * stop.get('days', 1)
                    except Hotel.DoesNotExist:
                        logger.error(f"Hotel ID {stop['hotel_id']} does not exist")
                        raise ValueError(f"Hotel ID {stop['hotel_id']} does not exist")
                elif stop.get('guest_house_id'):
                    try:
                        gh = GuestHouse.objects.get(id=stop['guest_house_id'])
                        total_price += (gh.price or 0) * stop.get('days', 1)
                    except GuestHouse.DoesNotExist:
                        logger.error(f"GuestHouse ID {stop['guest_house_id']} does not exist")
                        raise ValueError(f"GuestHouse ID {stop['guest_house_id']} does not exist")
                if stop.get('restaurant_id'):
                    try:
                        rest = Restaurant.objects.get(id=stop['restaurant_id'])
                        total_price += rest.price or 0
                    except Restaurant.DoesNotExist:
                        logger.error(f"Restaurant ID {stop['restaurant_id']} does not exist")
                        raise ValueError(f"Restaurant ID {stop['restaurant_id']} does not exist")
                if stop.get('activity_id'):
                    try:
                        act = Activity.objects.get(id=stop['activity_id'])
                        total_price += act.price or 0
                    except Activity.DoesNotExist:
                        logger.error(f"Activity ID {stop['activity_id']} does not exist")
                        raise ValueError(f"Activity ID {stop['activity_id']} does not exist")
                if stop.get('museum_id'):
                    try:
                        mus = Museum.objects.get(id=stop['museum_id'])
                        total_price += mus.price or 0
                    except Museum.DoesNotExist:
                        logger.error(f"Museum ID {stop['museum_id']} does not exist")
                        raise ValueError(f"Museum ID {stop['museum_id']} does not exist")
                if stop.get('festival_id'):
                    try:
                        fest = Festival.objects.get(id=stop['festival_id'])
                        total_price += fest.price or 0
                    except Festival.DoesNotExist:
                        logger.error(f"Festival ID {stop['festival_id']} does not exist")
                        raise ValueError(f"Festival ID {stop['festival_id']} does not exist")

            if total_price > pref['budget']:
                return Response({"status": "error", "message": f"Total price ({total_price}) exceeds budget ({pref['budget']})"}, status=400)

            total_price = round(float(total_price), 2)
            duration = int(duration)

            # Removed 'user' from Circuit.objects.create() as it may not exist in the model
            circuit = Circuit.objects.create(
                name=name,
                circuit_code=circuit_code,
                departure_city_id=departure_city_id,
                arrival_city_id=arrival_city_id,
                price=total_price,
                duration=duration,
                description=data.get('description', '')
            )

            logger.info(f"Circuit created with ID: {circuit.id}")
            logger.info(f"Starting schedule creation loop with ordered_destinations: {ordered_destinations}")

            schedules = []
            global_order = 1  # Track order across all days
            distance_index = 0

            for dest_index, dest in enumerate(ordered_destinations):
                dest_id = dest['id']
                days = dest['days']
                if days == 0:
                    logger.warning(f"Skipping destination {dest_id} with 0 days")
                    continue

                logger.info(f"Processing destination {dest_id} with {days} days")
                for local_day in range(1, days + 1):
                    global_day = sum(d['days'] for d in ordered_destinations[:dest_index]) + local_day
                    logger.info(f"Processing destination {dest_id}, global_day {global_day}, local_day {local_day}")

                    # Match stops for this destination and local day
                    dest_stops = []
                    for s in stops:
                        stop_dest_id = int(s['destination'])
                        stop_day = int(s.get('day', 1))
                        logger.info(f"Checking stop: destination={stop_dest_id}, stop_day={stop_day}, against dest_id={dest_id}, local_day={local_day}")
                        if stop_dest_id == dest_id and stop_day == local_day:
                            dest_stops.append(s)
                    logger.info(f"Matched stops for dest_id={dest_id}, local_day={local_day}: {dest_stops}")

                    if not dest_stops:
                        logger.warning(f"No stops matched for destination {dest_id}, day {global_day}")
                        continue

                    for stop in dest_stops:
                        # List of stop types to process
                        stop_types = [
                            ('hotel_id', stop.get('hotel_id')),
                            ('guest_house_id', stop.get('guest_house_id')),
                            ('restaurant_id', stop.get('restaurant_id')),
                            ('activity_id', stop.get('activity_id')),
                            ('museum_id', stop.get('museum_id')),
                            ('festival_id', stop.get('festival_id')),
                            ('archaeological_site_id', stop.get('archaeological_site_id')),
                        ]

                        # Create a separate CircuitSchedule entry for each non-null stop type
                        for stop_type, stop_id in stop_types:
                            if stop_id is None:
                                continue

                            # Validate the existence of the entity before proceeding
                            try:
                                if stop_type == 'hotel_id' and not Hotel.objects.filter(id=stop_id).exists():
                                    raise ValueError(f"Invalid hotel_id: {stop_id}")
                                elif stop_type == 'guest_house_id' and not GuestHouse.objects.filter(id=stop_id).exists():
                                    raise ValueError(f"Invalid guest_house_id: {stop_id}")
                                elif stop_type == 'restaurant_id' and not Restaurant.objects.filter(id=stop_id).exists():
                                    raise ValueError(f"Invalid restaurant_id: {stop_id}")
                                elif stop_type == 'activity_id' and not Activity.objects.filter(id=stop_id).exists():
                                    raise ValueError(f"Invalid activity_id: {stop_id}")
                                elif stop_type == 'museum_id' and not Museum.objects.filter(id=stop_id).exists():
                                    raise ValueError(f"Invalid museum_id: {stop_id}")
                                elif stop_type == 'festival_id' and not Festival.objects.filter(id=stop_id).exists():
                                    raise ValueError(f"Invalid festival_id: {stop_id}")
                                elif stop_type == 'archaeological_site_id' and not ArchaeologicalSite.objects.filter(id=stop_id).exists():
                                    raise ValueError(f"Invalid archaeological_site_id: {stop_id}")
                            except ValueError as e:
                                logger.error(f"Validation error for {stop_type}: {str(e)}")
                                raise

                            # Determine if this is the last stop type for this destination to assign distance
                            stop_types_with_values = [st for st, sid in stop_types if sid is not None]
                            current_stop_index = stop_types_with_values.index((stop_type, stop_id))
                            is_last_stop = (stop.index(stop) == len(dest_stops) - 1 and 
                                           current_stop_index == len(stop_types_with_values) - 1)

                            distance_km = None
                            if is_last_stop and distance_index < len(distances):
                                distance_km = distances[distance_index]
                                distance_index += 1

                            try:
                                logger.info(f"Attempting to create schedule for circuit {circuit.id}, dest {dest_id}, day {global_day}, order {global_order}, type {stop_type}")
                                schedule = CircuitSchedule.objects.create(
                                    circuit=circuit,
                                    destination_id=dest_id,
                                    order=global_order,
                                    day=global_day,
                                    distance_km=distance_km if distance_km is not None else 0,
                                    hotel_id=stop_id if stop_type == 'hotel_id' else None,
                                    guest_house_id=stop_id if stop_type == 'guest_house_id' else None,
                                    restaurant_id=stop_id if stop_type == 'restaurant_id' else None,
                                    activity_id=stop_id if stop_type == 'activity_id' else None,
                                    museum_id=stop_id if stop_type == 'museum_id' else None,
                                    festival_id=stop_id if stop_type == 'festival_id' else None,
                                    archaeological_site_id=stop_id if stop_type == 'archaeological_site_id' else None
                                )
                                logger.info(f"Created schedule: ID {schedule.id}, Destination {dest_id}, Day {global_day}, Order {global_order}")
                                schedules.append({
                                    "id": schedule.id,
                                    "destination": dest_id,
                                    "day": global_day,
                                    "order": global_order,
                                    "hotel_id": stop_id if stop_type == 'hotel_id' else None,
                                    "guest_house_id": stop_id if stop_type == 'guest_house_id' else None,
                                    "restaurant_id": stop_id if stop_type == 'restaurant_id' else None,
                                    "activity_id": stop_id if stop_type == 'activity_id' else None,
                                    "museum_id": stop_id if stop_type == 'museum_id' else None,
                                    "festival_id": stop_id if stop_type == 'festival_id' else None,
                                    "archaeological_site_id": stop_id if stop_type == 'archaeological_site_id' else None
                                })
                                global_order += 1
                            except Exception as e:
                                logger.error(f"Failed to create schedule for Destination {dest_id}, Day {global_day}, Order {global_order}: {str(e)}\n{traceback.format_exc()}")
                                raise

            # Check if CircuitHistory model has a 'user' field; if not, remove it
            CircuitHistory.objects.create(
                circuit=circuit,
                departure_date=pref['departure_date'],
                arrival_date=pref['arrival_date']
            )

            response_data = {
                "id": circuit.id,
                "schedules": schedules,
                "name": circuit.name,
                "circuit_code": circuit.circuit_code,
                "price": str(circuit.price),
                "duration": circuit.duration,
                "description": circuit.description,
                "departure_city": circuit.departure_city_id,
                "arrival_city": circuit.arrival_city_id,
                "ordered_destinations": ordered_destinations
            }
            logger.info(f"Returning response: {response_data}")
            return Response(response_data, status=201)

        except Exception as e:
            logger.error(f"Error saving circuit: {str(e)}\n{traceback.format_exc()}")
            return Response({"status": "error", "message": str(e)}, status=400)

class AdminCircuitView(APIView):
    permission_classes = [IsAdmin]  # Only admins can access this view

    def generate_unique_circuit_code(self):
        """Generate a unique circuit code with retries."""
        max_attempts = 10
        for attempt in range(max_attempts):
            # Generate a circuit code using timestamp and random number
            circuit_code = f"CIRC{int(time.time() * 1000)}{random.randint(0, 999):03d}"
            # Check if this code already exists in the database
            if not Circuit.objects.filter(circuit_code=circuit_code).exists():
                return circuit_code
        raise Exception("Failed to generate a unique circuit code after multiple attempts.")

    def post(self, request):
        data = request.data
        name = data.get('name')
        description = data.get('description', '')
        departure_city_id = data.get('departure_city_id')
        arrival_city_id = data.get('arrival_city_id')
        itinerary = data.get('itinerary', [])

        # Validate required fields
        if not all([name, departure_city_id, arrival_city_id, itinerary]):
            return Response(
                {"detail": "Missing required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate departure and arrival cities
        try:
            departure_city = Destination.objects.get(id=departure_city_id)
            arrival_city = Destination.objects.get(id=arrival_city_id)
        except Destination.DoesNotExist:
            return Response(
                {"detail": "Invalid departure or arrival city."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate total price by summing entity prices
        total_price = 0
        entity_types = {
            'hotel': Hotel,
            'activity': Activity,
            'guest_house': GuestHouse,
            'festival': Festival,
            'museum': Museum,
            'archaeological_site': ArchaeologicalSite,
            'restaurant': Restaurant,
        }

        for stop in itinerary:
            entities = stop.get('entities', {})
            for entity_type, entity_id in entities.items():
                if entity_type in entity_types and entity_id:
                    try:
                        entity = entity_types[entity_type].objects.get(id=entity_id)
                        total_price += float(entity.price) if hasattr(entity, 'price') and entity.price else 0
                    except entity_types[entity_type].DoesNotExist:
                        return Response(
                            {"detail": f"Invalid {entity_type} ID: {entity_id}"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        try:
            # Generate a unique circuit code
            circuit_code = self.generate_unique_circuit_code()

            # Create the circuit
            circuit = Circuit.objects.create(
                name=name,
                description=description,
                departure_city=departure_city,
                arrival_city=arrival_city,
                price=total_price,
                circuit_code=circuit_code,  # Use the generated unique code
                duration=len(set(stop['day'] for stop in itinerary)),
            )

            # Create schedules for each stop in the itinerary
            for stop in itinerary:
                destination_id = stop.get('destination_id')
                day = stop.get('day')
                order = stop.get('order')
                distance_km = stop.get('distance_km', 0)
                entities = stop.get('entities', {})

                try:
                    destination = Destination.objects.get(id=destination_id)
                except Destination.DoesNotExist:
                    circuit.delete()
                    return Response(
                        {"detail": f"Invalid destination ID: {destination_id}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                schedule_data = {
                    'circuit': circuit,
                    'destination': destination,
                    'order': order,
                    'day': day,
                    'distance_km': distance_km,
                }
                for entity_type, entity_id in entities.items():
                    if entity_id:
                        schedule_data[f"{entity_type}_id"] = entity_id

                schedule = CircuitSchedule.objects.create(**schedule_data)
                logger.info(f"Created schedule: ID {schedule.id}, Destination {destination_id}, Day {day}")

            return Response(
                {
                    "circuit_id": circuit.id,
                    "ordered_destinations": [
                        {
                            "destination_id": stop['destination_id'],
                            "day": stop['day'],
                            "order": stop['order'],
                            "entities": stop['entities']
                        }
                        for stop in itinerary
                    ]
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Failed to create admin circuit: {str(e)}")
            return Response(
                {"detail": f"Failed to create circuit: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )





class DestinationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = 'all_destinations'
        cached = cache.get(cache_key)
        if cached:
            return Response({"status": "success", "destinations": cached})

        try:
            destinations = list(Destination.objects.all().values('id', 'name', 'latitude', 'longitude'))
            cache.set(cache_key, destinations, timeout=3600)
            return Response({"status": "success", "destinations": destinations})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=400)

class CircuitViewSet(viewsets.ModelViewSet):
    queryset = Circuit.objects.all()
    serializer_class = CircuitCreateSerializer
    permission_classes = [CircuitPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'description', 'departure_city__name', 'arrival_city__name', 'schedules__destination__name']  # Search related fields' names

class CircuitHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = CircuitHistorySerializer

    def get_queryset(self):
        # Fetch all circuit history entries for the current user
        return CircuitHistory.objects.filter(
            user=self.request.user
        ).select_related(
            'circuit',
            'circuit__departure_city',
            'circuit__arrival_city'
        ).prefetch_related(
            'circuit__schedules',
            'circuit__schedules__destination',
            'circuit__schedules__hotel',
            'circuit__schedules__guest_house',
            'circuit__schedules__restaurant',
            'circuit__schedules__activity',
            'circuit__schedules__museum',
            'circuit__schedules__festival',
            'circuit__schedules__archaeological_site'
        )

    def create(self, request, *args, **kwargs):
        circuit_id = request.data.get('circuit')
        departure_date = request.data.get('departure_date')
        arrival_date = request.data.get('arrival_date')

        try:
            departure_date = datetime.strptime(departure_date, "%Y-%m-%d")
            arrival_date = datetime.strptime(arrival_date, "%Y-%m-%d")
        except ValueError:
            return Response({"error": "Format de date invalide. Utilisez YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        delta = arrival_date - departure_date
        duration_in_days = delta.days + 1  # Add 1 to include the arrival date, matching frontend logic

        try:
            circuit = Circuit.objects.get(id=circuit_id)
        except Circuit.DoesNotExist:
            return Response({"error": "Circuit introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if duration_in_days != circuit.duration:
            return Response(
                {"error": f"La durée du circuit doit être de {circuit.duration} jours."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def check_history_duplicate(self, request):
        circuit_id = request.data.get('circuit')
        departure_date = request.data.get('departure_date')
        arrival_date = request.data.get('arrival_date')
        user = request.user

        if not circuit_id or not departure_date or not arrival_date:
            return Response(
                {"error": "Circuit ID, departure date, and arrival date are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            departure_date = datetime.strptime(departure_date, "%Y-%m-%d").date()
            arrival_date = datetime.strptime(arrival_date, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Format de date invalide. Utilisez YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            circuit = Circuit.objects.get(id=circuit_id)
        except Circuit.DoesNotExist:
            return Response(
                {"error": "Circuit introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        exists = CircuitHistory.objects.filter(
            circuit=circuit,
            departure_date=departure_date,
            arrival_date=arrival_date,
            user=user
        ).exists()

        if exists:
            return Response(
                {"exists": True, "message": "A circuit history entry already exists for this circuit and dates."},
                status=status.HTTP_200_OK
            )

        return Response({"exists": False}, status=status.HTTP_200_OK)
    













class SuggestedPlacesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cache_key = f'suggested_places_{request.user.id}_{hash(str(request.data))}'
        cached = cache.get(cache_key)
        if cached:
            print(f"Returning cached suggestions: {cached}")  # Debug
            return Response({"status": "success", "suggestions": cached})

        serializer = PreferenceInputSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")  # Debug
            return Response({"status": "error", "message": serializer.errors}, status=400)

        pref_data = serializer.validated_data
        budget = pref_data['budget']
        destination_ids = pref_data['destination_ids']
        suggestions = {
            'hotels': [],
            'activities': [],
            'museums': []
        }

        try:
            # Fetch hotels
            hotels = Hotel.objects.filter(
                destination_id__in=destination_ids,
                stars__gte=pref_data.get('stars', 0),
                price__lte=budget
            ).order_by('price')[:5]  # Limit to 5 per type
            suggestions['hotels'] = [
                {'id': h.id, 'name': h.name, 'destination_id': h.destination_id, 'price': float(h.price), 'stars': h.stars}
                for h in hotels
            ]

            # Fetch activities
            activities = Activity.objects.filter(
                destination_id__in=destination_ids,
                category_id=pref_data['activity_category_id'],
                price__lte=budget
            ).order_by('price')[:5]
            suggestions['activities'] = [
                {'id': a.id, 'name': a.name, 'destination_id': a.destination_id, 'price': float(a.price), 'category_id': a.category_id}
                for a in activities
            ]

            # Fetch museums
            museums = Museum.objects.filter(
                destination_id__in=destination_ids,
                price__lte=budget
            ).order_by('price')[:5]
            suggestions['museums'] = [
                {'id': m.id, 'name': m.name, 'destination_id': m.destination_id, 'price': float(m.price)}
                for m in museums
            ]

            print(f"Generated suggestions: {suggestions}")  # Debug
            cache.set(cache_key, suggestions, timeout=600)
            return Response({"status": "success", "suggestions": suggestions})
        except Exception as e:
            print(f"Error in SuggestedPlacesView: {str(e)}")  # Debug
            return Response({"status": "error", "message": str(e)}, status=400)

# Keep other views (e.g., FilteredEntitiesView, ComposeCircuitView) unchanged




class CircuitCheckView(APIView):
    def post(self, request):
        try:
            data = request.data
            print("Received data:", data)  # Debugging log

            # Validate input
            if not all(key in data for key in ['departure_city', 'arrival_city', 'duration', 'destinations']):
                return Response(
                    {'error': 'Missing required fields: departure_city, arrival_city, duration, or destinations'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            departure_city = data.get('departure_city')
            arrival_city = data.get('arrival_city')
            duration = data.get('duration')
            destinations = data.get('destinations', [])

            if not isinstance(departure_city, int) or not isinstance(arrival_city, int) or not isinstance(duration, int):
                return Response(
                    {'error': 'departure_city, arrival_city, and duration must be integers'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not isinstance(destinations, list) or not all('destination_id' in d and 'days' in d for d in destinations):
                return Response(
                    {'error': 'destinations must be a list of objects with destination_id and days'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Log the query parameters
            print(f"Querying Circuit with departure_city={departure_city}, arrival_city={arrival_city}, duration={duration}")

            # Check if an itinerary exists with the same departure, arrival, and duration
            matching_itineraries = Circuit.objects.filter(
                departure_city=departure_city,
                arrival_city=arrival_city,
                duration=duration
            ).annotate(dest_count=Count('schedules'))  # Use the correct related_name

            print(f"Found {matching_itineraries.count()} matching itineraries")

            for itinerary in matching_itineraries:
                print(f"Checking itinerary ID {itinerary.id}")
                itinerary_schedules = CircuitSchedule.objects.filter(circuit=itinerary).values('destination_id', 'day').order_by('order')

                # Convert schedules to a list of destinations and their days
                itinerary_dests = []
                current_dest = None
                days_count = 1

                for schedule in itinerary_schedules:
                    dest_id = schedule['destination_id']
                    if current_dest and current_dest['destination_id'] == dest_id:
                        days_count += 1
                    else:
                        if current_dest:
                            itinerary_dests.append({'destination_id': current_dest['destination_id'], 'days': days_count})
                        current_dest = {'destination_id': dest_id}
                        days_count = 1
                if current_dest:
                    itinerary_dests.append({'destination_id': current_dest['destination_id'], 'days': days_count})

                print(f"Itinerary destinations: {itinerary_dests}")

                if len(itinerary_dests) != len(destinations):
                    print("Destination count mismatch, skipping...")
                    continue

                itinerary_dest_dict = {d['destination_id']: d['days'] for d in itinerary_dests}
                request_dest_dict = {d['destination_id']: d['days'] for d in destinations}
                print(f"Itinerary destinations dict: {itinerary_dest_dict}")
                print(f"Request destinations dict: {request_dest_dict}")

                if itinerary_dest_dict == request_dest_dict:
                    print(f"Match found for itinerary ID {itinerary.id}")
                    return Response({'exists': True, 'circuitId': itinerary.id}, status=status.HTTP_200_OK)

            print("No matching itinerary found")
            return Response({'exists': False}, status=status.HTTP_200_OK)

        except Circuit.DoesNotExist:
            print("Circuit model not found in database")
            return Response({'error': 'Circuit model not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except CircuitSchedule.DoesNotExist:
            print("CircuitSchedule model not found in database")
            return Response({'error': 'CircuitSchedule model not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({'error': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)