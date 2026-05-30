from django.db import models

class Barangay(models.Model):
  barangay_id = models.AutoField(primary_key=True)
  barangay_name = models.CharField(max_length=100)
  latitude = models.FloatField()
  longitude  = models.FloatField()

  class Meta:
    db_table = 'tbl_barangay'

  def __str__(self):
    return self.barangay_name