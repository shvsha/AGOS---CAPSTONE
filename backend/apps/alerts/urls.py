from django.urls import path
from .views import AlertListView, AlertMarkReadView, AlertUnreadCountView

urlpatterns = [
    path('alerts/', AlertListView.as_view(), name='alert-list'),
    path('alerts/<int:alert_id>/read/', AlertMarkReadView.as_view(), name='alert-mark-read'),
    path('alerts/unread-count/', AlertUnreadCountView.as_view(), name='alert-unread-count'),
]