from django.urls import path
from .views import SensorReadingListView, SensorReadingByNodeView, SensorReadingWithFlowView

urlpatterns = [
    path('sensor-readings/', SensorReadingListView.as_view(), name='sensor-reading-list'),
    path('sensor-readings/node/<int:node_id>/', SensorReadingByNodeView.as_view(), name='sensor-reading-by-node'),
    path('sensor-readings/with-flow/', SensorReadingWithFlowView.as_view(), name='sensor-reading-with-flow'),
]