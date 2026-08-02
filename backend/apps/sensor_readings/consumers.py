from agos_backend.ws_base import AuthenticatedJsonConsumer

READINGS_GROUP = "sensor_readings"


class SensorReadingConsumer(AuthenticatedJsonConsumer):
    async def after_auth(self):
        await self.channel_layer.group_add(READINGS_GROUP, self.channel_name)

    async def after_disconnect(self, code):
        await self.channel_layer.group_discard(READINGS_GROUP, self.channel_name)

    async def reading_message(self, event):
        await self.send_json(event["reading"])