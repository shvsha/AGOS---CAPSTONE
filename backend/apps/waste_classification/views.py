from django.shortcuts import render
from rest_framework import generics
from .models import WasteClassification
from .serializers import WasteClassificationSerializer

class WasteClassificationListView(generics.ListCreateAPIView):
    queryset = WasteClassification.objects.all().order_by('-timestamp')
    serializer_class = WasteClassificationSerializer

class WasteClassificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WasteClassification.objects.all()
    serializer_class = WasteClassificationSerializer
    lookup_field = 'classification_id'
