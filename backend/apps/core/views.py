import random
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction as db_transaction
from admin_panel.models import WebsiteSetting
from core.models import PlatformSettings
from wallets.models import CompanyWallet, Wallet
from transactions.models import Transaction

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_market_data(request):
    base_prices = {
        'BTC': 65000.00,
        'ETH': 3450.25,
        'USDT': 1.00,
        'BNB': 585.10,
        'SOL': 145.75
    }
    data = []
    for crypto, price in base_prices.items():
        change_pct = random.uniform(-3.5, 3.5) if crypto != 'USDT' else 0.00
        price_adjusted = price * (1 + change_pct / 100) if crypto != 'USDT' else 1.00
        data.append({
            'symbol': crypto,
            'name': 'Tether' if crypto == 'USDT' else crypto,
            'price': round(price_adjusted, 2),
            'change_24h': round(change_pct, 2)
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_public_settings(request):
    settings_obj = PlatformSettings.get_settings()
    active_company_wallet = CompanyWallet.objects.filter(active=True).first()

    wallet_address = active_company_wallet.wallet_address if active_company_wallet else settings_obj.company_wallet_address
    wallet_network = active_company_wallet.network if active_company_wallet else settings_obj.wallet_network

    settings_qs = WebsiteSetting.objects.filter(category='general')
    settings_dict = {}
    for s in settings_qs:
        settings_dict[s.key] = s.value
        
    defaults = {
        'company_name': 'PrimeVolt',
        'support_email': 'support@primevolt.com',
        'footer_text': '© 2026 PrimeVolt Platform. All rights reserved.',
        'contact_phone': '+1 (800) 555-0199',
    }
    
    for k, v in defaults.items():
        if k not in settings_dict:
            settings_dict[k] = v

    settings_dict.update({
        'company_wallet_address': wallet_address,
        'wallet_network': wallet_network,
        'vip_upgrade_fee': float(settings_obj.vip_upgrade_fee),
        'conversion_fee_percent': float(settings_obj.conversion_fee_percent),
        'enable_currency_converter': settings_obj.enable_currency_converter,
        'enable_vip_upgrade': settings_obj.enable_vip_upgrade,
        'enable_withdrawals': settings_obj.enable_withdrawals,
    })
            
    return Response(settings_dict)

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def convert_balance(request):
    settings_obj = PlatformSettings.get_settings()
    if not settings_obj.enable_currency_converter:
        return Response({'error': 'Currency converter is currently disabled by administrator.'}, status=status.HTTP_400_BAD_REQUEST)

    rates = {
        'BTC': 65000.00,
        'ETH': 3450.25,
        'USDT': 1.00,
        'BNB': 585.10,
        'SOL': 145.75,
        'EUR': 0.92,
        'GBP': 0.79,
    }

    if request.method == 'GET':
        target_currency = request.query_params.get('target_currency', 'BTC').upper()
        amount_str = request.query_params.get('amount', str(request.user.balance))
        try:
            amount = float(amount_str)
        except ValueError:
            amount = float(request.user.balance)

        if target_currency not in rates:
            return Response({'error': f'Unsupported currency: {target_currency}'}, status=status.HTTP_400_BAD_REQUEST)

        fee_pct = float(settings_obj.conversion_fee_percent)
        fee_amount = amount * (fee_pct / 100.0)
        net_amount = amount - fee_amount
        rate = rates[target_currency]

        if target_currency in ['BTC', 'ETH', 'BNB', 'SOL']:
            converted_amount = net_amount / rate
        else:
            converted_amount = net_amount * rate

        return Response({
            'original_amount': amount,
            'source_currency': 'USDT',
            'target_currency': target_currency,
            'fee_percent': fee_pct,
            'fee_amount': round(fee_amount, 4),
            'net_converted_usdt': round(net_amount, 4),
            'rate': rate,
            'converted_amount': round(converted_amount, 6)
        })

    elif request.method == 'POST':
        user = request.user
        amount_input = request.data.get('amount', user.balance)
        target_currency = request.data.get('target_currency', 'BTC').upper()

        try:
            amount = float(amount_input)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        if target_currency not in rates:
            return Response({'error': f'Unsupported target currency: {target_currency}'}, status=status.HTTP_400_BAD_REQUEST)

        usdt_wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
        if float(usdt_wallet.balance) < amount:
            return Response({'error': f'Insufficient balance. Your USDT balance is {usdt_wallet.balance}.'}, status=status.HTTP_400_BAD_REQUEST)

        fee_pct = float(settings_obj.conversion_fee_percent)
        fee_amount = amount * (fee_pct / 100.0)
        net_amount = amount - fee_amount
        rate = rates[target_currency]

        if target_currency in ['BTC', 'ETH', 'BNB', 'SOL']:
            received_amount = net_amount / rate
        else:
            received_amount = net_amount * rate

        with db_transaction.atomic():
            # 1. Deduct original amount from USDT balance
            usdt_wallet.balance = float(usdt_wallet.balance) - amount
            usdt_wallet.save()

            # 2. Credit converted target currency wallet balance
            target_wallet, _ = Wallet.objects.get_or_create(user=user, currency=target_currency)
            target_wallet.balance = float(target_wallet.balance) + received_amount
            target_wallet.save()

            user.balance = usdt_wallet.balance
            user.save(update_fields=['balance'])

            # 3. Save conversion transaction record
            description_text = (
                f"From: {amount:.2f} USDT | Fee: {fee_amount:.2f} USDT | "
                f"Converted: {net_amount:.2f} USDT | Received: {received_amount:.6f} {target_currency}"
            )

            Transaction.objects.create(
                user=user,
                wallet=target_wallet,
                type='CURRENCY_CONVERSION',
                amount=received_amount,
                currency=target_currency,
                fee=fee_amount,
                description=description_text,
                status='COMPLETED'
            )

        return Response({
            'message': 'Currency conversion completed successfully!',
            'original_amount': amount,
            'source_currency': 'USDT',
            'fee_amount': round(fee_amount, 4),
            'amount_converted_usdt': round(net_amount, 4),
            'received_amount': round(received_amount, 6),
            'target_currency': target_currency,
            'new_usdt_balance': float(user.balance),
            'new_target_balance': float(target_wallet.balance)
        })
