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
    description = models.TextField(blank=True, default='')
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_hotspots'
        unique_together = ('barangay', 'name')

    def __str__(self):
        return f"{self.name} - {self.barangay.barangay_name}"

    @property
    def is_occupied(self):
        return hasattr(self, 'sensornode') and self.sensornode.status != 'Decommissioned'
