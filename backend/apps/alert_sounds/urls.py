from django.urls import path
from .views import AlertSoundConfigView, UploadAlertSoundView, ListAlertSoundsView, DeleteAlertSoundView

urlpatterns = [
    path('alert-sounds/config/', AlertSoundConfigView.as_view(), name='alert-sound-config'),
    path('alert-sounds/upload/', UploadAlertSoundView.as_view(), name='alert-sound-upload'),
    path('alert-sounds/', ListAlertSoundsView.as_view(), name='alert-sound-list'),
    path('alert-sounds/<int:sound_id>/', DeleteAlertSoundView.as_view(), name='alert-sound-delete'),
]