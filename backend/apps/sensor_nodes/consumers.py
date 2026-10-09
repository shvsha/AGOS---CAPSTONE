from agos_backend.ws_base import AuthenticatedJsonConsumer

HEALTH_GROUP = "node_health"
ASSIGNMENT_GROUP = "node_assignments"

ADMIN_ROLES = {"Admin"}


class NodeHealthConsumer(AuthenticatedJsonConsumer):
    async def after_auth(self):
        if getattr(self.user, "user_role", None) not in ADMIN_ROLES:
            await self.close()
            return
        await self.channel_layer.group_add(HEALTH_GROUP, self.channel_name)

    async def after_disconnect(self, code):
        await self.channel_layer.group_discard(HEALTH_GROUP, self.channel_name)

    async def health_message(self, event):
        await self.send_json(event["health"])


class NodeAssignmentConsumer(AuthenticatedJsonConsumer):
    async def after_auth(self):
        if getattr(self.user, "user_role", None) not in ADMIN_ROLES:
            await self.close()
            return
        await self.channel_layer.group_add(ASSIGNMENT_GROUP, self.channel_name)

    async def after_disconnect(self, code):
        await self.channel_layer.group_discard(ASSIGNMENT_GROUP, self.channel_name)

    async def assignment_message(self, event):
        await self.send_json(event["assignment"])