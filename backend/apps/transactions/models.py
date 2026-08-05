from django.db import models
from django.conf import settings
from django.utils import timezone
from wallets.models import Wallet

class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    wallet = models.ForeignKey(Wallet, on_delete=models.SET_NULL, null=True)
    type = models.CharField(
        max_length=20,
        choices=[
            ('DEPOSIT', 'Deposit'),
            ('WITHDRAWAL', 'Withdrawal'),
            ('INVESTMENT', 'Investment'),
            ('PROFIT', 'Profit'),
            ('REFERRAL_BONUS', 'Referral Bonus'),
            ('ADMIN_ADJUSTMENT', 'Admin Adjustment'),
            ('CURRENCY_CONVERSION', 'Currency Conversion'),
            ('FEE', 'Fee')
        ]
    )
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    currency = models.CharField(max_length=10)
    fee = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    description = models.CharField(max_length=255, blank=True)
    reference_id = models.CharField(max_length=255, blank=True)   # FK to deposit/withdrawal/investment
    status = models.CharField(
        max_length=20,
        choices=[('PENDING', 'Pending'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')],
        default='COMPLETED'
    )
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.type} - {self.amount} {self.currency} for {self.user.username}"

