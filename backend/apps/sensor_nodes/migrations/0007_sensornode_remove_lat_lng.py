from django.db import migrations


class Migration(migrations.Migration):
    """
    Step 2 of 2: Drop latitude and longitude from tbl_sensor_nodes.
    Coordinates are now inherited from the assigned hotspot.
    Run this after confirming existing nodes have been assigned hotspots.
    """

    dependencies = [
        ('sensor_nodes', '0006_sensornode_add_hotspot_fk'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sensornode',
            name='latitude',
        ),
        migrations.RemoveField(
            model_name='sensornode',
            name='longitude',
        ),
    ]
