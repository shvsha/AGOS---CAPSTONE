from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Throttles login attempts by IP + the email being attempted, not
    just IP alone. This stops both: one attacker spraying many emails
    from one IP, and one IP being used to brute-force a single
    victim's account.
    """
    scope = 'login'

    def get_cache_key(self, request, view):
        email = request.data.get('email', '').strip().lower()
        ident = f"{self.get_ident(request)}:{email}"
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class OTPRateThrottle(SimpleRateThrottle):
    """
    Same idea as LoginRateThrottle, used for both requesting an OTP
    (ForgotPasswordView) and verifying one (VerifyOTPView) — caps how
    fast someone can brute-force the 6-digit code, and how fast one IP
    can spam OTP emails at a given address.
    """
    scope = 'otp'

    def get_cache_key(self, request, view):
        email = request.data.get('email', '').strip().lower()
        ident = f"{self.get_ident(request)}:{email}"
        return self.cache_format % {'scope': self.scope, 'ident': ident}