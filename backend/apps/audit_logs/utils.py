from .models import AuditLog

def log_action(user, action, affected_table=None, old_value=None, new_value=None, ip_address=None):
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            affected_table=affected_table,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address
        )
    except Exception as e:
        # Don't let audit logging break the main functionality
        print(f"Audit log error: {e}")