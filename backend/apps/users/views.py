from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .utils import generate_otp, send_otp_email, store_otp, verify_otp, is_verified, clear_verified
from django.contrib.auth import authenticate
from .models import User
from apps.users.permissions import IsAdmin
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from apps.audit_logs.utils import log_action

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find user by username first
        try:
            user_obj = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = authenticate(request, email=user_obj.email, password=password)

        if user:
            if user.status == 'Inactive':
                return Response(
                    {'error': 'Account is inactive'},
                    status=status.HTTP_403_FORBIDDEN
                )
            refresh = RefreshToken.for_user(user)

            # Log the login action
            log_action(
                user=user,  
                action='Login',
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Log the logout action
            log_action(
                user=request.user,
                action='Logout',
                ip_address=request.META.get('REMOTE_ADDR')
            )

            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RegisterSerializer
        return UserSerializer
    
    def perform_create(self, serializer):
        user = serializer.save()
        log_action(
            user=self.request.user,
            action='Created User',
            affected_table='tbl_user',
            new_value=f"username: {user.username}, role: {user.user_role}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'user_id'
    permission_classes = [IsAdmin]

    # log actions
    def perform_update(self, serializer):
        old_status = serializer.instance.status
        user = serializer.save()
        log_action(
            user=self.request.user,
            action='Updated User',
            affected_table='tbl_user',
            old_value=f"status: {old_status}",
            new_value=f"status: {user.status}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
    
    def perform_destroy(self, instance):
        log_action(
            user=self.request.user,
            action='Deleted User',
            affected_table='tbl_user',
            old_value=f"username: {instance.username}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        instance.delete()


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'email': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'email': 'No account found with this email'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        otp = generate_otp()
        store_otp(email, otp)
        send_otp_email(email, otp)
        
        return Response(
            {'message': 'OTP sent to your email'},
            status=status.HTTP_200_OK
        )


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response(
                {'error': 'Email and code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verify_otp(email, code):
            return Response(
                {'message': 'Code verified successfully'},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'code': 'That code is incorrect or has expired'},
            status=status.HTTP_400_BAD_REQUEST
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not is_verified(email):
            return Response(
                {'error': 'Email not verified. Please complete OTP verification first'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()
            clear_verified(email)
            return Response(
                {'message': 'Password reset successfully'},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
