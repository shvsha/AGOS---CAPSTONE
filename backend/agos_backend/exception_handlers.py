from rest_framework.views import exception_handler
from rest_framework.exceptions import Throttled


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, Throttled):
        wait = int(exc.wait) if exc.wait is not None else None

        if wait is not None and wait >= 60:
            minutes = wait // 60
            unit = "minute" if minutes == 1 else "minutes"
            friendly = f"Too many attempts. Please try again in about {minutes} {unit}."
        elif wait is not None:
            unit = "second" if wait == 1 else "seconds"
            friendly = f"Too many attempts. Please try again in {wait} {unit}."
        else:
            friendly = "Too many attempts. Please wait a moment and try again."

        response.data = {"detail": friendly}

    return response