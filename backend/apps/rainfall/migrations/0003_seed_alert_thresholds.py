from django.db import migrations


THRESHOLDS = [
    ('None',    35.0, 45.0),
    ('Unknown', 25.7, 33.1),
    ('Yellow',  35.0, 45.0),
    ('Orange',  24.6, 31.7),
    ('Red',     17.5, 22.5),
]


def seed_thresholds(apps, schema_editor):
    AlertThreshold = apps.get_model('rainfall', 'AlertThreshold')
    for condition, warning_pct, critical_pct in THRESHOLDS:
        AlertThreshold.objects.update_or_create(
            condition=condition,
            defaults={'warning_pct': warning_pct, 'critical_pct': critical_pct},
        )


def remove_thresholds(apps, schema_editor):
    AlertThreshold = apps.get_model('rainfall', 'AlertThreshold')
    AlertThreshold.objects.filter(
        condition__in=[c for c, _, _ in THRESHOLDS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('rainfall', '0002_alertthreshold'),  # ← check this matches your actual previous migration's filename
    ]

    operations = [
        migrations.RunPython(seed_thresholds, reverse_code=remove_thresholds),
    ]