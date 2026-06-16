from django.db import models
from apps.barangay.models import Barangay
from django.utils import timezone

class SensorNode(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Maintenance', 'Maintenance'),
        ('Decommissioned', 'Decommissioned')
    ]

    node_id = models.AutoField(primary_key=True)
    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.CASCADE,
        db_column='barangay_id'
    )
    node_name = models.CharField(max_length=100, blank=True, default='')
    latitude = models.FloatField()
    longitude = models.FloatField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Active')
    installed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tbl_sensor_nodes'

    def __str__(self):
        label = self.node_name or f"Node {self.node_id}"
        return f"{label} - {self.barangay.barangay_name}"


class SystemHealthLog(models.Model):
    STATUS_CHOICES = [
        ('Normal', 'Normal'),
        ('Warning', 'Warning'),
        ('Critical', 'Critical'),
    ]

    health_id = models.AutoField(primary_key=True)
    node = models.ForeignKey(
        SensorNode,
        on_delete=models.CASCADE,
        db_column='node_id'
    )
    battery_voltage = models.FloatField()
    signal_strength = models.FloatField()
    sensor_continuity = models.BooleanField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Normal')
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_system_health_logs'

    def __str__(self):
        return f"Health {self.health_id} - Node {self.node.node_id} - {self.status}"