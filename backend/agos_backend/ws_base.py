import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from apps.users.models import User

AUTH_TIMEOUT_SECONDS = 10


@database_sync_to_async
def get_user_from_token(token):
    validated = AccessToken(token)  # raises if invalid/expired
    user_id = validated['user_id']
    return User.objects.get(pk=user_id)


class AuthenticatedJsonConsumer(AsyncJsonWebsocketConsumer):
    """
    Requires a {"type": "auth", "token": "..."} message as the first
    message after connecting — nothing else is processed until that
    succeeds. Keeps the JWT out of the URL/logs entirely.
    Subclasses implement after_auth() / after_message() / after_disconnect()
    instead of connect() / receive() / disconnect() directly.
    """

    async def connect(self):
        self.user = None
        self.authenticated = False
        await self.accept()
        self._auth_timeout_task = asyncio.create_task(self._enforce_auth_timeout())

    async def _enforce_auth_timeout(self):
        await asyncio.sleep(AUTH_TIMEOUT_SECONDS)
        if not self.authenticated:
            await self.send_json({"type": "auth_error", "message": "Authentication timed out."})
            await self.close()

    async def receive_json(self, content, **kwargs):
        if not self.authenticated:
            if content.get("type") != "auth":
                await self.send_json({"type": "auth_error", "message": "Must authenticate first."})
                return

            token = content.get("token")
            try:
                self.user = await get_user_from_token(token)
                self.authenticated = True
                self._auth_timeout_task.cancel()
                await self.send_json({"type": "auth_success"})
                await self.after_auth()
            except Exception:
                await self.send_json({"type": "auth_error", "message": "Invalid or expired token."})
                await self.close()
            return

        await self.after_message(content)

    async def disconnect(self, code):
        if hasattr(self, "_auth_timeout_task"):
            self._auth_timeout_task.cancel()
        await self.after_disconnect(code)

    # hooks for subclasses to override
    async def after_auth(self):
        pass

    async def after_message(self, content):
        pass

    async def after_disconnect(self, code):
        pass