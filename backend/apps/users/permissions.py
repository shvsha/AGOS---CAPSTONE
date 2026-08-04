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
        return request.user.is_authenticated and request.user.user_role in ['Admin', 'MENRO', 'MENRO_Staff']


class IsAdminOrMENROOrBarangay(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role in ['Admin', 'MENRO', 'MENRO_Staff', 'Barangay']
    
class IsAdminOrMENROOfficer(BasePermission):
    """Officer only — excludes MENRO Staff. Used for barangay/municipal reports."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role in ['Admin', 'MENRO']
    
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


class CanAccessOwnBarangayReport(BasePermission):
    """
    Used for BarangayMonthlyReportDetailView.
    Admin/MENRO: full access to any report.
    Barangay: GET/PATCH only on their own barangay's report;
    PATCH is only allowed while status is still 'Draft' (locked once
    submitted); PUT and DELETE are blocked entirely for this role.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.user_role in ['Admin', 'MENRO', 'MENRO_Staff']:
            return True
        if user.user_role == 'Barangay':
            return request.method in ['GET', 'PATCH']
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.user_role in ['Admin', 'MENRO', 'MENRO_Staff']:
            return True
        if user.user_role == 'Barangay':
            if obj.barangay_id != user.barangay_id:
                return False
            if request.method == 'PATCH':
                return obj.status == 'Draft'
            return True 
        return False


class CanAccessOwnBarangayReportMedia(BasePermission):
    """
    Used for ReportMediaDetailView (delete-only, for now).
    Admin/MENRO: full access.
    Barangay: DELETE only on media attached to their own barangay's
    report, and only while that report is still 'Draft'.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.user_role in ['Admin', 'MENRO', 'MENRO_Staff']:
            return True
        if user.user_role == 'Barangay':
            return request.method in ['GET', 'DELETE']
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.user_role in ['Admin', 'MENRO', 'MENRO_Staff']:
            return True
        if user.user_role == 'Barangay':
            report = obj.monthly_report
            if not report or report.barangay_id != user.barangay_id:
                return False
            if request.method == 'DELETE':
                return report.status == 'Draft'
            return True
        return False