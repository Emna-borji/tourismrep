from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from .models import CustomUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from .serializers import LoginSerializer
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from .serializers import UpdateProfileSerializer
from .serializers import ChangePasswordSerializer
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from users.models import ClickHistory,SearchHistory
from tourism.models import Restaurant
from datetime import datetime
from django.shortcuts import redirect
from django.db.models import Q
from .serializers import SearchHistoryInputSerializer
from rest_framework.permissions import IsAuthenticated

from rest_framework import viewsets, permissions
from .models import Preference
from .serializers import PreferenceSerializer
from .permissions import IsAdminOrCreateOnly  # your custom permission
from rest_framework.exceptions import PermissionDenied, NotFound







from .serializers import CustomUserSerializer
from rest_framework.permissions import BasePermission
from .permissions import IsAdmin  # Import the custom permission

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]  # Apply custom IsAdmin permission

    def create(self, request, *args, **kwargs):
        # Prevent admins from creating users
        return Response({'error': 'Admins cannot create users.'}, status=status.HTTP_403_FORBIDDEN)

    def update(self, request, *args, **kwargs):
        # Prevent admins from updating users
        return Response({'error': 'Admins cannot update users.'}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        # Ensure admins can only delete other users, not themselves
        if request.user.id == kwargs['pk']:
            return Response({'error': 'Admins cannot delete their own profile.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def block_user(self, request, pk=None):
        
        """Admin can block a user with start and end dates."""

        print("Received pk:", pk)  # Debugging line
        print(request.user)  # Debugging line
        print(request.user.role)
        user = CustomUser.objects.get(id=pk)  # Directly fetch the user
        print("Manually fetched user:", user)
        print(user)
        print(request.user.role)
        if request.user.role != "admin":
            return Response({"error": "Only admins can block users."}, status=status.HTTP_403_FORBIDDEN)
        

        if user.role == "admin":
            return Response({"error": "Admins cannot block other admins."}, status=status.HTTP_403_FORBIDDEN)

        start_date = request.data.get("blockstartdate")
        end_date = request.data.get("blockenddate")

        if start_date and end_date:
            # Block the user
            user.block_user(start_date, end_date)
            return Response(
                {"message": f"User {user.email} has been blocked from {start_date} to {end_date}."},
                status=status.HTTP_200_OK
            )
        else:
            # Unblock the user by setting the dates to None
            user.block_user(None, None)
            return Response({"message": f"User {user.email} has been unblocked."}, status=status.HTTP_200_OK)

        




@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    if request.method == 'POST':
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            # Save the user
            user = serializer.save()
            # Serialize the created user
            user_serializer = CustomUserSerializer(user)
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            return Response({
                "message": "User registered successfully!",
                "user": user_serializer.data,
                "access_token": access_token,
                "refresh_token": str(refresh)
            }, status=status.HTTP_201_CREATED)
        
        # If validation fails (including email exists), return errors
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"error": "Invalid method. Use POST."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)




@api_view(['POST'])
@permission_classes([AllowAny])  # Allow unauthenticated access to login
def login(request):
    # Your existing login logic
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']

        # Generate JWT tokens (access and refresh)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        user_data = CustomUserSerializer(user).data

        return Response({
            'access_token': access_token,
            'refresh_token': str(refresh),
            'user': user_data,
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=400)







@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Ensure that only authenticated users can view their profile
def view_profile(request):
    try:
        # Get the current user based on the request
        user = request.user

        # Serialize the user's data
        serializer = CustomUserSerializer(user)

        return Response(serializer.data, status=status.HTTP_200_OK)

    except CustomUser.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    


@api_view(['POST'])
def logout(request):
    # Since JWT is stateless, there is no need to "delete" or invalidate the token server-side.
    # You can choose to give a response that confirms the logout.
    
    response = Response({'message': 'Successfully logged out'})
    # You can also clear any session-related data or cookies if you're using them for the frontend.

    # If you're using cookies, you can also invalidate the JWT cookie like this:
    # response.delete_cookie('access_token')   # If JWT is stored in a cookie
    
    return response




class TrackClickView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        entity_type = request.data.get('entity_type')
        entity_id = request.data.get('entity_id')

        # Check if the user has recently clicked the same entity
        if ClickHistory.user_recently_clicked(user, entity_type, entity_id):
            return Response({"message": "Click already recorded recently."}, status=200)

        # Save the click if it's a new one
        ClickHistory.objects.create(user=user, entity_type=entity_type, entity_id=entity_id)
        return Response({"message": "Click recorded successfully!"}, status=201)
    



    

class SaveSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SearchHistoryInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        search_term = serializer.validated_data['q']
        entity_type = serializer.validated_data['entity_type']

        # Check for existing search history
        if SearchHistory.objects.filter(user=request.user, entity_type=entity_type, search_term=search_term).exists():
            return Response({'message': 'Search history already exists'}, status=status.HTTP_200_OK)

        # Create new search history
        SearchHistory.objects.create(
            user=request.user,
            entity_type=entity_type,
            search_term=search_term
        )

        # Fetch matching search results
        search_results = SearchHistory.objects.filter(
            Q(entity_type=entity_type) & Q(search_term__icontains=search_term)
        )

        return Response({
            'message': 'Search term saved successfully',
            'search_results': [
                {
                    'search_term': result.search_term,
                    'entity_type': result.entity_type,
                    'searched_at': result.searched_at.strftime('%Y-%m-%d %H:%M:%S')
                }
                for result in search_results
            ]
        }, status=status.HTTP_200_OK)




class PreferenceViewSet(viewsets.ModelViewSet):
    queryset = Preference.objects.all()
    serializer_class = PreferenceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrCreateOnly]
    lookup_field = 'user_id'
    lookup_url_kwarg = 'user_id'

    def get_queryset(self):
        # Only admin can list all, others can't see any
        if self.request.user.role == "admin":
            return Preference.objects.all()
        # Non-admins can only see their own preferences
        return Preference.objects.filter(user=self.request.user) if self.request.user.is_authenticated else Preference.objects.none()

    def retrieve(self, request, *args, **kwargs):
        user_id = self.kwargs.get('user_id')
        # Admins can retrieve any user's preference, non-admins can only retrieve their own
        if not request.user.role == "admin" and str(request.user.id) != str(user_id):
            raise PermissionDenied("You do not have permission to access this preference.")

        # Fetch the most recent preference for the given user_id
        try:
            preference = Preference.objects.filter(user_id=user_id).latest('id')
        except Preference.DoesNotExist:
            raise NotFound("No preference found for this user.")

        serializer = self.get_serializer(preference)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # Check if a preference already exists for the authenticated user
        existing_preference = Preference.objects.filter(user=request.user).first()

        if existing_preference:
            # If a preference exists, update it instead of creating a new one
            serializer = self.get_serializer(existing_preference, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        else:
            # If no preference exists, create a new one
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=201, headers=headers)
