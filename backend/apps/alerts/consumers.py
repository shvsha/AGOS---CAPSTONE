from agos_backend.ws_base import AuthenticatedJsonConsumer

ALERTS_GROUP = "alerts"


class AlertConsumer(AuthenticatedJsonConsumer):
    async def after_auth(self):
        await self.channel_layer.group_add(ALERTS_GROUP, self.channel_name)

    async def after_disconnect(self, code):
        await self.channel_layer.group_discard(ALERTS_GROUP, self.channel_name)

    # handler name must match the "type" key sent in group_send (see signals.py)
    async def alert_message(self, event):
        await self.send_json(event["alert"])