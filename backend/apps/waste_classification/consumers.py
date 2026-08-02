from agos_backend.ws_base import AuthenticatedJsonConsumer

WASTE_GROUP = "waste_classification"


class WasteClassificationConsumer(AuthenticatedJsonConsumer):
    async def after_auth(self):
        await self.channel_layer.group_add(WASTE_GROUP, self.channel_name)

    async def after_disconnect(self, code):
        await self.channel_layer.group_discard(WASTE_GROUP, self.channel_name)

    async def waste_message(self, event):
        await self.send_json(event["waste"])