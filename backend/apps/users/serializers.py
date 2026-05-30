from rest_framework import serializers
from .models import User
from apps.barangay.serializers import BarangaySerializer

class UserSerializer(serializers.ModelSerializer):
  barangay_details = BarangaySerializer(source='barangay', read_only=True)

  class Meta:
      model = User
      fields = [
          'user_id', 'first_name', 'last_name',
          'email', 'username', 'user_role',
          'barangay', 'barangay_details',
          'status', 'created_at', 'updated_at'
      ]
      extra_kwargs = {
          'password': {'write_only': True}
      }

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email',
            'username', 'password', 'user_role', 'barangay'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)