import random
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from admin_panel.models import WebsiteSetting

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_market_data(request):
    # Return mock cryptocurrency prices with slight random variations to simulate live tickers
    base_prices = {
        'BTC': 65230.50,
        'ETH': 3450.25,
        'USDT': 1.00,
        'BNB': 585.10,
        'SOL': 145.75
    }
    
    data = []
    for crypto, price in base_prices.items():
        # Add a random daily change between -3% and +3%
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
    # Fetch public settings
    settings_qs = WebsiteSetting.objects.filter(category='general')
    settings_dict = {}
    for s in settings_qs:
        settings_dict[s.key] = s.value
        
    # Default values if empty
    defaults = {
        'company_name': 'PrimeVolt',
        'support_email': 'support@primevolt.com',
        'footer_text': '© 2026 PrimeVolt Platform. All rights reserved.',
        'contact_phone': '+1 (800) 555-0199',
    }
    
    for k, v in defaults.items():
        if k not in settings_dict:
            settings_dict[k] = v
            
    return Response(settings_dict)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def convert_balance(request):
    target_currency = request.query_params.get('target_currency', 'BTC').upper()
    rates = {
        'BTC': 65230.50,
        'ETH': 3450.25,
        'USDT': 1.00,
        'BNB': 585.10,
        'SOL': 145.75,
        'EUR': 0.92,
        'GBP': 0.79,
    }
    
    if target_currency not in rates:
        return Response({'error': f'Unsupported currency: {target_currency}'}, status=status.HTTP_400_BAD_REQUEST)
        
    user = request.user
    balance = float(user.balance)
    rate = rates[target_currency]
    
    if target_currency in ['BTC', 'ETH', 'BNB', 'SOL']:
        converted_amount = balance / rate
    else:
        converted_amount = balance * rate
        
    return Response({
        'balance_usdt': balance,
        'target_currency': target_currency,
        'rate': rate,
        'converted_amount': round(converted_amount, 6)
    })

