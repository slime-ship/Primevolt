from django.contrib import admin
from .models import CompanyWallet, AdminWalletAddress, Wallet

@admin.register(CompanyWallet)
class CompanyWalletAdmin(admin.ModelAdmin):
    list_display = ('wallet_name', 'wallet_address', 'network', 'active', 'updated_at')
    list_filter = ('active', 'network')
    search_fields = ('wallet_name', 'wallet_address', 'network')
    list_editable = ('active',)

@admin.register(AdminWalletAddress)
class AdminWalletAddressAdmin(admin.ModelAdmin):
    list_display = ('currency', 'address', 'updated_at')

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'currency', 'balance', 'locked_balance', 'updated_at')
    search_fields = ('user__username', 'user__email', 'currency')
