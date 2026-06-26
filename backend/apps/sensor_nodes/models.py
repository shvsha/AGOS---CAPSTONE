from django.db import models
from apps.barangay.models import Barangay
from apps.hotspots.models import Hotspot
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
    hotspot = models.OneToOneField(
        Hotspot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='hotspot_id'
    )
    node_name = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Active')
    installed_at = models.DateTimeField(default=timezone.now)

    sensor_height = models.FloatField(
        null=True, blank=True,
        help_text="Fixed distance in cm from camera/sensor mount to canal floor. Measured once at installation."
    )
    canal_width = models.FloatField(
        null=True, blank=True,
        help_text="Width of canal in meters at this node's location. Measured once at installation."
    )
    canal_shape = models.CharField(
        max_length=20,
        choices=[('rectangular', 'Rectangular'), ('trapezoidal', 'Trapezoidal')],
        default='rectangular',
        help_text="Cross-sectional shape of the canal at this node's location."
    )

    class Meta:
        db_table = 'tbl_sensor_nodes'

    def __str__(self):
        label = self.node_name or f"Node {self.node_id}"
        return f"{label} - {self.barangay.barangay_name}"

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
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_system_health_logs'

    def __str__(self):
        return f"Health {self.health_id} - Node {self.node.node_id} - {self.status}"
