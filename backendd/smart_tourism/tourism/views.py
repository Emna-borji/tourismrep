# tourism/views.py
from django.shortcuts import render
from rest_framework.mixins import ListModelMixin
from rest_framework import permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone
from .models import Hotel, Restaurant, Activity, Museum, ArchaeologicalSite, Festival, GuestHouse, Destination, Review, Favorite, Equipment, Cuisine, ActivityCategory
from .serializers import HotelSerializer, RestaurantSerializer, ActivitySerializer, MuseumSerializer, ArchaeologicalSiteSerializer, FestivalSerializer, GuestHouseSerializer, DestinationSerializer, ReviewSerializer, FavoriteSerializer, CuisineSerializer, ActivityCategorySerializer
from users.permissions import IsAdmin, IsReviewOwnerOrAdmin, IsAdminOrCreateOnly
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.decorators import action
from .services import RecommendationService
from itinerary.models import Circuit
from itinerary.serializers import CircuitCreateSerializer
import logging
from django.http import JsonResponse
from rest_framework import serializers
from django.views.decorators.http import require_GET
from utils.geo_utils import calculate_distance
from django.db.models import Avg, F

logger = logging.getLogger(__name__)



@require_GET
def nearby_entities(request, entity_type):
    try:
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
        radius = float(request.GET.get('radius', 10))  # Default radius of 10 km

        if not lat or not lon or not all(isinstance(float(x), (int, float)) for x in (lat, lon)):
            return JsonResponse({'error': 'Latitude and longitude are required and must be numbers'}, status=400)

        lat, lon = float(lat), float(lon)

        # Map entity_type to the appropriate model
        model_map = {
            'hotel': Hotel,
            'restaurant': Restaurant,
            'guest_house': GuestHouse,
            # Add other entity types as needed
        }
        model = model_map.get(entity_type.lower())
        if not model:
            return JsonResponse({'error': 'Invalid entity type'}, status=400)

        # Fetch all entities and calculate distances
        all_entities = model.objects.all()
        nearby_entities = []
        for entity in all_entities:
            distance = calculate_distance(lat, lon, entity.latitude, entity.longitude)
            if distance <= radius:
                nearby_entities.append({
                    'id': entity.id,
                    'name': entity.name,
                    'description': getattr(entity, 'description', 'No description'),
                    'rating': getattr(entity, 'rating', 0),
                    'image': getattr(entity, 'image', ''),
                    'latitude': entity.latitude,
                    'longitude': entity.longitude,
                    'distance': round(distance, 2),
                })

        # Sort by distance
        nearby_entities.sort(key=lambda x: x['distance'])

        return JsonResponse({'nearby_entities': nearby_entities})

    except Exception as e:
        logger.error(f"Error fetching nearby entities: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch nearby entities'}, status=500)
    

class BestRatedEntitiesView(APIView):
    permission_classes = []  # Public access

    def get(self, request):
        logger.info("Received GET request for BestRatedEntitiesView with params: %s", request.query_params)
        try:
            top_n = int(request.query_params.get('top_n', 3))
            logger.info("Using top_n: %d", top_n)

            entity_types = {
                'circuit': (Circuit, CircuitCreateSerializer),
                'hotel': (Hotel, HotelSerializer),
                'guest_house': (GuestHouse, GuestHouseSerializer),
                'restaurant': (Restaurant, RestaurantSerializer),
                'activity': (Activity, ActivitySerializer),
                'museum': (Museum, MuseumSerializer),
                'festival': (Festival, FestivalSerializer),
                'archaeological_site': (ArchaeologicalSite, ArchaeologicalSiteSerializer),
            }

            best_rated = {}
            for entity_type, (model, serializer_class) in entity_types.items():
                logger.debug("Processing best-rated entities for type: %s", entity_type)
                try:
                    # Fetch all entities
                    entities = model.objects.all()
                    logger.debug("Total entities in database for %s: %d", entity_type, entities.count())
                    if not entities.exists():
                        logger.warning("No entities found in database for %s", entity_type)
                        best_rated[entity_type] = []
                        continue

                    # Log sample entity to verify fields
                    if entities:
                        sample_entity = entities[0]
                        logger.debug("Sample entity for %s: %s", entity_type, {
                            'id': sample_entity.id,
                            'name': getattr(sample_entity, 'name', 'N/A'),
                        })

                    # Serialize entities to get the ratings
                    serialized = serializer_class(entities, many=True).data
                    logger.debug("Serialized data for %s (raw): %s", entity_type, serialized)

                    # Check if serialization returned any data
                    if not serialized:
                        logger.warning("Serialization returned no data for %s", entity_type)
                        best_rated[entity_type] = []
                        continue

                    # Sort by rating if available, otherwise take first N by ID descending
                    entities_with_ratings = [entity for entity in serialized if entity.get('rating') is not None]
                    if entities_with_ratings:
                        sorted_entities = sorted(
                            serialized,
                            key=lambda x: x.get('rating', None) if x.get('rating') is not None else -float('inf'),
                            reverse=True
                        )[:top_n]
                        logger.info("Entities with ratings found for %s, sorted top %d: %s", entity_type, top_n, sorted_entities)
                    else:
                        logger.info("No entities with ratings for %s, falling back to default ordering", entity_type)
                        entities = model.objects.all().order_by('-id')[:top_n]
                        sorted_entities = serializer_class(entities, many=True).data
                        logger.info("Fallback top %d entities for %s: %s", top_n, entity_type, sorted_entities)

                    best_rated[entity_type] = sorted_entities
                except Exception as e:
                    logger.error("Error processing best-rated entities for %s: %s", entity_type, str(e), exc_info=True)
                    best_rated[entity_type] = []
                    continue

            logger.info("Successfully prepared response with %d entity types", len(best_rated))
            logger.info("Best rated entities response: %s", best_rated)

            # Check if all entity types are empty
            has_data = any(len(entities) > 0 for entities in best_rated.values())
            if not has_data:
                logger.warning("All entity types are empty in best_rated_entities")

            return Response({
                'status': 'success',
                'best_rated_entities': best_rated
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Unexpected error in BestRatedEntitiesView: %s", str(e), exc_info=True)
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# class CuisineViewSet(viewsets.ModelViewSet):
#     queryset = Cuisine.objects.all()
#     serializer_class = CuisineSerializer

#     def get_permissions(self):
#         """
#         Allow authenticated users to view (GET), but restrict create/update/delete to admins or create-only users.
#         """
#         if self.action in ['list', 'retrieve']:
#             return [IsAuthenticated()]
#         return [IsAdminOrCreateOnly()]

#     def get_queryset(self):
#         return Cuisine.objects.all()

class CuisineViewSet(viewsets.ModelViewSet):
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer

    def get_permissions(self):
        """
        Allow anyone to view cuisines (GET), but restrict create/update/delete to admins or create-only users.
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminOrCreateOnly()]

    def get_queryset(self):
        return Cuisine.objects.all()
    
class ActivityCategoryViewSet(viewsets.ModelViewSet):
    queryset = ActivityCategory.objects.all()
    serializer_class = ActivityCategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrCreateOnly()]

    def get_queryset(self):
        return ActivityCategory.objects.all()

class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = Hotel.objects.select_related('destination').all()

        # Search filters
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        # Filter by number of stars
        stars = self.request.query_params.get('stars', None)
        if stars:
            queryset = queryset.filter(stars=stars)

        # Filter by destination_id
        destination_id = self.request.query_params.get('destination_id', None)
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)

        # Sorting by price
        sort_by = self.request.query_params.get('sort_by', None)
        sort_direction = self.request.query_params.get('sort_direction', 'asc')
        if sort_by == 'price':
            if sort_direction == 'desc':
                queryset = queryset.order_by('-price')
            else:
                queryset = queryset.order_by('price')

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        hotel = serializer.save()
        equipment_ids = self.request.data.get('equipments', [])
        for equipment_id in equipment_ids:
            try:
                equipment = Equipment.objects.get(id=equipment_id)
                hotel.equipments.add(equipment)
            except Equipment.DoesNotExist:
                pass

    def perform_update(self, serializer):
        hotel = serializer.save()
        equipment_ids = self.request.data.get('equipments', [])
        hotel.equipments.clear()
        for equipment_id in equipment_ids:
            try:
                equipment = Equipment.objects.get(id=equipment_id)
                hotel.equipments.add(equipment)
            except Equipment.DoesNotExist:
                pass

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = Restaurant.objects.select_related('destination', 'cuisine').all()

        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        # Filter by number of forks
        forks = self.request.query_params.get('forks', None)
        if forks:
            queryset = queryset.filter(forks=forks)

        # Filter by destination_id
        destination_id = self.request.query_params.get('destination_id', None)
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)

        # Cuisine filter
        cuisine = self.request.query_params.get('cuisine', None)
        if cuisine:
            queryset = queryset.filter(cuisine__name__icontains=cuisine)

        # Sorting by price
        sort_by = self.request.query_params.get('sort_by', None)
        sort_direction = self.request.query_params.get('sort_direction', 'asc')
        if sort_by == 'price':
            if sort_direction == 'desc':
                queryset = queryset.order_by('-price')
            else:
                queryset = queryset.order_by('price')

        return queryset

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = Activity.objects.select_related('destination').all()

        # Filter by destination_id
        destination_id = self.request.query_params.get('destination_id', None)
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)

        # Sorting by price
        sort_by = self.request.query_params.get('sort_by', None)
        sort_direction = self.request.query_params.get('sort_direction', 'asc')
        if sort_by == 'price':
            if sort_direction == 'desc':
                queryset = queryset.order_by('-price')
            else:
                queryset = queryset.order_by('price')

        return queryset

class MuseumViewSet(viewsets.ModelViewSet):
    queryset = Museum.objects.all()
    serializer_class = MuseumSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = Museum.objects.select_related('destination').all()

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Filter by destination_id
        destination_id = self.request.query_params.get('destination_id', None)
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)

        # Sorting by price
        sort_by = self.request.query_params.get('sort_by', None)
        sort_direction = self.request.query_params.get('sort_direction', 'asc')
        if sort_by == 'price':
            if sort_direction == 'desc':
                queryset = queryset.order_by('-price')
            else:
                queryset = queryset.order_by('price')

        return queryset

class ArchaeologicalSiteViewSet(viewsets.ModelViewSet):
    queryset = ArchaeologicalSite.objects.all()
    serializer_class = ArchaeologicalSiteSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = ArchaeologicalSite.objects.select_related('destination').all()

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Filter by destination_id
        destination_id = self.request.query_params.get('destination_id', None)
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)

        return queryset

class FestivalViewSet(viewsets.ModelViewSet):
    queryset = Festival.objects.all()
    serializer_class = FestivalSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = Festival.objects.select_related('destination').all()

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Filter by destination_id
        destination_id = self.request.query_params.get('destination_id', None)
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)

        # Sorting by price
        sort_by = self.request.query_params.get('sort_by', None)
        sort_direction = self.request.query_params.get('sort_direction', 'asc')
        if sort_by == 'price':
            if sort_direction == 'desc':
                queryset = queryset.order_by('-price')
            else:
                queryset = queryset.order_by('price')

        return queryset

class GuestHouseViewSet(viewsets.ModelViewSet):
    queryset = GuestHouse.objects.all()
    serializer_class = GuestHouseSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = GuestHouse.objects.select_related('destination').all()

        print(f"Initial queryset count: {queryset.count()}")
        initial_results = [(gh.name, gh.price) for gh in queryset]
        print(f"Initial results: {initial_results}")

        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
            print(f"After search filter ('{search}'): {queryset.count()}")

        # Sorting by price
        sort_by = self.request.query_params.get('sort_by', None)
        sort_direction = self.request.query_params.get('sort_direction', 'asc')
        print(f"Sort parameters received - sort_by: '{sort_by}', sort_direction: '{sort_direction}'")

        if sort_by == 'price':
            if sort_direction == 'desc':
                queryset = queryset.order_by('-price')
                print("Sorting by price in descending order")
            else:
                queryset = queryset.order_by('price')
                print("Sorting by price in ascending order")
        else:
            print("No price sorting applied")

        # Debug: Log the sorted results
        sorted_results = [(gh.name, gh.price) for gh in queryset]
        print(f"Sorted results: {sorted_results}")

        # Filter by destination_id
        destination_id = self.request.query_params.get('destination_id', None)
        if destination_id:
            queryset = queryset.filter(destination_id=destination_id)
            print(f"After destination_id filter ('{destination_id}'): {queryset.count()}")

        # Category filter
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
            print(f"After category filter ('{category}'): {queryset.count()}")

        # Debug: Log the final queryset
        final_results = [(gh.name, gh.price) for gh in queryset]
        print(f"Final results: {final_results}")
        print(f"Final queryset count: {queryset.count()}")
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        guest_house = serializer.save()
        equipment_ids = self.request.data.get('equipments', [])
        for equipment_id in equipment_ids:
            try:
                equipment = Equipment.objects.get(id=equipment_id)
                guest_house.equipments.add(equipment)
            except Equipment.DoesNotExist:
                pass

    def perform_update(self, serializer):
        guest_house = serializer.save()
        equipment_ids = self.request.data.get('equipments', [])
        guest_house.equipments.clear()
        for equipment_id in equipment_ids:
            try:
                equipment = Equipment.objects.get(id=equipment_id)
                guest_house.equipments.add(equipment)
            except Equipment.DoesNotExist:
                pass

class DestinationViewSet(viewsets.ModelViewSet):
    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        queryset = Destination.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
            )
        return queryset

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsReviewOwnerOrAdmin]

    def get_queryset(self):
        queryset = Review.objects.all()
        entity_type = self.request.query_params.get('entity_type', None)
        entity_id = self.request.query_params.get('entity_id', None)

        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)

        return queryset

    def create(self, request, *args, **kwargs):
        logger.info(f"Incoming review creation data: {request.data}")
        try:
            return super().create(request, *args, **kwargs)
        except serializers.ValidationError as e:
            logger.error(f"Validation error creating review: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error creating review: {str(e)}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred while creating the review."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        logger.info(f"Incoming review update data for review {kwargs.get('pk')}: {request.data}")
        try:
            return super().update(request, *args, **kwargs)
        except serializers.ValidationError as e:
            logger.error(f"Validation error updating review: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error updating review: {str(e)}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred while updating the review."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        user = self.request.user
        today = timezone.now().date()

        logger.info(f"Checking block status for {user.username}: {user.blockstartdate} - {user.blockenddate}, Today: {today}")

        if user.blockstartdate and user.blockenddate:
            if user.blockstartdate.date() <= today <= user.blockenddate.date():
                logger.warning(f"User {user.username} is blocked from posting reviews!")
                raise serializers.ValidationError(
                    f"You are blocked from posting reviews until {user.blockenddate.date()}."
                )

        serializer.save(user=user)

    def perform_update(self, serializer):
        user = self.request.user
        today = timezone.now().date()

        logger.info(f"Checking block status for {user.username} on update: {user.blockstartdate} - {user.blockenddate}, Today: {today}")

        if user.blockstartdate and user.blockenddate:
            if user.blockstartdate.date() <= today <= user.blockenddate.date():
                logger.warning(f"User {user.username} is blocked from updating reviews!")
                raise serializers.ValidationError(
                    f"You are blocked from updating reviews until {user.blockenddate.date()}."
                )

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        today = timezone.now().date()

        logger.info(f"Checking block status for {user.username} on delete: {user.blockstartdate} - {user.blockenddate}, Today: {today}")

        if user.blockstartdate and user.blockenddate:
            if user.blockstartdate.date() <= today <= user.blockenddate.date():
                logger.warning(f"User {user.username} is blocked from deleting reviews!")
                raise serializers.ValidationError(
                    f"You are blocked from deleting reviews until {user.blockenddate.date()}."
                )

        instance.delete()

class FavoriteViewSet(ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def add_to_favorite(self, request):
        entity_type = request.data.get('entity_type')
        entity_id = request.data.get('entity_id')

        if Favorite.objects.filter(user=request.user, entity_type=entity_type, entity_id=entity_id).exists():
            return Response({'error': 'This item is already in your favorites.'}, status=400)

        Favorite.objects.create(user=request.user, entity_type=entity_type, entity_id=entity_id)
        return Response({'message': 'Item added to favorites successfully!'}, status=201)

    @action(detail=False, methods=['post'])
    def remove_from_favorite(self, request):
        entity_type = request.data.get('entity_type')
        entity_id = request.data.get('entity_id')

        try:
            favorite = Favorite.objects.get(user=request.user, entity_type=entity_type, entity_id=entity_id)
            favorite.delete()
            return Response({'message': 'Item removed from favorites successfully!'}, status=200)
        except Favorite.DoesNotExist:
            return Response({'error': 'This item is not in your favorites.'}, status=404)

class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            service = RecommendationService(user_id=request.user.id)
            recommendations = service.recommend_all(top_n_per_type=3)

            serialized_data = {
                'circuit': CircuitCreateSerializer(
                    [Circuit.objects.get(id=item['id']) for item in recommendations.get('circuit', [])],
                    many=True
                ).data,
                'hotel': HotelSerializer(
                    [Hotel.objects.get(id=item['id']) for item in recommendations.get('hotel', [])],
                    many=True
                ).data,
                'guest_house': GuestHouseSerializer(
                    [GuestHouse.objects.get(id=item['id']) for item in recommendations.get('guest_house', [])],
                    many=True
                ).data,
                'restaurant': RestaurantSerializer(
                    [Restaurant.objects.get(id=item['id']) for item in recommendations.get('restaurant', [])],
                    many=True
                ).data,
                'activity': ActivitySerializer(
                    [Activity.objects.get(id=item['id']) for item in recommendations.get('activity', [])],
                    many=True
                ).data,
                'museum': MuseumSerializer(
                    [Museum.objects.get(id=item['id']) for item in recommendations.get('museum', [])],
                    many=True
                ).data,
                'festival': FestivalSerializer(
                    [Festival.objects.get(id=item['id']) for item in recommendations.get('festival', [])],
                    many=True
                ).data,
                'archaeological_site': ArchaeologicalSiteSerializer(
                    [ArchaeologicalSite.objects.get(id=item['id']) for item in recommendations.get('archaeological_site', [])],
                    many=True
                ).data,
            }

            return Response({
                'status': 'success',
                'recommendations': serialized_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)