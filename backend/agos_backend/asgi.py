import os

from django.core.asgi import get_asgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agos_backend.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from agos_backend import ws_routing

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': URLRouter(ws_routing.websocket_urlpatterns),
})