from rest_framework.permissions import BasePermission
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.hashers import check_password
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
    Per-device authentication for IoT nodes. Expects a header like:
        X-API-Key: {node_id}.{secret}

    The node_id prefix isn't secret — it just lets us look up the
    exact SensorNode in one query. The part after the dot is checked
    against that node's stored hash. On success, the authenticated
    SensorNode is attached as request.auth, so views can trust
    request.auth.node_id instead of anything the client claims in the
    request body.
    """
    def authenticate(self, request):
        from apps.sensor_nodes.models import SensorNode

        api_key = request.headers.get('X-API-Key')

        if not api_key:
            return None

        if '.' not in api_key:
            raise AuthenticationFailed('Invalid API key')

        node_id_str, secret = api_key.split('.', 1)
        if not node_id_str.isdigit():
            raise AuthenticationFailed('Invalid API key')

        try:
            node = SensorNode.objects.get(node_id=int(node_id_str))
        except SensorNode.DoesNotExist:
            raise AuthenticationFailed('Invalid API key')

        if not node.device_key_hash or not check_password(secret, node.device_key_hash):
            raise AuthenticationFailed('Invalid API key')

        if node.status != 'Active':
            raise AuthenticationFailed('Device is not active')

        return (IoTUser(node), node)


class IoTUser:
    """Represents an authenticated IoT device, tied to a specific SensorNode."""
    is_authenticated = True
    user_role = 'IoT'

    def __init__(self, node):
        self.node = node

    @property
    def pk(self):
        return self.node.node_id

    def __str__(self):
        return f'IoT Device (node {self.node.node_id})'


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