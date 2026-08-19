import asyncio
from http.cookies import SimpleCookie
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


def _get_cookie_token(scope):
    """Pull access_token out of the raw Cookie header on the WS handshake, if present."""
    headers = dict(scope.get('headers') or [])
    raw_cookie = headers.get(b'cookie')
    if not raw_cookie:
        return None
    cookie = SimpleCookie()
    cookie.load(raw_cookie.decode('utf-8'))
    morsel = cookie.get('access_token')
    return morsel.value if morsel else None


class AuthenticatedJsonConsumer(AsyncJsonWebsocketConsumer):
    """
    Authenticates via the httpOnly access_token cookie automatically at
    connect time (web browser clients). Falls back to an explicit
    {"type": "auth", "token": "..."} message for clients with no cookie
    to rely on (the mobile app, which stores its token in SecureStore).
    """

    async def connect(self):
        self.user = None
        self.authenticated = False
        await self.accept()

        cookie_token = _get_cookie_token(self.scope)
        if cookie_token:
            try:
                self.user = await get_user_from_token(cookie_token)
                self.authenticated = True
                await self.send_json({"type": "auth_success"})
                await self.after_auth()
                return
            except Exception:
                pass  # fall through, client may still send a token via the auth message

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
                if hasattr(self, "_auth_timeout_task"):
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

    async def after_auth(self):
        pass

    async def after_message(self, content):
        pass

    async def after_disconnect(self, code):
        pass