from django.db import models
from django.conf import settings
from wallets.models import Wallet
import random

class Withdrawal(models.Model):
    METHOD_CHOICES = [
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CRYPTOCURRENCY', 'Cryptocurrency'),
        ('PAYPAL', 'PayPal'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawals')
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    currency = models.CharField(max_length=10)
    address = models.CharField(max_length=255, blank=True)           # destination address/summary
    withdrawal_method = models.CharField(max_length=30, choices=METHOD_CHOICES, default='CRYPTOCURRENCY')
    transaction_code = models.CharField(max_length=50, unique=True, blank=True)

    # Bank Transfer fields
    bank_name = models.CharField(max_length=100, blank=True)
    account_name = models.CharField(max_length=150, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    swift_code = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=100, blank=True)

    # Crypto fields
    crypto_coin = models.CharField(max_length=20, blank=True)
    crypto_network = models.CharField(max_length=50, blank=True)
    crypto_address = models.CharField(max_length=255, blank=True)

    # PayPal field
    paypal_email = models.EmailField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('CONFIRMED', 'Confirmed'),
            ('PROCESSING', 'Processing'),
            ('COMPLETED', 'Completed'),
            ('REJECTED', 'Rejected')
        ],
        default='PENDING'
    )
    confirmation_code = models.CharField(max_length=6, blank=True)
    approved_by = models.ForeignKey('admin_panel.Admin', on_delete=models.SET_NULL, null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_code or 'WD'} - {self.amount} {self.currency} by {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.confirmation_code:
            self.confirmation_code = f"{random.randint(100000, 999999)}"
        if not self.transaction_code:
            while True:
                code = f"PV-WD-{random.randint(100000, 999999)}"
                if not Withdrawal.objects.filter(transaction_code=code).exists():
                    self.transaction_code = code
                    break
        super().save(*args, **kwargs)

