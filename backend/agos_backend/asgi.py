import socket

_orig_getaddrinfo = socket.getaddrinfo
def _getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _getaddrinfo_ipv4_only

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