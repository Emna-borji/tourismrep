from rest_framework.routers import DefaultRouter
from .views import CircuitViewSet, CircuitHistoryViewSet
from django.urls import path, include
from itinerary.views import FilteredEntitiesView, CircuitTemplatesView, ComposeCircuitView, DestinationListView, SuggestedPlacesView, GuideViewSet, AdminCircuitView, CircuitCheckView

router = DefaultRouter()
router.register(r'circuits', CircuitViewSet, basename='circuit')
router.register(r'circuit_history', CircuitHistoryViewSet, basename='circuit_history')
router.register(r'guides', GuideViewSet, basename='guide')


urlpatterns = [
    path('suggested-places/', SuggestedPlacesView.as_view(), name='suggested-places'),
    path('filtered-entities/', FilteredEntitiesView.as_view(), name='filtered-entities'),
    path('compose/', ComposeCircuitView.as_view(), name='compose-circuit'),
    path('destinations/', DestinationListView.as_view(), name='destination-list'),
    path('admin/circuits/', AdminCircuitView.as_view(), name='admin-create-circuit'),
    path('check/', CircuitCheckView.as_view(), name='circuit-check'),
    path('', include(router.urls)),
]

