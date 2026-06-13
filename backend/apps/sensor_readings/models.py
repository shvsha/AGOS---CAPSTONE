from django.db import models
from apps.sensor_nodes.models import SensorNode

class SensorReading(models.Model):
    STATUS_CHOICES = [
        ('Normal', 'Normal'),
        ('Warning', 'Warning'),
        ('Critical', 'Critical')
    ]

    WATER_FLOW_CHOICES = [
        ('Normal', 'Normal'),
        ('Slow', 'Slow'),
        ('Stagnant', 'Stagnant'),
    ]

    reading_id = models.AutoField(primary_key=True)
    node = models.ForeignKey(
        SensorNode,
        on_delete=models.CASCADE,
        db_column='node_id'
    )
    water_level = models.FloatField()

    water_flow_rate = models.FloatField(
        null=True,
        blank=True,
        help_text="Calculated flow rate in m/s from camera analysis"
    )

    water_flow = models.CharField(
        max_length=10,
        choices=WATER_FLOW_CHOICES,
        default='Normal'
    )

    reading_status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='Normal'
    )
    
    clog_pct = models.FloatField(
        null=True,
        blank=True,
        help_text="Calculated clog percentage base on water level and water flow rate"
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_sensor_readings'

    def __str__(self):
        return f"Reading {self.reading_id} - Node {self.node.node_id}"