from django.urls import path
from .views import ( ClogEventListView, ClogEventDetailView, ClogEventByBarangayView, UpdateClogStatusView )

urlpatterns = [
    path('clog-events/', ClogEventListView.as_view(), name='clog-event-list'),
    path('clog-events/<int:event_id>/', ClogEventDetailView.as_view(), name='clog-event-detail'),
    path('clog-events/barangay/<int:barangay_id>/', ClogEventByBarangayView.as_view(), name='clog-event-by-barangay'),
    path('clog-events/<int:event_id>/status/', UpdateClogStatusView.as_view(), name='clog-event-status'),
]