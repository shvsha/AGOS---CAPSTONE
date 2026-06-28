from rest_framework import serializers
from .models import User
from apps.barangay.serializers import BarangaySerializer
import secrets
import string


class UserSerializer(serializers.ModelSerializer):
    barangay_details = BarangaySerializer(source='barangay', read_only=True)
    barangay_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'user_id', 'first_name', 'last_name',
            'email', 'user_role',
            'position', 'barangay_id', 'barangay_details',
            'status', 'must_change_password',
            'created_at', 'updated_at'
        ]

    def update(self, instance, validated_data):
        barangay_id = validated_data.pop('barangay_id', -1)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if barangay_id != -1:
            instance.barangay_id = barangay_id
        instance.save()
        return instance
    

def generate_random_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))
    

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    barangay_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email',
            'password', 'user_role',
            'position', 'barangay_id'
        ]

    def validate(self, attrs):
        role = attrs.get('user_role', '')
        password = attrs.get('password', None)
        if role == 'Admin' and not password:
            raise serializers.ValidationError(
                {'password': 'Password is required for Admin accounts.'}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        barangay_id = validated_data.pop('barangay_id', None)

        generated_password = None
        if not password:
            generated_password = generate_random_password()
            password = generated_password

        user = User(**validated_data)
        user.set_password(password)
        user.must_change_password = True
        if barangay_id is not None:
            user.barangay_id = barangay_id
        user.save()

        if generated_password:
            from .utils import send_credentials_email
            send_credentials_email(user, generated_password)

        return user