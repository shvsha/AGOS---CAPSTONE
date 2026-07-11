from django.urls import path
from .views import TrainingCaptureUploadView

urlpatterns = [
    path('training-captures/', TrainingCaptureUploadView.as_view()),
]