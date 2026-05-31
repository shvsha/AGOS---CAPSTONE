from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    audit_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        db_column='user_id'
    )
    action = models.CharField(max_length=100)
    affected_table = models.CharField(max_length=100, null=True, blank=True)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_audit_logs'

    def __str__(self):
        return f"Audit {self.audit_id} - {self.action} - {self.user}"