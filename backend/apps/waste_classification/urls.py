from django.urls import path
from .views import WasteClassificationListView, WasteClassificationDetailView, ClassifyWasteView

urlpatterns = [
    path('waste-classifications/', WasteClassificationListView.as_view(), name='waste-classification-list'),
    path('waste-classifications/<int:classification_id>/', WasteClassificationDetailView.as_view(), name='waste-classification-detail'),
    path('waste-classifications/classify/', ClassifyWasteView.as_view()),
]