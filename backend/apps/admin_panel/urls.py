from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    admin_login, AdminDashboardStatsView, AdminViewSet, AdminUserViewSet,
    AdminDepositViewSet, AdminWithdrawalViewSet, AdminKYCViewSet,
    AdminInvestmentPlanViewSet, AdminWebsiteSettingsViewSet,
    AdminAuditLogViewSet, broadcast_notification, AdminVIPUpgradeViewSet,
    AdminTransactionViewSet, AdminInvestmentViewSet
)
from support.views import AdminSupportTicketViewSet

router = DefaultRouter()
router.register(r'admins', AdminViewSet, basename='admin')
router.register(r'users', AdminUserViewSet, basename='admin_user')
router.register(r'deposits', AdminDepositViewSet, basename='admin_deposit')
router.register(r'withdrawals', AdminWithdrawalViewSet, basename='admin_withdrawal')
router.register(r'kyc', AdminKYCViewSet, basename='admin_kyc')
router.register(r'plans', AdminInvestmentPlanViewSet, basename='admin_plan')
router.register(r'settings', AdminWebsiteSettingsViewSet, basename='admin_setting')
router.register(r'audit-logs', AdminAuditLogViewSet, basename='admin_auditlog')
router.register(r'vip-upgrades', AdminVIPUpgradeViewSet, basename='admin_vip_upgrade')
router.register(r'transactions', AdminTransactionViewSet, basename='admin_transaction')
router.register(r'investments', AdminInvestmentViewSet, basename='admin_investment')
router.register(r'support/tickets', AdminSupportTicketViewSet, basename='admin_support_ticket')


urlpatterns = [
    path('auth/login/', admin_login, name='admin_login'),
    path('stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('notifications/broadcast/', broadcast_notification, name='admin_broadcast'),
    path('', include(router.urls)),
]
