from django.db import migrations

STREAK_COUNTS = [
    ('None',    5),
    ('Yellow',  7),
    ('Orange',  15),
    ('Red',     30),
    ('Unknown', 9),
]


def seed_streak_counts(apps, schema_editor):
    AlertThreshold = apps.get_model('rainfall', 'AlertThreshold')
    for condition, count in STREAK_COUNTS:
        AlertThreshold.objects.filter(condition=condition).update(
            clear_streak_count=count
        )


def revert_streak_counts(apps, schema_editor):
    AlertThreshold = apps.get_model('rainfall', 'AlertThreshold')
    AlertThreshold.objects.all().update(clear_streak_count=5)


class Migration(migrations.Migration):

    dependencies = [
        ('rainfall', '0006_alertthreshold_clear_streak_count'),  # ← confirm this matches your actual filename
    ]

    operations = [
        migrations.RunPython(seed_streak_counts, reverse_code=revert_streak_counts),
    ]