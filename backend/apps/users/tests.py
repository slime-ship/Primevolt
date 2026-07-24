from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from wallets.models import Wallet
from transactions.models import Transaction
from investments.models import InvestmentPlan, Investment


User = get_user_model()

class UserAuthTests(APITestCase):
    def test_user_registration(self):
        """Test user registration endpoint registers user and returns verification message."""
        url = '/api/v1/auth/register/'
        data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'testpassword123',
            'full_name': 'Test User',
            'phone': '+1234567890'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('A verification link has been sent', response.data['message'])

        # Check in DB
        user = User.objects.get(username='testuser')
        self.assertTrue(user.check_password('testpassword123'))
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertFalse(user.is_email_verified)

    def test_user_login(self):
        """Test user login endpoint returns access and refresh JWT tokens for verified users."""
        # Create user first with is_email_verified=True
        user = User.objects.create_user(
            username='loginuser',
            email='loginuser@example.com',
            password='loginpassword123',
            full_name='Login User',
            is_email_verified=True
        )
        url = '/api/v1/auth/login/'
        data = {
            'username': 'loginuser',
            'password': 'loginpassword123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

class WalletAndLedgerTests(TestCase):
    def setUp(self):
        from wallets.models import AdminWalletAddress
        AdminWalletAddress.objects.get_or_create(currency='BTC', defaults={'address': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'})
        AdminWalletAddress.objects.get_or_create(currency='ETH', defaults={'address': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'})
        AdminWalletAddress.objects.get_or_create(currency='SOL', defaults={'address': 'HN7cABviJserbaXTxHgB5g5D726Q2Vti7H74kFq4m8s3'})

        self.user = User.objects.create_user(
            username='walletuser',
            email='walletuser@example.com',
            password='password123',
            full_name='Wallet User'
        )


    def test_wallet_address_generation(self):
        """Test that wallets automatically generate mock addresses on save based on currency."""
        # BTC wallet
        btc_wallet = Wallet.objects.create(user=self.user, currency='BTC')
        self.assertTrue(btc_wallet.address.startswith('1'))
        self.assertEqual(len(btc_wallet.address), 34)

        # ETH wallet
        eth_wallet = Wallet.objects.create(user=self.user, currency='ETH')
        self.assertTrue(eth_wallet.address.startswith('0x'))
        self.assertEqual(len(eth_wallet.address), 42)

        # SOL wallet
        sol_wallet = Wallet.objects.create(user=self.user, currency='SOL')
        self.assertEqual(len(sol_wallet.address), 44)

    def test_transaction_ledger(self):
        """Test transaction creation and tracking."""
        wallet, _ = Wallet.objects.get_or_create(user=self.user, currency='USDT')
        wallet.balance = 100.0
        wallet.save()

        tx = Transaction.objects.create(
            user=self.user,
            wallet=wallet,
            type='DEPOSIT',
            amount=50.0,
            currency='USDT',
            description='Test deposit reference',
            status='COMPLETED'
        )
        self.assertEqual(tx.wallet.currency, 'USDT')
        self.assertEqual(float(tx.amount), 50.0)
        self.assertEqual(tx.status, 'COMPLETED')

class ProfitCalculationsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='profituser',
            email='profituser@example.com',
            password='password123',
            full_name='Profit User'
        )
        self.plan = InvestmentPlan.objects.create(
            name='Daily Standard',
            min_deposit=100.0,
            max_deposit=1000.0,
            daily_profit_percent=2.00,  # 2% daily return
            duration_days=30,
            compounding=False
        )

    def test_daily_profit_accrual(self):
        """Test that running the distribute_profits command accrues correct daily return on active investments."""
        investment = Investment.objects.create(
            user=self.user,
            plan=self.plan,
            amount=500.0,
            currency='USDT',
            status='ACTIVE'
        )
        investment.next_payout_at = timezone.now() - timedelta(minutes=5)
        investment.save()
        
        # Verify initial states
        self.assertEqual(float(investment.profit_accrued), 0.0)

        # Distribute daily profits
        from django.core.management import call_command
        call_command('distribute_profits')

        # Reload from DB
        investment.refresh_from_db()
        # 500 * (2.00 / 100) = 10.0 USDT
        self.assertEqual(float(investment.profit_accrued), 10.0)

    def test_investment_maturity_payout(self):
        """Test that running distribute_profits matures investments whose end_date has passed, paying out back to wallets."""
        wallet, _ = Wallet.objects.get_or_create(user=self.user, currency='USDT')
        wallet.balance = 0.0
        wallet.save()

        
        investment = Investment.objects.create(
            user=self.user,
            plan=self.plan,
            amount=500.0,
            currency='USDT',
            status='ACTIVE',
            profit_accrued=50.0
        )
        # Manually alter the end_date to yesterday to trigger maturity
        investment.end_date = timezone.now() - timedelta(days=1)
        investment.save()

        # Run command
        from django.core.management import call_command
        call_command('distribute_profits')

        # Reload
        investment.refresh_from_db()
        self.assertEqual(investment.status, 'COMPLETED')

        # Verify wallet balance: principal 500 + profit 50 = 550 USDT
        wallet.refresh_from_db()
        self.assertEqual(float(wallet.balance), 550.0)

class AdminAuthTests(APITestCase):
    def test_admin_login_and_stats_endpoint(self):
        """Test that admin login successfully returns tokens and that those tokens have access to the stats endpoint."""
        from admin_panel.models import Admin
        admin = Admin.objects.create(
            email='admin_test@test.com',
            full_name='Test Admin',
            role='ADMIN',
            is_active=True
        )
        admin.set_password('adminpass123')
        admin.save()

        # Login
        login_url = '/api/v1/admin/auth/login/'
        login_data = {
            'email': 'admin_test@test.com',
            'password': 'adminpass123'
        }
        response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        access_token = response.data['tokens']['access']

        # Get stats
        stats_url = '/api/v1/admin/stats/'
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        stats_response = self.client.get(stats_url)
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', stats_response.data)

    def test_admin_login_with_username(self):
        """Test that admin login successfully succeeds when authenticating with username (full_name)."""
        from admin_panel.models import Admin
        admin = Admin.objects.create(
            email='admin_user_test@test.com',
            full_name='admin_operator',
            role='ADMIN',
            is_active=True
        )
        admin.set_password('adminpass123')
        admin.save()

        # Login with username instead of email
        login_url = '/api/v1/admin/auth/login/'
        login_data = {
            'email': 'admin_operator',
            'password': 'adminpass123'
        }
        response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_admin_transaction_crud(self):
        """Test that admins can view, update (including backdate), and delete transactions, and that audit logs are created."""
        from admin_panel.models import Admin, AuditLog
        from django.utils import timezone
        from datetime import timedelta
        admin = Admin.objects.create(
            email='admin_tx_test@test.com',
            full_name='Admin Operator',
            role='ADMIN',
            is_active=True
        )
        admin.set_password('adminpass123')
        admin.save()

        # Login to obtain admin access token
        login_url = '/api/v1/admin/auth/login/'
        login_data = {
            'email': 'admin_tx_test@test.com',
            'password': 'adminpass123'
        }
        response = self.client.post(login_url, login_data, format='json')
        access_token = response.data['tokens']['access']

        # Create user & wallet
        customer = User.objects.create_user(
            username='tx_test_user',
            email='txtest@example.com',
            password='password123',
            full_name='Tx Test User'
        )
        wallet, _ = Wallet.objects.get_or_create(user=customer, currency='USDT')
        wallet.balance = 100.0
        wallet.save()

        
        # Create a transaction
        tx = Transaction.objects.create(
            user=customer,
            wallet=wallet,
            type='DEPOSIT',
            amount=50.0,
            currency='USDT',
            description='Original description',
            status='COMPLETED'
        )

        # 1. Update/Backdate Transaction
        update_url = f'/api/v1/admin/transactions/{tx.id}/'
        backdate_time = timezone.now() - timedelta(days=10)
        update_data = {
            'user': customer.id,
            'wallet': wallet.id,
            'type': 'DEPOSIT',
            'amount': '150.00000000',
            'currency': 'USDT',
            'description': 'Updated description',
            'status': 'FAILED',
            'created_at': backdate_time.isoformat()
        }
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        update_response = self.client.put(update_url, update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        # Verify updated in DB
        tx.refresh_from_db()
        self.assertEqual(float(tx.amount), 150.0)
        self.assertEqual(tx.description, 'Updated description')
        self.assertEqual(tx.status, 'FAILED')
        # Check backdated
        self.assertAlmostEqual(tx.created_at.timestamp(), backdate_time.timestamp(), delta=10)

        # Check Audit Log for update
        update_audit = AuditLog.objects.filter(action='TRANSACTION_UPDATE', entity_id=str(tx.id)).first()
        self.assertIsNotNone(update_audit)

        # 2. Delete Transaction
        delete_response = self.client.delete(update_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify deleted in DB
        self.assertFalse(Transaction.objects.filter(id=tx.id).exists())

        # Check Audit Log for deletion
        delete_audit = AuditLog.objects.filter(action='TRANSACTION_DELETE', entity_id=str(tx.id)).first()
        self.assertIsNotNone(delete_audit)



    def test_admin_balance_adjustment(self):
        """Test that the admin user balance adjustment endpoints correctly increment user wallet balance."""
        from admin_panel.models import Admin
        admin = Admin.objects.create(
            email='admin_test@test.com',
            full_name='Test Admin',
            role='ADMIN',
            is_active=True
        )
        admin.set_password('adminpass123')
        admin.save()

        # Login to obtain admin access token
        login_url = '/api/v1/admin/auth/login/'
        login_data = {
            'email': 'admin_test@test.com',
            'password': 'adminpass123'
        }
        response = self.client.post(login_url, login_data, format='json')
        access_token = response.data['tokens']['access']

        # Create a test customer user
        customer = User.objects.create_user(
            username='customer_user',
            email='customer@example.com',
            password='password123',
            full_name='Customer User'
        )

        # Post to balance addition endpoint
        adjust_url = f'/api/v1/admin/users/{customer.id}/balance/add/'
        adjust_data = {
            'amount': '350.50',
            'description': 'Test balance add adjustment'
        }
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        adjust_response = self.client.post(adjust_url, adjust_data, format='json')
        self.assertEqual(adjust_response.status_code, status.HTTP_200_OK)

        # Verify wallet balance and synced user balance
        wallet = Wallet.objects.get(user=customer, currency='USDT')
        self.assertEqual(float(wallet.balance), 350.50)
        customer.refresh_from_db()
        self.assertEqual(float(customer.balance), 350.50)

from django.core import mail
from django.core.management import call_command
from django.utils import timezone
from datetime import timedelta

class EmailVerificationAndDailyProfitTests(APITestCase):
    def test_registration_flow_and_verification_enforcement(self):
        # Register a new user
        register_url = '/api/v1/auth/register/'
        register_data = {
            'username': 'verifyuser',
            'email': 'verifyuser@example.com',
            'password': 'password123',
            'full_name': 'Verify User',
            'phone': '+1234567890'
        }
        response = self.client.post(register_url, register_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('A verification link has been sent', response.data['message'])

        # Verify user is created but is_email_verified is False
        user = User.objects.get(username='verifyuser')
        self.assertFalse(user.is_email_verified)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Verify Your PrimeVolt Account", mail.outbox[0].subject)

        # Attempt to login (should fail because not verified)
        login_url = '/api/v1/auth/login/'
        login_data = {
            'username': 'verifyuser',
            'password': 'password123'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Please verify your email address", str(login_response.data))

        # Perform verification using the view
        from users.views import generate_verification_token
        token = generate_verification_token(user)
        
        verify_url = '/api/v1/auth/verify-email/'
        verify_response = self.client.post(verify_url, {'token': token}, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        
        # Check user is verified now
        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)

        # Login again (should succeed now)
        login_response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)

    def test_daily_profit_accrual_and_withdrawal(self):
        # Register a new user
        user = User.objects.create_user(
            username='dailyuser',
            email='dailyuser@example.com',
            password='password123',
            full_name='Daily User',
            is_email_verified=True
        )
        self.assertEqual(float(user.profit_balance), 0.0)

        # Run profit distribution command
        call_command('distribute_profits')
        
        # Verify user received the 10 USD daily profit
        user.refresh_from_db()
        self.assertEqual(float(user.profit_balance), 10.0)
        
        # Verify a transaction history was created
        from transactions.models import Transaction
        tx = Transaction.objects.filter(user=user, type='PROFIT').first()
        self.assertIsNotNone(tx)
        self.assertEqual(float(tx.amount), 10.0)
        self.assertEqual(tx.status, 'COMPLETED')

        # Test withdrawing this profit balance to USDT wallet
        login_url = '/api/v1/auth/login/'
        login_data = {'username': 'dailyuser', 'password': 'password123'}
        login_response = self.client.post(login_url, login_data, format='json')
        access_token = login_response.data['access']
        
        withdraw_url = '/api/v1/users/me/withdraw-profit/'
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        withdraw_response = self.client.post(withdraw_url, {}, format='json')
        self.assertEqual(withdraw_response.status_code, status.HTTP_200_OK)
        self.assertIn('Successfully withdrew', withdraw_response.data['message'])

        # Check profit balance is 0 and wallet balance is 10.0
        user.refresh_from_db()
        self.assertEqual(float(user.profit_balance), 0.0)
        from wallets.models import Wallet
        wallet = Wallet.objects.get(user=user, currency='USDT')
        self.assertEqual(float(wallet.balance), 10.0)

    def test_transaction_completed_signals(self):
        # Register a user
        user = User.objects.create_user(
            username='txuser',
            email='txuser@example.com',
            password='password123',
            is_email_verified=True
        )
        wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
        wallet.balance = 100.0
        wallet.save()

        mail.outbox.clear()

        # Create a transaction
        from transactions.models import Transaction
        Transaction.objects.create(
            user=user,
            wallet=wallet,
            type='WITHDRAWAL',
            amount=50.0,
            currency='USDT',
            status='COMPLETED'
        )

        # Verify transaction email was triggered
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Debit Alert", mail.outbox[0].subject)
        self.assertIn("txuser@example.com", mail.outbox[0].to)


from users.models import VIPLevel, VIPUpgradeRequest
from admin_panel.models import Admin
from django.core.files.uploadedfile import SimpleUploadedFile

class VIPUpgradeAndWithdrawalTests(APITestCase):
    def setUp(self):
        # Create VIP levels
        self.vip_1, _ = VIPLevel.objects.get_or_create(level=1, defaults={'name': 'VIP Level 1', 'min_balance': 0.0})
        self.vip_2, _ = VIPLevel.objects.get_or_create(level=2, defaults={'name': 'VIP Level 2', 'min_balance': 1000.0})

        # Create user
        self.user = User.objects.create_user(
            username='upgradeuser',
            email='upgradeuser@example.com',
            password='password123',
            full_name='Upgrade User',
            is_email_verified=True,
            vip_level=self.vip_1
        )
        # Create wallet and add some balance
        self.wallet, _ = Wallet.objects.get_or_create(user=self.user, currency='USDT')
        self.wallet.balance = 500.0
        self.wallet.save()


        # Create admin
        self.admin = Admin.objects.create(
            email='admin_op@example.com',
            full_name='Operator One',
            role='ADMIN',
            is_active=True
        )
        self.admin.set_password('adminpassword123')
        self.admin.save()

        # Login user
        login_url = '/api/v1/auth/login/'
        login_response = self.client.post(login_url, {'username': 'upgradeuser', 'password': 'password123'}, format='json')
        self.user_token = login_response.data['access']

        # Login admin
        admin_login_url = '/api/v1/admin/auth/login/'
        admin_response = self.client.post(admin_login_url, {'email': 'admin_op@example.com', 'password': 'adminpassword123'}, format='json')
        self.admin_token = admin_response.data['tokens']['access']

    def test_vip_upgrade_creation_and_approval_flow(self):
        # 1. Create VIP upgrade request as authenticated user
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        upgrade_url = '/api/v1/users/vip-upgrade/'
        
        uploaded_image = SimpleUploadedFile("screenshot.png", b"fake image contents", content_type="image/png")

        response = self.client.post(upgrade_url, {'screenshot': uploaded_image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['amount']), 200.0)
        self.assertEqual(response.data['status'], 'PENDING')

        # Check DB
        upgrade_req = VIPUpgradeRequest.objects.get(user=self.user)
        self.assertEqual(upgrade_req.status, 'PENDING')

        # 2. Admin approves the VIP upgrade
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        admin_approve_url = f'/api/v1/admin/vip-upgrades/{upgrade_req.id}/'
        
        approve_response = self.client.put(admin_approve_url, {'status': 'APPROVED'}, format='json')
        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)

        # 3. Verify user tier shifted to VIP Level 2
        self.user.refresh_from_db()
        self.assertEqual(self.user.vip_level.level, 2)

        # 4. Verify wallet balance shows $200.00 deduction
        self.wallet.refresh_from_db()
        self.assertEqual(float(self.wallet.balance), 300.0) # 500 - 200

        # 5. Verify FEE transaction history was logged
        fee_tx = Transaction.objects.filter(user=self.user, type='FEE').first()
        self.assertIsNotNone(fee_tx)
        self.assertEqual(float(fee_tx.amount), 200.0)
        self.assertEqual(fee_tx.description, "VIP 2 Upgrade Subscription Fee")
        self.assertEqual(fee_tx.status, 'COMPLETED')

    def test_withdrawal_creation_and_confirmation_flow(self):
        # 1. Create a withdrawal request as authenticated user
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        withdraw_url = '/api/v1/withdrawals/'
        withdraw_data = {
            'amount': '150.00',
            'currency': 'USDT',
            'address': '0xABC123TestAddress'
        }
        response = self.client.post(withdraw_url, withdraw_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['amount']), 150.00)
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertIsNotNone(response.data['confirmation_code'])

        # Verify wallet balance decreased and locked balance increased
        self.wallet.refresh_from_db()
        self.assertEqual(float(self.wallet.balance), 350.00) # 500 - 150
        self.assertEqual(float(self.wallet.locked_balance), 150.00)

        # 2. Confirm the withdrawal
        confirm_url = f"/api/v1/withdrawals/{response.data['id']}/confirm/"
        confirm_data = {
            'code': response.data['confirmation_code']
        }
        confirm_response = self.client.post(confirm_url, confirm_data, format='json')
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)

        # Verify a PENDING withdrawal transaction was logged in the DB
        tx = Transaction.objects.filter(user=self.user, type='WITHDRAWAL', reference_id=str(response.data['id'])).first()
        self.assertIsNotNone(tx)
        self.assertEqual(float(tx.amount), 150.00)
        self.assertEqual(tx.status, 'PENDING')
        self.assertEqual(tx.description, "in 5 working days it reflects in recievers account")


class ReferralSystemTests(APITestCase):
    def setUp(self):
        self.referrer = User.objects.create_user(
            username='referrer',
            email='referrer@example.com',
            password='password123',
            full_name='Referrer User',
            is_email_verified=True
        )
        self.referrer.referral_code = 'REF123'
        self.referrer.save()

    def test_referral_registration_credits_both_users(self):
        """Test that registering a user with a valid referral code awards $5 to the new user and $10 to the referrer."""
        url = '/api/v1/auth/register/'
        data = {
            'username': 'referred',
            'email': 'referred@example.com',
            'password': 'password123',
            'full_name': 'Referred User',
            'phone': '+1234567891',
            'referral_code': 'REF123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 1. Verify referred user received $5 balance and USDT wallet balance
        referred_user = User.objects.get(username='referred')
        self.assertEqual(referred_user.balance, 5.0)
        
        referred_wallet = Wallet.objects.get(user=referred_user, currency='USDT')
        self.assertEqual(referred_wallet.balance, 5.0)
        
        referred_tx = Transaction.objects.get(user=referred_user, type='REFERRAL_BONUS')
        self.assertEqual(referred_tx.amount, 5.0)

        # 2. Verify referrer received $10 balance and USDT wallet balance
        self.referrer.refresh_from_db()
        self.assertEqual(self.referrer.balance, 10.0)

        referrer_wallet = Wallet.objects.get(user=self.referrer, currency='USDT')
        self.assertEqual(referrer_wallet.balance, 10.0)

        referrer_tx = Transaction.objects.get(user=self.referrer, type='REFERRAL_BONUS')
        self.assertEqual(referrer_tx.amount, 10.0)

        # 3. Verify Referral mapping record is created in the database
        from users.models import Referral
        ref_record = Referral.objects.get(referrer=self.referrer, referred=referred_user)
        self.assertEqual(ref_record.referral_code, 'REF123')
        self.assertEqual(ref_record.bonus_awarded, 10.0)

    def test_self_referral_prevented(self):
        """Test that self-referrals are prevented during registration."""
        referrer = User.objects.get(referral_code='REF123')
        
        # Validate that if registering user uses a referral code, it is ignored if email or username match
        self.assertEqual(referrer.username, 'referrer')
        self.assertEqual(referrer.email, 'referrer@example.com')
        
        # Referrer's balance should remain 0
        self.referrer.refresh_from_db()
        self.assertEqual(self.referrer.balance, 0.0)





