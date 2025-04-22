# users/permissions.py

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """
    Custom permission to allow only admin users to perform certain actions.
    Admins can create, update, and delete hotels, but they can't delete their own profile.
    """

    def has_permission(self, request, view):
        # Allow access only if the user is authenticated and is an admin
        return request.user and request.user.role == 'admin'

    def has_object_permission(self, request, view, obj):
        # Allow access for admins on any object
        if view.action in ['create', 'update', 'destroy']:  # Admin can perform these actions
            return request.user and request.user.role == 'admin'

        # Admin cannot delete their own profile
        if view.action == 'destroy':
            return obj != request.user
        
        return False

# class IsAdmin(BasePermission):
#     """
#     Custom permission to allow only admin users to perform certain actions.
#     Admins can create, update, and delete hotels, but they can't delete their own profile.
#     Users can create, update, and delete their own reviews.
#     Also, users can create their own preferences, but only admins can delete them.
#     """

#     def has_permission(self, request, view):
#         # Allow access only if the user is authenticated and is an admin
#         if request.user and request.user.role == 'admin':
#             return True
        
#         # Users can create preferences (POST request)
#         if request.method == 'POST':  # Only users can create preferences
#             return request.user and request.user.is_authenticated

#         return False

#     def has_object_permission(self, request, view, obj):
#         # Allow access for admins on any object (preferences, hotels, etc.)
#         if request.user and request.user.role == 'admin':
#             return True

#         # Prevent admins from deleting their own profile (if the object is a user object)
#         if view.action == 'destroy' and isinstance(obj, User) and obj == request.user:
#             return False

#         # Allow users to update or delete their own reviews or preferences
#         if isinstance(obj, Preference) and obj.user == request.user:
#             if request.method == 'DELETE':
#                 return True  # Users can delete their own preferences
#             return request.method in SAFE_METHODS  # Allow users to view and update their own preferences

#         return False
    

class IsReviewOwnerOrAdmin(BasePermission):
    """
    - Users and admins can create, update, and delete their own reviews.
    - Admins can delete other users' reviews, but not another admin's reviews.
    - Everyone can view reviews.
    """

    def has_permission(self, request, view):
        # Allow everyone to view reviews (GET, HEAD, OPTIONS)
        if request.method in SAFE_METHODS:
            return True
        
        # Only authenticated users can create, update, or delete reviews
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Everyone can view reviews
        if request.method in SAFE_METHODS:
            return True

        # Users and admins can update or delete their own reviews
        if obj.user == request.user:
            return True

        # Admins can delete another user's review, but not another admin's review
        if request.method == 'DELETE' and request.user.role == 'admin' and obj.user.role != 'admin':
            return True

        return False
    



# class IsOwnerOrAdmin(BasePermission):
#     """
#     - Admins can view, update, and delete any preference.
#     - Users can only view and modify their own preferences.
#     """

#     def has_object_permission(self, request, view, obj):
#         if request.method in SAFE_METHODS:
#             return request.user == obj.user or request.user.role == 'admin'
#         return request.user == obj.user or request.user.role == 'admin'
    


class IsAdminOrCreateOnly(BasePermission):
    """
    Allow anyone authenticated to create.
    Only admin can view, update or delete.
    """

    def has_permission(self, request, view):
        # Allow anyone authenticated to POST (create)
        if request.method == 'POST':
            return request.user and request.user.is_authenticated
        
        # All other methods: only admin users
        return request.user and request.user.role=="admin"
    


class CircuitPermission(BasePermission):
    """
    - Anyone (even unauthenticated) can view circuits (GET, HEAD, OPTIONS)
    - Only authenticated users can create circuits (POST)
    - Only admin users can update or delete any circuit (PUT, PATCH, DELETE)
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True  # Anyone can view circuits

        if request.method == 'POST':
            return request.user and request.user.is_authenticated  # Authenticated can create

        # For PUT/PATCH/DELETE: admin only
        return request.user and request.user.role == 'admin'

    def has_object_permission(self, request, view, obj):
        # Reuse same logic for object-level permissions
        return self.has_permission(request, view)