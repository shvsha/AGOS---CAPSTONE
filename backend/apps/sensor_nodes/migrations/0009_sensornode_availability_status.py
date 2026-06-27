from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sensor_nodes', '0008_sensornode_canal_shape_sensornode_canal_width_and_more'),
    ]

    operations = [
        # Add the new availability_status field
        migrations.AddField(
            model_name='sensornode',
            name='availability_status',
            field=models.CharField(
                choices=[
                    ('Available', 'Available'),
                    ('Occupied', 'Occupied'),
                    ('Retired', 'Retired'),
                ],
                default='Available',
                max_length=15,
            ),
        ),
        # Update status choices to remove Decommissioned
        migrations.AlterField(
            model_name='sensornode',
            name='status',
            field=models.CharField(
                choices=[
                    ('Active', 'Active'),
                    ('Inactive', 'Inactive'),
                    ('Maintenance', 'Maintenance'),
                ],
                default='Active',
                max_length=15,
            ),
        ),
        # Migrate existing data:
        # Decommissioned nodes → Retired availability_status, status back to Active
        # Active/Inactive/Maintenance nodes that have a hotspot → Occupied
        # Active/Inactive/Maintenance nodes without a hotspot → Available
        migrations.RunSQL(
            sql="""
                UPDATE tbl_sensor_nodes
                SET availability_status = CASE
                    WHEN status = 'Decommissioned' THEN 'Retired'
                    WHEN hotspot_id IS NOT NULL THEN 'Occupied'
                    ELSE 'Available'
                END,
                status = CASE
                    WHEN status = 'Decommissioned' THEN 'Active'
                    ELSE status
                END;
            """,
            reverse_sql="""
                UPDATE tbl_sensor_nodes
                SET status = CASE
                    WHEN availability_status = 'Retired' THEN 'Decommissioned'
                    ELSE status
                END;
            """,
        ),
    ]
