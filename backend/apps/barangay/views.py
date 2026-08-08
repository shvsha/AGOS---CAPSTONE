from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Barangay
from .serializers import BarangaySerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENROOrBarangay
from apps.hotspots.models import Hotspot
from apps.audit_logs.utils import log_action


class BarangayListView(generics.ListCreateAPIView):
    serializer_class = BarangaySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENROOrBarangay()]
        return [IsAdmin()]

    def get_queryset(self):
        return Barangay.objects.filter(is_registered=True).exclude(barangay_name='Admin')

    def create(self, request, *args, **kwargs):
        barangay_name = request.data.get('barangay_name')
        latitude      = request.data.get('latitude')
        longitude     = request.data.get('longitude')

        try:
            barangay = Barangay.objects.get(barangay_name=barangay_name)
            barangay.latitude      = latitude
            barangay.longitude     = longitude
            barangay.is_registered = True
            barangay.status        = 'Active'
            barangay.save()
            log_action(
                user=request.user,
                action='Registered Barangay',
                affected_table='tbl_barangay',
                new_value=f"barangay: {barangay.barangay_name}",
                ip_address=request.META.get('REMOTE_ADDR')
            )
            serializer = self.get_serializer(barangay)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Barangay.DoesNotExist:
            return Response(
                {'barangay_name': 'Barangay not found in the system.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class BarangayDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Barangay.objects.all()
    serializer_class = BarangaySerializer
    lookup_field = 'barangay_id'
    permission_classes = [IsAdmin]


class BarangayAllView(generics.ListAPIView):
    serializer_class = BarangaySerializer
    permission_classes = [IsAdminOrMENROOrBarangay]
    pagination_class = None

    def get_queryset(self):
        return Barangay.objects.exclude(barangay_name='Admin').order_by('barangay_name')
    
    
class BarangayUnregisterView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, barangay_id):
        try:
            barangay = Barangay.objects.get(barangay_id=barangay_id)
        except Barangay.DoesNotExist:
            return Response({'detail': 'Barangay not found.'}, status=404)

        from apps.sensor_nodes.models import SensorNode
        from apps.users.models import User

        active_nodes = SensorNode.objects.filter(
            barangay=barangay
        ).exclude(status='Inactive').count()

        active_hotspots = Hotspot.objects.filter(
            barangay=barangay,                      
            is_active=True                            
        ).count()

        barangay_users = User.objects.filter(
            barangay=barangay,
            user_role='Barangay',
            status='Active'
        ).count()

        issues = []
        if active_nodes > 0:
            issues.append(f"{active_nodes} active sensor node(s)")
        if active_hotspots > 0:
            issues.append(f"{active_hotspots} active canal hotspot(s)")
        if barangay_users > 0:
            issues.append(f"{barangay_users} active barangay user(s)")

        if issues:
            return Response({
                'detail': f"Cannot unregister {barangay.barangay_name}. It still has {' and '.join(issues)}. Please decommission them first."
            }, status=status.HTTP_400_BAD_REQUEST)

        barangay.is_registered = False
        barangay.save()
        log_action(
            user=request.user,
            action='Unregistered Barangay',
            affected_table='tbl_barangay',
            old_value=f"barangay: {barangay.barangay_name}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'detail': f'{barangay.barangay_name} has been unregistered.'})
    

class BarangayCheckView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, barangay_id):
        try:
            barangay = Barangay.objects.get(barangay_id=barangay_id)
        except Barangay.DoesNotExist:
            return Response({'detail': 'Barangay not found.'}, status=404)

        from apps.sensor_nodes.models import SensorNode
        from apps.users.models import User

        active_nodes = SensorNode.objects.filter(
            barangay=barangay
        ).exclude(status='Inactive').count()

        active_hotspots = Hotspot.objects.filter(
            barangay=barangay,
            is_active=True 
        ).count()     

        barangay_users = User.objects.filter(
            barangay=barangay,
            user_role='Barangay',
            status='Active'
        ).count()

        issues = []
        if active_nodes > 0:
            issues.append(f"{active_nodes} active sensor node(s)")
        if active_hotspots > 0:
            issues.append(f"{active_hotspots} active canal hotspot(s)")
        if barangay_users > 0:
            issues.append(f"{barangay_users} active barangay user(s)")

        if issues:
            return Response({
                'can_unregister': False,
                'detail': f"Cannot unregister {barangay.barangay_name}. Please decommission them first.",
                'issues': issues
            })

        return Response({'can_unregister': True})


class BarangayRegisterView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, barangay_id):
        try:
            barangay = Barangay.objects.get(barangay_id=barangay_id)
        except Barangay.DoesNotExist:
            return Response({'detail': 'Barangay not found.'}, status=404)

        if barangay.is_registered:
            return Response({'detail': 'Barangay is already registered.'}, status=400)

        barangay.is_registered = True
        barangay.status = 'Active'
        barangay.save()
        log_action(
            user=request.user,
            action='Registered Barangay',
            affected_table='tbl_barangay',
            new_value=f"barangay: {barangay.barangay_name}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'detail': f'{barangay.barangay_name} has been registered.'})