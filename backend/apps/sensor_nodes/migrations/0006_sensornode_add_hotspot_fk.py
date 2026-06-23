from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    Step 1 of 2: Add hotspot FK as nullable.
    Existing nodes will have hotspot=NULL until manually assigned.
    """

    dependencies = [
        ('sensor_nodes', '0005_alter_sensornode_installed_at_and_more'),
        ('hotspots', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sensornode',
            name='hotspot',
            field=models.OneToOneField(
                blank=True,
                db_column='hotspot_id',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='hotspots.hotspot',
            ),
        ),
    ]
