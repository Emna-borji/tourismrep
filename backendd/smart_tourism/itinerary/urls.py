from rest_framework.routers import DefaultRouter
from .views import CircuitViewSet, CircuitHistoryViewSet
from django.urls import path, include
from itinerary.views import FilteredEntitiesView, CircuitTemplatesView, ComposeCircuitView, DestinationListView, SuggestedPlacesView

router = DefaultRouter()
router.register(r'circuits', CircuitViewSet, basename='circuit')
router.register(r'circuit_history', CircuitHistoryViewSet, basename='circuit_history')

urlpatterns = [
    path('suggested-places/', SuggestedPlacesView.as_view(), name='suggested-places'),
    path('filtered-entities/', FilteredEntitiesView.as_view(), name='filtered-entities'),
    path('compose/', ComposeCircuitView.as_view(), name='compose-circuit'),
    path('destinations/', DestinationListView.as_view(), name='destination-list'),
    path('', include(router.urls)),
]



# urlpatterns = [
#     path('register/', views.register, name='register'),
#     path('login/', views.login, name='login'),
#     path('profile/', views.view_profile, name='view_profile'),
#     path('profile/update/', views.update_profile, name='update_profile'),  # Update profile
#     path('profile/change-password/', views.change_password, name='change_password'),  # Change password
#     path('logout/', views.logout, name='logout'),
#     # path('users/', include(router.urls)),
#     path("users/<int:pk>/block/", UserViewSet.as_view({"post": "block_user"})),
#     path('track-click/', TrackClickView.as_view(), name='track-click'),
#     path('save-search/', SaveSearchView.as_view(), name='save-search'),
#     path('', include(router.urls)),
# ]