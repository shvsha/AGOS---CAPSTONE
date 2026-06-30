from rest_framework.permissions import BasePermission
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.user_role == 'Admin'
            and request.user.status == 'Active'
        )


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
    
# for iot
class IoTDeviceAuthentication(BaseAuthentication):
    """
    Custom authentication for IoT devices using API key.
    Bypasses JWT authentication entirely for IoT requests.
    """
    def authenticate(self, request):
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return None
        
        if api_key != settings.IOT_API_KEY:
            raise AuthenticationFailed('Invalid API key')
        
        # Return None as user since IoT device has no user account
        # but mark as authenticated via a dummy object
        return (IoTUser(), None)


class IoTUser:
    """Dummy user object for IoT device authentication"""
    is_authenticated = True
    user_role = 'IoT'
    
    def __str__(self):
        return 'IoT Device'


class IsIoTDevice(BasePermission):
    def has_permission(self, request, view):
        return (
            hasattr(request, 'user') and 
            isinstance(request.user, IoTUser)
        )