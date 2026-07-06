from django.urls import path
from .views import ( SensorNodeListView, SensorNodeDetailView, SensorNodeByBarangayView, SystemHealthLogListView, SystemHealthLogByNodeView, SensorNodeUnassignView, SensorNodeRetireView, SensorNodeConfigView )

urlpatterns = [
    path('sensor-nodes/', SensorNodeListView.as_view(), name='sensor-node-list'),
    path('sensor-nodes/<int:node_id>/', SensorNodeDetailView.as_view(), name='sensor-node-detail'),
    path('sensor-nodes/<int:node_id>/config/', SensorNodeConfigView.as_view(), name='sensor-node-config'),
    path('sensor-nodes/barangay/<int:barangay_id>/', SensorNodeByBarangayView.as_view(), name='sensor-node-by-barangay'),
    path('sensor-nodes/<int:node_id>/unassign/', SensorNodeUnassignView.as_view(), name='sensor-node-unassign'),
    path('sensor-nodes/<int:node_id>/retire/', SensorNodeRetireView.as_view(), name='sensor-node-retire'),
    path('system-health/', SystemHealthLogListView.as_view(), name='system-health-list'),
    path('system-health/node/<int:node_id>/', SystemHealthLogByNodeView.as_view(), name='system-health-by-node'),
]