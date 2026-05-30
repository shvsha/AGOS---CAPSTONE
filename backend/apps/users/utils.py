import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email, otp):
    subject = 'Password Reset Code'
    message = f'Your password reset code is: {otp}. It expires in 10 minutes.'
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [email],
        fail_silently=False,
    )

def store_otp(email, otp):
    # Store OTP in cache for 10 minutes
    cache.set(f'otp_{email}', otp, timeout=600)

def verify_otp(email, otp):
    stored_otp = cache.get(f'otp_{email}')
    if stored_otp and stored_otp == otp:
        cache.delete(f'otp_{email}')
        # Mark email as verified for password reset
        cache.set(f'verified_{email}', True, timeout=600)
        return True
    return False

def is_verified(email):
    return cache.get(f'verified_{email}') is True

def clear_verified(email):
    cache.delete(f'verified_{email}')