from django.db import models
from apps.sensor_nodes.models import SensorNode

class SensorReading(models.Model):
    STATUS_CHOICES = [
        ('Normal', 'Normal'),
        ('Abnormal', 'Abnormal'),
    ]

    reading_id = models.AutoField(primary_key=True)
    node = models.ForeignKey(
        SensorNode,
        on_delete=models.CASCADE,
        db_column='node_id'
    )
    water_level = models.FloatField()
    water_flow = models.FloatField()
    reading_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Normal')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_sensor_readings'

    def __str__(self):
        return f"Reading {self.reading_id} - Node {self.node.node_id}"