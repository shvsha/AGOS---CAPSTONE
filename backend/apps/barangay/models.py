from django.db import models

class Barangay(models.Model):
  STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Archived', 'Archived'),
    ]
  
  barangay_id = models.AutoField(primary_key=True)
  barangay_name = models.CharField(max_length=100)
  latitude = models.FloatField()
  longitude  = models.FloatField()
  status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active')

  class Meta:
    db_table = 'tbl_barangay'

  def __str__(self):
    return self.barangay_name