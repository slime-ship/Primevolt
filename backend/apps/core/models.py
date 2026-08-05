from django.db import models

class PlatformSettings(models.Model):
    vip_upgrade_fee = models.DecimalField(max_digits=20, decimal_places=2, default=200.00, help_text="VIP Upgrade fee in USDT")
    company_wallet_address = models.CharField(max_length=255, default="0x71C7656EC7ab88b098defB751B7401B5f6d8976F", help_text="Default company USDT wallet address")
    wallet_network = models.CharField(max_length=50, default="ERC20", help_text="Network for company wallet (e.g. ERC20, TRC20, BEP20)")
    conversion_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=1.00, help_text="Conversion fee percentage (e.g., 1.00 for 1%)")
    enable_currency_converter = models.BooleanField(default=True, help_text="Enable or disable currency conversion on dashboard")
    enable_vip_upgrade = models.BooleanField(default=True, help_text="Enable or disable VIP upgrade submissions")
    enable_withdrawals = models.BooleanField(default=True, help_text="Enable or disable withdrawal requests")

    class Meta:
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def __str__(self):
        return "Platform Settings"

    def save(self, *args, **kwargs):
        # Enforce singleton pattern (only one instance allowed)
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
