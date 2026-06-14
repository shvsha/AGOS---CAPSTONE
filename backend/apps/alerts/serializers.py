from rest_framework import serializers
from .models import Alert, AlertRead


class AlertSerializer(serializers.ModelSerializer):
    node_name = serializers.SerializerMethodField()
    barangay_name = serializers.SerializerMethodField()
    is_read  = serializers.SerializerMethodField()
    alert_context = serializers.SerializerMethodField()

    class Meta:
        model  = Alert
        fields = [
            'alert_id', 'alert_type', 'node_name', 'barangay_name',
            'timestamp', 'is_read', 'alert_context',
        ]

    def get_node_name(self, obj):
        return obj.node.node_name if obj.node else None

    def get_barangay_name(self, obj):
        return obj.node.barangay.barangay_name if obj.node else None

    def get_is_read(self, obj):
        user = self.context['request'].user
        return obj.reads.filter(user=user).exists()

    def get_alert_context(self, obj):
        """
        Returns extra fields relevant to each alert type.

        Critical_Clog       → dominant_waste_type, estimated_volume (kg)
        Water_Level_Rising  → water_level (cm), water_flow_rate (m/s), water_flow status
        Node_Offline        → last health status, checked_at
        Low_Battery         → battery_voltage
        Weak_Signal         → signal_strength
        Sensor_Failure      → sensor_continuity
        """
        t = obj.alert_type

        if t == 'Critical_Clog':
            if obj.node:
                reading = obj.node.sensorreading_set.order_by('-timestamp').first()
                if reading:
                    return {
                        'water_level': reading.water_level,
                        'water_flow': reading.water_flow,
                        'water_flow_rate': reading.water_flow_rate,
                        'clog_pct': reading.clog_pct,
                    }
            return {}
                
        if t == 'High_Clog_Index':
            if obj.node:
                classification = (
                    obj.node.wasteclassification_set
                    .order_by('-timestamp')
                    .first()
                )
                if classification:
                    return {
                        'dominant_waste_type': classification.dominant_waste_type,
                        'recyclable_pct': classification.recyclable_pct,
                        'biodegradable_pct': classification.biodegradable_pct,
                        'residual_pct': classification.residual_pct,
                        'special_waste_pct': classification.special_waste_pct,
                        'confidence': classification.confidence,
                        'estimated_volume': classification.estimated_volume,
                    }
            return {}

        if t == 'Water_Level_Rising':
            if obj.node:
                reading = (
                    obj.node.sensorreading_set
                    .order_by('-timestamp')
                    .first()
                )
                if reading:
                    return {
                        'water_level': reading.water_level,
                        'water_flow_rate': reading.water_flow_rate,
                        'water_flow': reading.water_flow,
                    }
            return {}

        # Node health alerts
        if t in ('Node_Offline', 'Low_Battery', 'Weak_Signal', 'Sensor_Failure'):
            health = obj.health_log
            
            if not health and obj.node:
              health = obj.node.systemhealthlog_set.order_by('-checked_at').first()

            if health:
                return {
                    'battery_voltage': health.battery_voltage,
                    'signal_strength': health.signal_strength,
                    'sensor_continuity': health.sensor_continuity,
                    'health_status': health.status,
                    'checked_at': health.checked_at,
                }
            return {}

        return {}