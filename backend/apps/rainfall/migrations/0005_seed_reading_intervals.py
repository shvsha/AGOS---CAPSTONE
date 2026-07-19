from django.db import migrations

INTERVALS = [
    ('None',    360),
    ('Yellow',  240),
    ('Orange',  120),
    ('Red',     60),
    ('Unknown', 205),
]


def seed_intervals(apps, schema_editor):
    AlertThreshold = apps.get_model('rainfall', 'AlertThreshold')
    for condition, seconds in INTERVALS:
        AlertThreshold.objects.filter(condition=condition).update(
            reading_interval_seconds=seconds
        )


def revert_intervals(apps, schema_editor):
    AlertThreshold = apps.get_model('rainfall', 'AlertThreshold')
    AlertThreshold.objects.all().update(reading_interval_seconds=300)


class Migration(migrations.Migration):

    dependencies = [
        ('rainfall', '0004_alertthreshold_reading_interval_seconds'),  # ← confirm this matches Step 2's actual migration filename
    ]

    operations = [
        migrations.RunPython(seed_intervals, reverse_code=revert_intervals),
    ]