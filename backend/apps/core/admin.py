from django.contrib import admin
from .models import PlatformSettings

@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'vip_upgrade_fee', 'wallet_network', 'conversion_fee_percent', 'enable_currency_converter', 'enable_vip_upgrade', 'enable_withdrawals')
    
    def has_add_permission(self, request):
        # Disallow creating multiple platform settings instances
        if PlatformSettings.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False
