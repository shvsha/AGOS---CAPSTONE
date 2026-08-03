from django.urls import path
from .views import MyBarangayRainfallConditionView

urlpatterns = [
    path('rainfall-condition/', MyBarangayRainfallConditionView.as_view(), name='rainfall-condition'),
]