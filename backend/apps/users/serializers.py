from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VIPLevel, VIPUpgradeRequest

User = get_user_model()

class VIPLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = VIPLevel
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    vip_level_details = VIPLevelSerializer(source='vip_level', read_only=True)
    ssn = serializers.CharField(write_only=True, required=False)
    active_investment = serializers.ReadOnlyField()
    profit_accrued = serializers.ReadOnlyField()
    referral_bonus = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'full_name', 'date_of_birth',
            'address', 'city', 'state', 'country', 'zip_code', 'ssn', 'profile_picture',
            'is_email_verified', 'is_phone_verified', 'kyc_status', 'kyc_level',
            'vip_level', 'vip_level_details', 'referral_code', 'balance', 'profit_balance',
            'is_frozen', 'is_2fa_enabled', 'created_at', 'updated_at',
            'active_investment', 'profit_accrued', 'referral_bonus'
        ]
        read_only_fields = [
            'id', 'username', 'is_email_verified', 'is_phone_verified',
            'kyc_status', 'kyc_level', 'vip_level', 'referral_code',
            'balance', 'profit_balance', 'is_frozen', 'is_2fa_enabled', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        ssn = validated_data.pop('ssn', None)
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        if ssn:
            user.ssn = ssn
        user.save()
        return user

    def update(self, instance, validated_data):
        ssn = validated_data.pop('ssn', None)
        if ssn:
            instance.ssn = ssn
        return super().update(instance, validated_data)


class AdminUserSerializer(serializers.ModelSerializer):
    vip_level_details = VIPLevelSerializer(source='vip_level', read_only=True)
    active_investment = serializers.ReadOnlyField()
    profit_accrued = serializers.ReadOnlyField()
    referral_bonus = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'full_name', 'date_of_birth',
            'address', 'city', 'state', 'country', 'zip_code', 'profile_picture',
            'is_email_verified', 'is_phone_verified', 'kyc_status', 'kyc_level',
            'vip_level', 'vip_level_details', 'referral_code', 'balance', 'profit_balance',
            'is_frozen', 'is_2fa_enabled', 'created_at', 'updated_at',
            'active_investment', 'profit_accrued', 'referral_bonus',
            'active_investment_override', 'profit_accrued_override', 'referral_bonus_override'
        ]
        # balance, profit_balance, is_frozen, kyc_status, vip_level etc are writable in admin serializer
        read_only_fields = [
            'id', 'username', 'referral_code', 'created_at', 'updated_at'
        ]


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_email_verified and not self.user.is_staff and not self.user.is_superuser:
            raise serializers.ValidationError({"detail": "Your account is currently pending administrator verification."})
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    referral_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'full_name', 'phone', 'referral_code']

    def create(self, validated_data):
        referral_code = validated_data.pop('referral_code', None)
        referred_by = None
        if referral_code:
            try:
                referrer = User.objects.get(referral_code=referral_code)
                if referrer.username != validated_data.get('username') and referrer.email != validated_data.get('email'):
                    referred_by = referrer
            except User.DoesNotExist:
                pass
        
        password = validated_data.pop('password')
        user = User(**validated_data, referred_by=referred_by)
        user.set_password(password)
        user.save()

        if referred_by:
            from django.db import transaction as db_transaction
            from wallets.models import Wallet
            from transactions.models import Transaction
            from users.models import Referral
            from decimal import Decimal

            with db_transaction.atomic():
                # 1. Store the referral mapping
                Referral.objects.create(
                    referrer=referred_by,
                    referred=user,
                    referral_code=referral_code,
                    status='COMPLETED',
                    bonus_awarded=Decimal('10.0')
                )

                # 2. Award $5 signup bonus to the referred user's USDT wallet
                referred_wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
                referred_wallet.balance += Decimal('5.0')
                referred_wallet.save(update_fields=['balance'])

                Transaction.objects.create(
                    user=user,
                    wallet=referred_wallet,
                    type='REFERRAL_BONUS',
                    amount=Decimal('5.0'),
                    currency='USDT',
                    description=f"Signup referral bonus via code {referral_code}",
                    status='COMPLETED'
                )

                # 3. Award $10 bonus to the referrer's USDT wallet
                referrer_wallet, _ = Wallet.objects.get_or_create(user=referred_by, currency='USDT')
                referrer_wallet.balance += Decimal('10.0')
                referrer_wallet.save(update_fields=['balance'])

                Transaction.objects.create(
                    user=referred_by,
                    wallet=referrer_wallet,
                    type='REFERRAL_BONUS',
                    amount=Decimal('10.0'),
                    currency='USDT',
                    description=f"Referral reward for inviting {user.username}",
                    status='COMPLETED'
                )

        return user

class VIPUpgradeRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = VIPUpgradeRequest
        fields = '__all__'
        read_only_fields = ['id', 'user', 'amount', 'status', 'created_at', 'updated_at']


