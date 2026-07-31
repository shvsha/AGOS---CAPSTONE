from django.urls import path
from .views import WasteClassificationListView, WasteClassificationDetailView, ClassifyWasteView, WasteClassificationExportView

urlpatterns = [
    path('waste-classifications/', WasteClassificationListView.as_view(), name='waste-classification-list'),
    path('waste-classifications/<int:classification_id>/', WasteClassificationDetailView.as_view(), name='waste-classification-detail'),
    path('waste-classifications/classify/', ClassifyWasteView.as_view()),
    path('waste-classifications/export/', WasteClassificationExportView.as_view(), name='waste-classification-export'),
]