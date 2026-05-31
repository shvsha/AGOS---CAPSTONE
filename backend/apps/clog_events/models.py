from django.db import models
from apps.sensor_nodes.models import SensorNode
from apps.barangay.models import Barangay
from apps.waste_classification.models import WasteClassification

class ClogEvent(models.Model):
    SEVERITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    STATUS_CHOICES = [
        ('Detected', 'Detected'),
        ('Responded', 'Responded'),
        ('Cleared', 'Cleared'),
        ('Verified', 'Verified'),
    ]

    event_id = models.AutoField(primary_key=True)
    node = models.ForeignKey(
        SensorNode,
        on_delete=models.CASCADE,
        db_column='node_id'
    )
    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.CASCADE,
        db_column='barangay_id'
    )
    classification = models.OneToOneField(
        WasteClassification,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='classification_id'
    )
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Detected')
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tbl_clog_events'

    def __str__(self):
        return f"Clog {self.event_id} - {self.barangay.barangay_name} - {self.severity}"