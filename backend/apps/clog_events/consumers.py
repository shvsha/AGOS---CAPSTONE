from agos_backend.ws_base import AuthenticatedJsonConsumer

CLOG_EVENTS_GROUP = "clog_events"


class ClogEventConsumer(AuthenticatedJsonConsumer):
    async def after_auth(self):
        await self.channel_layer.group_add(CLOG_EVENTS_GROUP, self.channel_name)

    async def after_disconnect(self, code):
        await self.channel_layer.group_discard(CLOG_EVENTS_GROUP, self.channel_name)

    async def clog_event_message(self, event):
        await self.send_json(event["clog_event"])