from django.urls import path, include
from . import views  # Import the views you defined
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from .views import TrackClickView, SaveSearchView, PreferenceViewSet


# Create a router and register our viewset with it
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'preferences', PreferenceViewSet, basename='preference')

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('profile/', views.view_profile, name='view_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),  # Update profile
    path('profile/change-password/', views.change_password, name='change_password'),  # Change password
    path('logout/', views.logout, name='logout'),
    # path('users/', include(router.urls)),
    path("users/<int:pk>/block/", UserViewSet.as_view({"post": "block_user"})),
    path('track-click/', TrackClickView.as_view(), name='track-click'),
    path('save-search/', SaveSearchView.as_view(), name='save-search'),
    path('', include(router.urls)),
]
