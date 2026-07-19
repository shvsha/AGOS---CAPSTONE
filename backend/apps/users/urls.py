from django.urls import path
from .views import (LoginView, LogoutView, MeView, UserListView, UserDetailView, ForgotPasswordView, VerifyOTPView, ResetPasswordView, InitialSetupView, TokenRefreshView, ChangePasswordView, MobileLoginView, MobileTokenRefreshView, MobileLogoutView,
)

urlpatterns = [
    path('auth/setup/', InitialSetupView.as_view(), name='initial-setup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/verify-code/', VerifyOTPView.as_view(), name='verify-code'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),

    # mobile
    path('auth/mobile-login/', MobileLoginView.as_view(), name='mobile-login'),
    path('auth/mobile-token/refresh/', MobileTokenRefreshView.as_view(), name='mobile-token-refresh'),
    path('auth/mobile-logout/', MobileLogoutView.as_view(), name='mobile-logout'),
]