from django.db import models
from apps.barangay.models import Barangay
from apps.hotspots.models import Hotspot
from django.utils import timezone
from django.conf import settings


class SensorNode(models.Model):
    AVAILABILITY_STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Occupied', 'Occupied'),
        ('Retired', 'Retired'),
    ]

    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Maintenance', 'Maintenance'),
    ]

    node_id = models.AutoField(primary_key=True)
    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='barangay_id'
    )
    hotspot = models.OneToOneField(
        Hotspot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='hotspot_id'
    )
    node_name = models.CharField(max_length=100, blank=True, default='')
    availability_status = models.CharField(
        max_length=15,
        choices=AVAILABILITY_STATUS_CHOICES,
        default='Available'
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Active')
    installed_at = models.DateTimeField(default=timezone.now)
    device_key_hash = models.CharField(max_length=255, null=True, blank=True)

    device_model = models.CharField(
        max_length=150,
        default="ESP32-S3 + SIM7600 (4G) + HC-SR04 + OV2640 Camera",
        blank=True,
    )

    class Meta:
        db_table = 'tbl_sensor_nodes'

    def __str__(self):
        label = self.node_name or f"Node {self.node_id}"
        barangay_name = self.barangay.barangay_name if self.barangay else "Unassigned"
        return f"{label} - {barangay_name}"

    @property
    def latitude(self):
        return self.hotspot.latitude if self.hotspot else None

    @property
    def longitude(self):
        return self.hotspot.longitude if self.hotspot else None


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
    firmware_version = models.CharField(max_length=20, null=True, blank=True)
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_system_health_logs'

    def __str__(self):
        return f"Health {self.health_id} - Node {self.node.node_id} - {self.status}"


class MaintenanceLog(models.Model):
    maintenance_id = models.AutoField(primary_key=True)
    node = models.ForeignKey(
        SensorNode,
        on_delete=models.CASCADE,
        db_column='node_id'
    )
    reason = models.TextField()
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        db_column='marked_by'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tbl_maintenance_logs'

    def __str__(self):
        state = "Ongoing" if self.resolved_at is None else "Resolved"
        return f"Maintenance {self.maintenance_id} - Node {self.node.node_id} - {state}"