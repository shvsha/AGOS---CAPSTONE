from django.urls import path
from .views import (LoginView, LogoutView, MeView, UserListView, UserDetailView, ForgotPasswordView, VerifyOTPView, ResetPasswordView
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/verify-code/', VerifyOTPView.as_view(), name='verify-code'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
]