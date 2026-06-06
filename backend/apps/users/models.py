from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from apps.barangay.models import Barangay

class UserManager(BaseUserManager):
    def create_user(self, email, username, first_name, last_name, user_role, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            user_role=user_role,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault('user_role', 'Admin')
        return self.create_user(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            user_role='Admin',
            password=password,
            **extra_fields
        )

class User(AbstractBaseUser):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('MENRO', 'MENRO'),
        ('Barangay', 'Barangay'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, unique=True)
    user_role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='barangay_id'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [ 'first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'tbl_user'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.user_role})"