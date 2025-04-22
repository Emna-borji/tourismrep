from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction
from django.utils import timezone
from django.db.models import Avg
from users.models import Preference, PreferenceActivityCategory, PreferenceCuisine, CustomUser
from tourism.models import Hotel, GuestHouse, Restaurant, Activity, Museum, Festival, ArchaeologicalSite, Destination
from itinerary.models import Circuit, CircuitSchedule, CircuitHistory
from itinerary.serializers import CircuitCreateSerializer, CircuitScheduleSerializer, CircuitHistorySerializer
from rest_framework import viewsets
from users.permissions import CircuitPermission
from django.core.cache import cache
import math
from datetime import datetime, date
from rest_framework.serializers import Serializer, IntegerField, DecimalField, CharField, DateField








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

class ComposeCircuitView(APIView):
    permission_classes = [IsAuthenticated]

    def haversine(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points in km using Haversine formula."""
        R = 6371
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def get_shortest_path(self, destinations, departure_city_id, arrival_city_id):
        dests = destinations.copy()
        ordered = [departure_city_id]
        dest_ids = [d['destination_id'] for d in dests if d['destination_id'] not in [departure_city_id, arrival_city_id]]
        dest_data = {d['id']: d for d in Destination.objects.filter(id__in=[d['destination_id'] for d in dests] + [departure_city_id, arrival_city_id]).values('id', 'latitude', 'longitude')}
        current_id = departure_city_id

        while dest_ids:
            min_dist = float('inf')
            next_id = None
            current = dest_data[current_id]
            for did in dest_ids:
                candidate = dest_data[did]
                dist = self.haversine(current['latitude'], current['longitude'], candidate['latitude'], candidate['longitude'])
                if dist < min_dist:
                    min_dist = dist
                    next_id = did
            if next_id:
                ordered.append(next_id)
                dest_ids.remove(next_id)
                current_id = next_id

        if arrival_city_id not in ordered:
            ordered.append(arrival_city_id)
        elif ordered[-1] != arrival_city_id:
            ordered.remove(arrival_city_id)
            ordered.append(arrival_city_id)

        result = []
        for oid in ordered:
            for d in dests:
                if d['destination_id'] == oid:
                    result.append(d)
                    break
            if oid == departure_city_id and departure_city_id not in [d['destination_id'] for d in dests]:
                result.append({'destination_id': departure_city_id, 'days': 0})
            elif oid == arrival_city_id and arrival_city_id not in [d['destination_id'] for d in dests]:
                result.append({'destination_id': arrival_city_id, 'days': 0})
        return result

    @transaction.atomic
    def post(self, request):
        user = request.user
        data = request.data
        pref_data = data.get('preferences', {})

        serializer = PreferenceInputSerializer(data=pref_data)
        if not serializer.is_valid():
            return Response({"status": "error", "message": serializer.errors}, status=400)

        pref = serializer.validated_data
        try:
            departure_city_id = data.get('departure_city_id')
            arrival_city_id = data.get('arrival_city_id')
            destinations = data.get('destinations', [])
            stops = data.get('stops', [])
            name = data.get('name', f"Circuit Personnalisé {user.username}")

            if not (departure_city_id and arrival_city_id):
                return Response({"status": "error", "message": "Villes de départ et d'arrivée requises"}, status=400)

            trip_days = (pref['arrival_date'] - pref['departure_date']).days + 1
            total_days = sum(d['days'] for d in destinations)
            if total_days > trip_days:
                return Response({"status": "error", "message": f"Total des jours ({total_days}) dépasse la durée du voyage ({trip_days})"}, status=400)
            if len(destinations) > trip_days:
                return Response({"status": "error", "message": f"Trop de destinations ({len(destinations)}) pour la durée du voyage ({trip_days})"}, status=400)

            ordered_destinations = self.get_shortest_path(destinations, departure_city_id, arrival_city_id)

            total_price = 0
            duration = total_days
            for stop in stops:
                if stop.get('hotel_id'):
                    hotel = Hotel.objects.get(id=stop['hotel_id'])
                    total_price += (hotel.price or 0) * stop.get('days', 1)
                elif stop.get('guest_house_id'):
                    gh = GuestHouse.objects.get(id=stop['guest_house_id'])
                    total_price += (gh.price or 0) * stop.get('days', 1)
                if stop.get('restaurant_id'):
                    rest = Restaurant.objects.get(id=stop['restaurant_id'])
                    total_price += rest.price or 0
                if stop.get('activity_id'):
                    act = Activity.objects.get(id=stop['activity_id'])
                    total_price += act.price or 0
                if stop.get('museum_id'):
                    mus = Museum.objects.get(id=stop['museum_id'])
                    total_price += mus.price or 0
                if stop.get('festival_id'):
                    fest = Festival.objects.get(id=stop['festival_id'])
                    total_price += fest.price or 0

            if total_price > pref['budget']:
                return Response({"status": "error", "message": f"Prix total ({total_price}) dépasse le budget ({pref['budget']})"}, status=400)

            circuit = Circuit.objects.create(
                name=name,
                circuit_code=f"CIRCUIT_{int(timezone.now().timestamp())}",
                departure_city_id=departure_city_id,
                arrival_city_id=arrival_city_id,
                price=total_price,
                duration=duration,
                description=data.get('description', '')
            )

            current_day = 1
            order = 1
            for dest in ordered_destinations:
                dest_id = dest['destination_id']
                days = dest['days']
                if days == 0:
                    continue
                for day in range(current_day, current_day + days):
                    dest_stops = [s for s in stops if s['destination_id'] == dest_id and s.get('day', 1) == day - current_day + 1]
                    for stop in dest_stops:
                        schedule = CircuitSchedule.objects.create(
                            circuit=circuit,
                            destination_id=dest_id,
                            order=order,
                            day=day
                        )
                        if stop.get('hotel_id'):
                            schedule.hotel_id = stop['hotel_id']
                        if stop.get('guest_house_id'):
                            schedule.guest_house_id = stop['guest_house_id']
                        if stop.get('restaurant_id'):
                            schedule.restaurant_id = stop['restaurant_id']
                        if stop.get('activity_id'):
                            schedule.activity_id = stop['activity_id']
                        if stop.get('museum_id'):
                            schedule.museum_id = stop['museum_id']
                        if stop.get('festival_id'):
                            schedule.festival_id = stop['festival_id']
                        if stop.get('archaeological_site_id'):
                            schedule.archaeological_site_id = stop['archaeological_site_id']
                        schedule.save()
                        order += 1
                current_day += days

            CircuitHistory.objects.create(
                circuit=circuit,
                user=user,
                departure_date=pref['departure_date'],
                arrival_date=pref['arrival_date']
            )

            # Optionally save Preference to database
            if data.get('save_preference', False):
                Preference.objects.create(
                    user=user,
                    budget=pref['budget'],
                    accommodation=pref['accommodation'],
                    stars=pref.get('stars'),
                    guest_house_category=pref.get('guest_house_category'),
                    departure_city_id=pref['departure_city_id'],
                    arrival_city_id=pref['arrival_city_id'],
                    departure_date=pref['departure_date'],
                    arrival_date=pref['arrival_date'],
                    forks=pref['forks']
                )
                PreferenceActivityCategory.objects.create(
                    preference=Preference.objects.latest('id'),
                    activity_category_id=pref['activity_category_id']
                )
                PreferenceCuisine.objects.create(
                    preference=Preference.objects.latest('id'),
                    cuisine_id=pref['cuisine_id']
                )

            return Response({"status": "success", "circuit_id": circuit.id})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=400)

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

class CircuitHistoryViewSet(viewsets.ModelViewSet):
    queryset = CircuitHistory.objects.all()
    serializer_class = CircuitHistorySerializer

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
        duration_in_days = delta.days

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