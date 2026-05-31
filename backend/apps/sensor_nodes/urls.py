from django.urls import path
from .views import ( SensorNodeListView, SensorNodeDetailView, SensorNodeByBarangayView, SystemHealthLogListView, SystemHealthLogByNodeView )

urlpatterns = [
    path('sensor-nodes/', SensorNodeListView.as_view(), name='sensor-node-list'),
    path('sensor-nodes/<int:node_id>/', SensorNodeDetailView.as_view(), name='sensor-node-detail'),
    path('sensor-nodes/barangay/<int:barangay_id>/', SensorNodeByBarangayView.as_view(), name='sensor-node-by-barangay'),
    path('system-health/', SystemHealthLogListView.as_view(), name='system-health-list'),
    path('system-health/node/<int:node_id>/', SystemHealthLogByNodeView.as_view(), name='system-health-by-node'),
]