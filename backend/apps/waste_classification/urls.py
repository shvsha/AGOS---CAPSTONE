from django.urls import path
from .views import WasteClassificationListView, WasteClassificationDetailView

urlpatterns = [
    path('waste-classifications/', WasteClassificationListView.as_view(), name='waste-classification-list'),
    path('waste-classifications/<int:classification_id>/', WasteClassificationDetailView.as_view(), name='waste-classification-detail'),
]