from django.db import models

class TrainingCapture(models.Model):
    capture_id = models.AutoField(primary_key=True)
    session_label = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='training_captures/')
    latitude = models.CharField(max_length=50, null=True, blank=True)
    longitude = models.CharField(max_length=50, null=True, blank=True)
    captured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_training_capture'

    def __str__(self):
        return f"{self.session_label} - {self.captured_at}"