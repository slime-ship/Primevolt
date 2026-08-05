from rest_framework import serializers
from django.db import transaction
from .models import Withdrawal
from wallets.models import Wallet
from core.models import PlatformSettings

class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = '__all__'
        read_only_fields = ['id', 'user', 'wallet', 'status', 'transaction_code', 'confirmation_code', 'approved_by', 'admin_notes', 'processed_at', 'created_at', 'updated_at']

    def validate(self, data):
        settings = PlatformSettings.get_settings()
        if not settings.enable_withdrawals:
            raise serializers.ValidationError("Withdrawals are currently disabled by the system administrator.")

        user = self.context['request'].user
        currency = data.get('currency', 'USDT')
        amount = data.get('amount')
        method = data.get('withdrawal_method', 'CRYPTOCURRENCY')

        lookup_currency = currency
        if method == 'BANK_TRANSFER' or currency == 'BANK':
            lookup_currency = 'USDT'

        try:
            wallet = Wallet.objects.get(user=user, currency=lookup_currency)
        except Wallet.DoesNotExist:
            # Fallback to user USDT wallet if available
            try:
                wallet = Wallet.objects.get(user=user, currency='USDT')
                lookup_currency = 'USDT'
            except Wallet.DoesNotExist:
                raise serializers.ValidationError(f"You do not have a {lookup_currency} wallet.")

        if wallet.balance < amount:
            raise serializers.ValidationError(f"Insufficient funds in your {lookup_currency} wallet. Available: {wallet.balance}")

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        currency = validated_data.get('currency', 'USDT')
        amount = validated_data.get('amount')
        method = validated_data.get('withdrawal_method', 'CRYPTOCURRENCY')

        lookup_currency = currency
        if method == 'BANK_TRANSFER' or currency == 'BANK':
            lookup_currency = 'USDT'

        try:
            wallet = Wallet.objects.get(user=user, currency=lookup_currency)
        except Wallet.DoesNotExist:
            wallet = Wallet.objects.create(user=user, currency=lookup_currency, balance=0)

        # Generate summary address if address is blank
        if not validated_data.get('address'):
            if method == 'BANK_TRANSFER':
                validated_data['address'] = f"Bank: {validated_data.get('bank_name')} | Acc: {validated_data.get('account_number')}"
            elif method == 'CRYPTOCURRENCY':
                validated_data['address'] = validated_data.get('crypto_address', '')
            elif method == 'PAYPAL':
                validated_data['address'] = validated_data.get('paypal_email', '')

        with transaction.atomic():
            wallet.balance -= amount
            wallet.locked_balance += amount
            wallet.save()

            withdrawal = Withdrawal.objects.create(
                user=user,
                wallet=wallet,
                **validated_data
            )
        return withdrawal

