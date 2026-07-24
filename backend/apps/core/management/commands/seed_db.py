from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import VIPLevel
from investments.models import InvestmentPlan
from admin_panel.models import Admin, WebsiteSetting
from wallets.models import AdminWalletAddress

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial VIP levels, investment plans, admins, and settings.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Seed VIP Levels
        vips = [
            {'level': 1, 'name': 'VIP Level 1', 'min_balance': 0.00, 'benefits': ['Basic Support', 'Standard Withdrawals']},
            {'level': 2, 'name': 'VIP Level 2', 'min_balance': 1000.00, 'benefits': ['Priority Support', 'Reduced Fees', 'Fast Processing']},
            {'level': 3, 'name': 'VIP Level 3 VIP', 'min_balance': 10000.00, 'benefits': ['Personal Manager', 'Zero Fees', 'Instant Processing']},
        ]
        for v in vips:
            vip, created = VIPLevel.objects.update_or_create(
                level=v['level'],
                defaults={
                    'name': v['name'],
                    'min_balance': v['min_balance'],
                    'benefits': v['benefits']
                }
            )
            if created:
                self.stdout.write(f'Created VIP Level: {vip.name}')

        # 2. Seed Investment Plans
        plans = [
            {
                'name': 'Starter Plan',
                'min_deposit': 100.00,
                'max_deposit': 999.00,
                'daily_profit_percent': 0.50,
                'duration_days': 30,
                'compounding': False
            },
            {
                'name': 'Premium Plan',
                'min_deposit': 1000.00,
                'max_deposit': 9999.00,
                'daily_profit_percent': 1.20,
                'duration_days': 90,
                'compounding': True
            },
            {
                'name': 'Gold VIP Plan',
                'min_deposit': 10000.00,
                'max_deposit': 100000.00,
                'daily_profit_percent': 2.50,
                'duration_days': 180,
                'compounding': True
            },
        ]
        for p in plans:
            plan, created = InvestmentPlan.objects.update_or_create(
                name=p['name'],
                defaults=p
            )
            if created:
                self.stdout.write(f'Created Investment Plan: {plan.name}')

        # 3. Seed Django Superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@admin.com',
                password='admin123',
                full_name='System Admin'
            )
            self.stdout.write('Created Django Superuser (admin/admin123)')

        if not User.objects.filter(username='coderblack').exists():
            User.objects.create_superuser(
                username='coderblack',
                email='coderblack@admin.com',
                password='coderblack',
                full_name='coderblack'
            )
            self.stdout.write('Created Django Superuser (coderblack/coderblack)')

        # 4. Seed Custom Admin Panel instance
        admin_instance, created = Admin.objects.get_or_create(
            email='admin@admin.com',
            defaults={
                'full_name': 'Super Admin',
                'role': 'SUPER_ADMIN',
                'permissions': ['manage_users', 'manage_deposits', 'manage_withdrawals', 'manage_kyc'],
                'is_active': True
            }
        )
        if created:
            admin_instance.set_password('admin123')
            admin_instance.save()
            self.stdout.write('Created custom Admin user (admin@admin.com/admin123)')

        coderblack_admin, created = Admin.objects.get_or_create(
            email='coderblack@admin.com',
            defaults={
                'full_name': 'coderblack',
                'role': 'SUPER_ADMIN',
                'permissions': ['manage_users', 'manage_deposits', 'manage_withdrawals', 'manage_kyc'],
                'is_active': True
            }
        )
        if created:
            coderblack_admin.set_password('coderblack')
            coderblack_admin.save()
            self.stdout.write('Created coderblack Admin user (coderblack@admin.com/coderblack)')

        # 5. Seed general website settings
        settings = [
            {'key': 'company_name', 'value': 'PrimeVolt', 'category': 'general', 'description': 'Name of the website'},
            {'key': 'support_email', 'value': 'support@primevolt.com', 'category': 'general', 'description': 'Public support email'},
            {'key': 'min_withdrawal_limit', 'value': 10.00, 'category': 'security', 'description': 'Minimum withdrawal allowed'},
            {'key': 'max_withdrawal_limit', 'value': 50000.00, 'category': 'security', 'description': 'Maximum withdrawal allowed per transaction'},
        ]
        for s in settings:
            setting, created = WebsiteSetting.objects.update_or_create(
                key=s['key'],
                defaults=s
            )
            if created:
                self.stdout.write(f'Created Website Setting: {setting.key}')

        # 6. Seed initial Admin Wallet Addresses
        default_addresses = [
            {'currency': 'BTC', 'address': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'},
            {'currency': 'ETH', 'address': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'},
            {'currency': 'USDT', 'address': '0xdac17f958d2ee523a2206206994597c13d831ec7'},
        ]
        for da in default_addresses:
            addr, created = AdminWalletAddress.objects.get_or_create(
                currency=da['currency'],
                defaults={'address': da['address']}
            )
            if created:
                self.stdout.write(f'Created Default Admin Wallet Address: {addr.currency} -> {addr.address}')

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
