from django.db import models
from apps.clog_events.models import ClogEvent
from django.conf import settings

class Alert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('Clog', 'Clog'),
        ('Abnormal_Water_Level', 'Abnormal Water Level'),
        ('Node_Offline', 'Node Offline'),
        ('Low_Battery', 'Low Battery'),
        ('Weak_Signal', 'Weak Signal'),
        ('Sensor_Failure', 'Sensor Failure'),
    ]

    alert_id = models.AutoField(primary_key=True)
    event = models.ForeignKey(
        ClogEvent,
        on_delete=models.CASCADE,
        db_column='event_id',
        null=True,
        blank=True,
    )
    node = models.ForeignKey(
        'sensor_nodes.SensorNode',
        on_delete=models.CASCADE,
        db_column='node_id',
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id'
    )
    alert_type = models.CharField(max_length=25, choices=ALERT_TYPE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_alerts'

    def __str__(self):
        return f"Alert {self.alert_id} - {self.alert_type} - {self.user.username}"