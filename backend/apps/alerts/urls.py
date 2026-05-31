from django.urls import path
from .views import AlertListView, AllAlertsView

urlpatterns = [
    path('alerts/', AlertListView.as_view(), name='alert-list'),
    path('alerts/all/', AllAlertsView.as_view(), name='all-alerts'),
]