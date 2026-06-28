from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender='users.User')
def deactivate_previous_admin(sender, instance, created, **kwargs):
    if not created:
        return
    if instance.user_role != 'Admin':
        return

    # Deactivate all other active admins except the one just created
    sender.objects.filter(
        user_role='Admin',
        status='Active',
    ).exclude(pk=instance.pk).update(status='Inactive')