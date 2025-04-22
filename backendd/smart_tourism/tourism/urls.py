from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestaurantViewSet, HotelViewSet, ActivityViewSet,ArchaeologicalSiteViewSet,DestinationViewSet,MuseumViewSet,FestivalViewSet,GuestHouseViewSet,ReviewViewSet,FavoriteViewSet, CuisineViewSet, RecommendationView, ActivityCategoryViewSet

# Create a router and register the endpoints
router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'hotels', HotelViewSet, basename='hotel')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'archaeological_sites', ArchaeologicalSiteViewSet, basename='archaeological_site')
router.register(r'destinations', DestinationViewSet, basename='destination')
router.register(r'festivals', FestivalViewSet, basename='festival')
router.register(r'museums', MuseumViewSet, basename='museum')
router.register(r'guest_houses', GuestHouseViewSet, basename='guest_house')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'cuisines', CuisineViewSet, basename='cuisine')
router.register(r'activity-categories', ActivityCategoryViewSet, basename='activity-category')




# Define URL patterns for tourism app
urlpatterns = [
    path('', include(router.urls)),  # Include all router URLs
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),
]
