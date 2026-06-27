from django.db import models
from apps.barangay.models import Barangay


class Hotspot(models.Model):
    hotspot_id = models.AutoField(primary_key=True)
    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.CASCADE,
        db_column='barangay_id'
    )
    name = models.CharField(max_length=150)
    description = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    canal_width = models.FloatField(
    null=True, blank=True,
    help_text="Width of canal in meters at this location."
    )
    canal_shape = models.CharField(
        max_length=20,
        choices=[('rectangular', 'Rectangular'), ('trapezoidal', 'Trapezoidal')],
        default='rectangular',
        help_text="Cross-sectional shape of the canal at this location."
    )
    sensor_height = models.FloatField(
        null=True, blank=True,
        help_text="Fixed distance in cm from sensor/camera mount to canal floor. Measured once at installation."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_hotspots'
        unique_together = ('barangay', 'name')

    def __str__(self):
        return f"{self.name} - {self.barangay.barangay_name}"

    @property
    def is_occupied(self):
        return (
            hasattr(self, 'sensornode')
            and self.sensornode.availability_status == 'Occupied'
        )