from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role == 'Admin'

class IsMENRO(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role == 'MENRO'

class IsBarangay(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role == 'Barangay'

class IsAdminOrMENRO(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role in ['Admin', 'MENRO']

class IsAdminOrMENROOrBarangay(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role in ['Admin', 'MENRO', 'Barangay']