from django.shortcuts import render
from rest_framework import generics
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer

class AuditLogByUserView(generics.ListAPIView):
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        return AuditLog.objects.filter(user__user_id=user_id).order_by('-timestamp')
