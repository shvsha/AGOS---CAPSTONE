from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Alert
from .serializers import AlertSerializer

class AlertListView(generics.ListCreateAPIView):
    serializer_class = AlertSerializer

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user).order_by('-timestamp')

class AlertByUserView(generics.ListAPIView):
    serializer_class = AlertSerializer

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user).order_by('-timestamp')

class AllAlertsView(generics.ListAPIView):
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer
