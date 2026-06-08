from rest_framework import serializers
from .models import User
from apps.barangay.serializers import BarangaySerializer

class UserSerializer(serializers.ModelSerializer):
  barangay_details = BarangaySerializer(source='barangay', read_only=True)
  barangay_id = serializers.IntegerField(required=False, allow_null=True)

  class Meta:
    model = User
    fields = [
        'user_id', 'first_name', 'last_name',
        'email', 'username', 'user_role',
        'position', 'barangay_id', 'barangay_details',
        'status', 'created_at', 'updated_at'
    ]
    extra_kwargs = {
        'password': {'write_only': True}
    }

    def update(self, instance, validated_data):
        barangay_id = validated_data.pop('barangay_id', -1)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if barangay_id != -1:
            instance.barangay_id = barangay_id

        instance.save()
        return instance
    

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    barangay_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email',
            'username', 'password', 'user_role',
            'position', 'barangay_id'
        ]

    def validate(self, attrs):
        # If creating admin, password must be explicitly provided
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
        user_role = validated_data.get('user_role')

        if not password:
            if user_role == 'MENRO':
                password = 'menro123'
            elif user_role == 'Barangay':
                password = 'barangay123'

        user = User(**validated_data)
        user.set_password(password)
        if barangay_id is not None:
            user.barangay_id = barangay_id
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)