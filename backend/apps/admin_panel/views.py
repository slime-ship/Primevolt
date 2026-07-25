import pyotp
from decimal import Decimal
from rest_framework import status, views, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action, authentication_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.db.models import Sum

from .models import Admin, AuditLog, WebsiteSetting
from .serializers import AdminSerializer, AdminLoginSerializer, AuditLogSerializer, WebsiteSettingSerializer
from .permissions import IsAdminUserToken

from users.models import VIPLevel, VIPUpgradeRequest
from users.serializers import UserSerializer, VIPUpgradeRequestSerializer, AdminUserSerializer
from wallets.models import Wallet
from deposits.models import Deposit
from deposits.serializers import DepositSerializer
from withdrawals.models import Withdrawal
from withdrawals.serializers import WithdrawalSerializer
from kyc.models import KYCDocument
from kyc.serializers import KYCDocumentSerializer
from investments.models import InvestmentPlan, Investment
from investments.serializers import InvestmentPlanSerializer, AdminInvestmentSerializer
from notifications.models import Notification
from transactions.models import Transaction
from transactions.serializers import TransactionSerializer


User = get_user_model()

def get_tokens_for_admin(admin):
    refresh = RefreshToken()
    refresh['admin_id'] = admin.id
    refresh['email'] = admin.email
    refresh['role'] = admin.role
    refresh['is_admin'] = True
    
    # Explicitly set claims on access token
    access = refresh.access_token
    access['admin_id'] = admin.id
    access['email'] = admin.email
    access['role'] = admin.role
    access['is_admin'] = True
    
    return {
        'refresh': str(refresh),
        'access': str(access),
    }

@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def admin_login(request):
    serializer = AdminLoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        from django.db.models import Q
        
        # 1. Check Admin model first
        try:
            admin = Admin.objects.get(Q(email__iexact=email) | Q(full_name__iexact=email), is_active=True)
            if admin.check_password(password):
                admin.last_login_at = timezone.now()
                admin.save()
                tokens = get_tokens_for_admin(admin)
                return Response({
                    'admin': AdminSerializer(admin).data,
                    'tokens': tokens
                })
        except Admin.DoesNotExist:
            pass

        # 2. Check Django User model (is_staff=True or is_superuser=True)
        django_user = User.objects.filter(
            Q(username__iexact=email) | Q(email__iexact=email),
            Q(is_staff=True) | Q(is_superuser=True),
            is_active=True
        ).first()

        if django_user and django_user.check_password(password):
            admin_email = django_user.email or f"{django_user.username}@primevolt.com"
            admin, created = Admin.objects.get_or_create(
                email=admin_email,
                defaults={
                    'full_name': django_user.full_name or django_user.username,
                    'role': 'SUPER_ADMIN' if django_user.is_superuser else 'ADMIN',
                    'is_active': True
                }
            )
            admin.set_password(password)
            admin.last_login_at = timezone.now()
            admin.save()
            tokens = get_tokens_for_admin(admin)
            return Response({
                'admin': AdminSerializer(admin).data,
                'tokens': tokens
            })

        return Response({'error': 'Invalid administrative credentials.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminDashboardStatsView(views.APIView):
    authentication_classes = ()
    permission_classes = [IsAdminUserToken]

    def get(self, request):
        total_users = User.objects.count()
        total_deposits_confirmed = Deposit.objects.filter(status='CONFIRMED').aggregate(Sum('amount'))['amount__sum'] or 0
        total_withdrawals_completed = Withdrawal.objects.filter(status='COMPLETED').aggregate(Sum('amount'))['amount__sum'] or 0
        pending_kyc_count = KYCDocument.objects.filter(status='PENDING').count()
        pending_deposits_count = Deposit.objects.filter(status='PENDING').count()
        pending_withdrawals_count = Withdrawal.objects.filter(status='PENDING').count()

        from support.models import SupportTicket
        pending_tickets_count = SupportTicket.objects.filter(status__in=['OPEN', 'IN_PROGRESS']).count()

        return Response({
            'total_users': total_users,
            'total_deposits': float(total_deposits_confirmed),
            'total_withdrawals': float(total_withdrawals_completed),
            'pending_kyc_count': pending_kyc_count,
            'pending_deposits_count': pending_deposits_count,
            'pending_withdrawals_count': pending_withdrawals_count,
            'pending_tickets_count': pending_tickets_count,
        })

# CRUD Admins (Super Admin only)
class AdminViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminUserToken]
    queryset = Admin.objects.all()

    def get_permissions(self):
        # Additional role validation can be added here
        return super().get_permissions()

# Manage Users
class AdminUserViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUserToken]
    queryset = User.objects.all()

    def perform_update(self, serializer):
        old_user = self.get_object()
        
        # Save old values
        old_balance = old_user.balance
        old_profit_balance = old_user.profit_balance
        old_active_investment = old_user.active_investment_override
        old_profit_accrued = old_user.profit_accrued_override
        old_referral_bonus = old_user.referral_bonus_override
        
        # Save the user updates
        user = serializer.save()
        
        from transactions.models import Transaction
        from wallets.models import Wallet
        
        # 1. Available Balance
        if old_balance != user.balance:
            diff = user.balance - old_balance
            wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
            Transaction.objects.create(
                user=user,
                wallet=wallet,
                type='ADMIN_ADJUSTMENT',
                amount=diff,
                currency='USDT',
                description=f"Admin available balance adjustment: {'Incremented' if diff > 0 else 'Decremented'} from {old_balance:.2f} to {user.balance:.2f}",
                status='COMPLETED'
            )

        # 2. Daily Reward (profit_balance)
        if old_profit_balance != user.profit_balance:
            diff = user.profit_balance - old_profit_balance
            wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
            Transaction.objects.create(
                user=user,
                wallet=wallet,
                type='PROFIT' if diff > 0 else 'ADMIN_ADJUSTMENT',
                amount=diff,
                currency='USDT',
                description=f"Admin daily reward adjustment: {'Incremented' if diff > 0 else 'Decremented'} from {old_profit_balance:.2f} to {user.profit_balance:.2f}",
                status='COMPLETED'
            )

        # 3. Active Investment
        old_active_val = old_active_investment or Decimal('0.0')
        new_active_val = user.active_investment_override or Decimal('0.0')
        if old_active_val != new_active_val:
            diff = new_active_val - old_active_val
            wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
            Transaction.objects.create(
                user=user,
                wallet=wallet,
                type='INVESTMENT' if diff < 0 else 'ADMIN_ADJUSTMENT',
                amount=diff,
                currency='USDT',
                description=f"Admin active investment adjustment: {'Incremented' if diff > 0 else 'Decremented'} from {old_active_val:.2f} to {new_active_val:.2f}",
                status='COMPLETED'
            )

        # 4. Profit Accrued
        old_accrued_val = old_profit_accrued or Decimal('0.0')
        new_accrued_val = user.profit_accrued_override or Decimal('0.0')
        if old_accrued_val != new_accrued_val:
            diff = new_accrued_val - old_accrued_val
            wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
            Transaction.objects.create(
                user=user,
                wallet=wallet,
                type='PROFIT' if diff > 0 else 'ADMIN_ADJUSTMENT',
                amount=diff,
                currency='USDT',
                description=f"Admin profit accrued adjustment: {'Incremented' if diff > 0 else 'Decremented'} from {old_accrued_val:.2f} to {new_accrued_val:.2f}",
                status='COMPLETED'
            )

        # 5. Referral Bonus
        old_referral_val = old_referral_bonus or Decimal('0.0')
        new_referral_val = user.referral_bonus_override or Decimal('0.0')
        if old_referral_val != new_referral_val:
            diff = new_referral_val - old_referral_val
            wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
            Transaction.objects.create(
                user=user,
                wallet=wallet,
                type='REFERRAL_BONUS' if diff > 0 else 'ADMIN_ADJUSTMENT',
                amount=diff,
                currency='USDT',
                description=f"Admin referral bonus adjustment: {'Incremented' if diff > 0 else 'Decremented'} from {old_referral_val:.2f} to {new_referral_val:.2f}",
                status='COMPLETED'
            )

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user_id = user.id
        username = user.username
        
        # Log action
        AuditLog.objects.create(
            admin=request.admin_user,
            action='DELETE_USER',
            entity_type='User',
            entity_id=str(user_id),
            old_values={'username': username, 'email': user.email}
        )
        
        user.delete()
        return Response({'status': 'success', 'message': f"User account @{username} has been deleted successfully."})

    @action(detail=True, methods=['post'], url_path='freeze')
    def toggle_freeze(self, request, pk=None):
        user = self.get_object()
        user.is_frozen = not user.is_frozen
        user.save()
        
        # Log action
        AuditLog.objects.create(
            admin=request.admin_user,
            user=user,
            action='FREEZE_TOGGLE',
            entity_type='User',
            entity_id=str(user.id),
            new_values={'is_frozen': user.is_frozen}
        )
        return Response({'status': 'success', 'is_frozen': user.is_frozen, 'message': f"User account has been {'frozen' if user.is_frozen else 'activated'}."})

    @action(detail=True, methods=['post'], url_path='verify')
    def verify_user(self, request, pk=None):
        user = self.get_object()
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        
        AuditLog.objects.create(
            admin=request.admin_user,
            user=user,
            action='VERIFY_USER_EMAIL',
            entity_type='User',
            entity_id=str(user.id),
            new_values={'is_email_verified': True}
        )
        return Response({'status': 'success', 'message': f"User @{user.username} account has been verified by admin."})

    @action(detail=True, methods=['post'], url_path='unverify')
    def unverify_user(self, request, pk=None):
        user = self.get_object()
        user.is_email_verified = False
        user.save(update_fields=['is_email_verified'])
        
        AuditLog.objects.create(
            admin=request.admin_user,
            user=user,
            action='UNVERIFY_USER_EMAIL',
            entity_type='User',
            entity_id=str(user.id),
            new_values={'is_email_verified': False}
        )
        return Response({'status': 'success', 'message': f"User @{user.username} account has been unverified by admin."})

    @action(detail=True, methods=['post'], url_path='balance/add')
    def add_balance(self, request, pk=None):
        user = self.get_object()
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'USDT')
        
        if not amount or float(amount) <= 0:
            return Response({'error': 'Valid positive amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        amount_dec = Decimal(amount)
        wallet, _ = Wallet.objects.get_or_create(user=user, currency=currency)

        tx_type = request.data.get('type', 'ADMIN_ADJUSTMENT')
        valid_types = ['DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'PROFIT', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT', 'FEE']
        if tx_type not in valid_types:
            tx_type = 'ADMIN_ADJUSTMENT'

        description = request.data.get('description', '')
        if not description:
            description = "Admin added balance"

        with transaction.atomic():
            wallet.balance += amount_dec
            wallet.save()

            Transaction.objects.create(
                user=user,
                wallet=wallet,
                type=tx_type,
                amount=amount_dec,
                currency=currency,
                description=description,
                status='COMPLETED'
            )

            # Audit log
            AuditLog.objects.create(
                admin=request.admin_user,
                user=user,
                action='BALANCE_ADD',
                entity_type='Wallet',
                entity_id=str(wallet.id),
                new_values={'added_amount': float(amount_dec), 'new_balance': float(wallet.balance), 'type': tx_type}
            )
        
        return Response({'message': f'Successfully added {amount_dec} {currency} to user balance.'})

    @action(detail=True, methods=['post'], url_path='balance/remove')
    def remove_balance(self, request, pk=None):
        user = self.get_object()
        amount = request.data.get('amount')
        currency = request.data.get('currency', 'USDT')
        
        if not amount or float(amount) <= 0:
            return Response({'error': 'Valid positive amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        amount_dec = Decimal(amount)
        wallet, _ = Wallet.objects.get_or_create(user=user, currency=currency)

        if wallet.balance < amount_dec:
            return Response({'error': 'Insufficient balance in wallet to remove.'}, status=status.HTTP_400_BAD_REQUEST)

        tx_type = request.data.get('type', 'ADMIN_ADJUSTMENT')
        valid_types = ['DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'PROFIT', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT', 'FEE']
        if tx_type not in valid_types:
            tx_type = 'ADMIN_ADJUSTMENT'

        description = request.data.get('description', '')
        if not description:
            description = "Admin removed balance"

        if tx_type in ['WITHDRAWAL', 'INVESTMENT', 'FEE']:
            tx_amount = amount_dec
        else:
            tx_amount = -amount_dec

        with transaction.atomic():
            wallet.balance -= amount_dec
            wallet.save()

            Transaction.objects.create(
                user=user,
                wallet=wallet,
                type=tx_type,
                amount=tx_amount,
                currency=currency,
                description=description,
                status='COMPLETED'
            )


            # Audit log
            AuditLog.objects.create(
                admin=request.admin_user,
                user=user,
                action='BALANCE_REMOVE',
                entity_type='Wallet',
                entity_id=str(wallet.id),
                new_values={'removed_amount': float(amount_dec), 'new_balance': float(wallet.balance)}
            )
        
        return Response({'message': f'Successfully removed {amount_dec} {currency} from user balance.'})

# Manage Deposits
class AdminDepositViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = DepositSerializer
    permission_classes = [IsAdminUserToken]
    queryset = Deposit.objects.all().order_by('-created_at')

    def update(self, request, *args, **kwargs):
        deposit = self.get_object()
        status_val = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')

        if deposit.status != 'PENDING':
            return Response({'error': 'Deposit already processed.'}, status=status.HTTP_400_BAD_REQUEST)

        if status_val not in ('CONFIRMED', 'REJECTED'):
            return Response({'error': 'Invalid status update.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            deposit.status = status_val
            deposit.admin_notes = admin_notes
            deposit.confirmed_at = timezone.now()
            deposit.save()

            if status_val == 'CONFIRMED':
                wallet = deposit.wallet
                wallet.balance += deposit.amount
                wallet.save()

                Transaction.objects.create(
                    user=deposit.user,
                    wallet=wallet,
                    type='DEPOSIT',
                    amount=deposit.amount,
                    currency=deposit.currency,
                    description=f"Deposit confirmed by admin",
                    reference_id=str(deposit.id),
                    status='COMPLETED'
                )

                # Check and update VIP level based on user balance
                total_balance = wallet.balance # simple check for current currency
                vip_levels = VIPLevel.objects.all().order_by('-min_balance')
                for vip in vip_levels:
                    if total_balance >= vip.min_balance:
                        deposit.user.vip_level = vip
                        deposit.user.save()
                        break

            # Audit
            AuditLog.objects.create(
                admin=request.admin_user,
                user=deposit.user,
                action=f'DEPOSIT_{status_val}',
                entity_type='Deposit',
                entity_id=str(deposit.id),
                new_values={'status': status_val, 'admin_notes': admin_notes}
            )

        return Response(DepositSerializer(deposit).data)

# Manage Withdrawals
class AdminWithdrawalViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = WithdrawalSerializer
    permission_classes = [IsAdminUserToken]
    queryset = Withdrawal.objects.all().order_by('-created_at')

    def update(self, request, *args, **kwargs):
        withdrawal = self.get_object()
        status_val = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')

        # Can only update from pending or confirmed (in our flow, CONFIRMED means user entered 2FA code)
        if withdrawal.status not in ('PENDING', 'CONFIRMED', 'PROCESSING'):
            return Response({'error': 'Withdrawal already processed.'}, status=status.HTTP_400_BAD_REQUEST)

        if status_val not in ('COMPLETED', 'REJECTED', 'PROCESSING'):
            return Response({'error': 'Invalid status update.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            old_status = withdrawal.status
            withdrawal.status = status_val
            withdrawal.admin_notes = admin_notes
            withdrawal.approved_by = request.admin_user
            withdrawal.processed_at = timezone.now()
            withdrawal.save()

            wallet = withdrawal.wallet

            if status_val == 'COMPLETED':
                # Deduct locked balance
                wallet.locked_balance -= withdrawal.amount
                wallet.save()

                tx, created = Transaction.objects.get_or_create(
                    reference_id=str(withdrawal.id),
                    type='WITHDRAWAL',
                    defaults={
                        'user': withdrawal.user,
                        'wallet': wallet,
                        'amount': withdrawal.amount,
                        'currency': withdrawal.currency,
                        'description': 'Withdrawal completed',
                        'status': 'COMPLETED'
                    }
                )
                if not created:
                    tx.status = 'COMPLETED'
                    tx.description = 'Withdrawal completed'
                    tx.save()

            elif status_val == 'REJECTED':
                # Return locked balance to standard balance
                wallet.locked_balance -= withdrawal.amount
                wallet.balance += withdrawal.amount
                wallet.save()

                tx, created = Transaction.objects.get_or_create(
                    reference_id=str(withdrawal.id),
                    type='WITHDRAWAL',
                    defaults={
                        'user': withdrawal.user,
                        'wallet': wallet,
                        'amount': withdrawal.amount,
                        'currency': withdrawal.currency,
                        'description': 'Withdrawal rejected: refund to balance',
                        'status': 'FAILED'
                    }
                )
                if not created:
                    tx.status = 'FAILED'
                    tx.description = 'Withdrawal rejected: refund to balance'
                    tx.save()


            # Audit
            AuditLog.objects.create(
                admin=request.admin_user,
                user=withdrawal.user,
                action=f'WITHDRAWAL_{status_val}',
                entity_type='Withdrawal',
                entity_id=str(withdrawal.id),
                new_values={'status': status_val, 'admin_notes': admin_notes}
            )

        return Response(WithdrawalSerializer(withdrawal).data)

# Manage KYC
class AdminKYCViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAdminUserToken]
    queryset = KYCDocument.objects.all().order_by('-created_at')

    def update(self, request, *args, **kwargs):
        kyc_doc = self.get_object()
        status_val = request.data.get('status')
        rejection_reason = request.data.get('rejection_reason', '')

        if kyc_doc.status != 'PENDING':
            return Response({'error': 'KYC Document already processed.'}, status=status.HTTP_400_BAD_REQUEST)

        if status_val not in ('APPROVED', 'REJECTED'):
            return Response({'error': 'Invalid status update.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            kyc_doc.status = status_val
            kyc_doc.rejection_reason = rejection_reason
            kyc_doc.reviewed_by = request.admin_user
            kyc_doc.reviewed_at = timezone.now()
            kyc_doc.save()

            user = kyc_doc.user
            if status_val == 'APPROVED':
                # Map levels based on doc types
                if kyc_doc.document_type in ('ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE'):
                    user.kyc_level = 2
                    user.kyc_status = 'LEVEL_2'
                elif kyc_doc.document_type in ('SELFIE', 'SSN'):
                    user.kyc_level = 3
                    user.kyc_status = 'LEVEL_3'
                user.save()
            elif status_val == 'REJECTED':
                user.kyc_status = 'REJECTED'
                user.save()

            # Audit
            AuditLog.objects.create(
                admin=request.admin_user,
                user=user,
                action=f'KYC_{status_val}',
                entity_type='KYCDocument',
                entity_id=str(kyc_doc.id),
                new_values={'status': status_val, 'rejection_reason': rejection_reason}
            )

        return Response(KYCDocumentSerializer(kyc_doc).data)

# Manage Investment Plans CRUD
class AdminInvestmentPlanViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = InvestmentPlanSerializer
    permission_classes = [IsAdminUserToken]
    queryset = InvestmentPlan.objects.all()

# Website Settings views
class AdminWebsiteSettingsViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = WebsiteSettingSerializer
    permission_classes = [IsAdminUserToken]
    queryset = WebsiteSetting.objects.all()

# Audit Logs
class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = ()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUserToken]
    queryset = AuditLog.objects.all().order_by('-created_at')

# Send broadcast notifications
@api_view(['POST'])
@authentication_classes([])
@permission_classes([IsAdminUserToken])
def broadcast_notification(request):
    title = request.data.get('title')
    message = request.data.get('message')
    if not title or not message:
        return Response({'error': 'Title and message are required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Save a notification with user=NULL (which means broadcast)
    notification = Notification.objects.create(
        user=None,
        title=title,
        message=message
    )
    return Response({'message': 'Broadcast notification sent successfully.', 'id': notification.id})

class AdminVIPUpgradeViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = VIPUpgradeRequestSerializer
    permission_classes = [IsAdminUserToken]
    queryset = VIPUpgradeRequest.objects.all().order_by('-created_at')

    def update(self, request, *args, **kwargs):
        upgrade_req = self.get_object()
        status_val = request.data.get('status')

        if upgrade_req.status != 'PENDING':
            return Response({'error': 'This VIP upgrade request has already been processed.'}, status=status.HTTP_400_BAD_REQUEST)

        if status_val not in ('APPROVED', 'REJECTED'):
            return Response({'error': 'Invalid status update.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            upgrade_req.status = status_val
            upgrade_req.save()

            if status_val == 'APPROVED':
                user = upgrade_req.user
                
                # Upgrade VIP level of the user to level 2
                try:
                    vip_2 = VIPLevel.objects.get(level=2)
                except VIPLevel.DoesNotExist:
                    vip_2, _ = VIPLevel.objects.get_or_create(level=2, defaults={'name': 'VIP Level 2', 'min_balance': 1000.0})
                
                user.vip_level = vip_2
                user.save()

                # Deduct $200 from user's USDT wallet balance
                wallet, _ = Wallet.objects.get_or_create(user=user, currency='USDT')
                wallet.balance -= upgrade_req.amount
                wallet.save()

                # Create FEE transaction showing $200 reduction
                Transaction.objects.create(
                    user=user,
                    wallet=wallet,
                    type='FEE',
                    amount=upgrade_req.amount,
                    currency='USDT',
                    description="VIP 2 Upgrade Subscription Fee",
                    status='COMPLETED'
                )

                # Audit
                AuditLog.objects.create(
                    admin=request.admin_user,
                    user=user,
                    action='VIP_UPGRADE_APPROVED',
                    entity_type='VIPUpgradeRequest',
                    entity_id=str(upgrade_req.id),
                    new_values={'vip_level': 2, 'fee_deducted': float(upgrade_req.amount)}
                )
            
            else:
                # Audit for rejection
                AuditLog.objects.create(
                    admin=request.admin_user,
                    user=upgrade_req.user,
                    action='VIP_UPGRADE_REJECTED',
                    entity_type='VIPUpgradeRequest',
                    entity_id=str(upgrade_req.id),
                    new_values={'status': 'REJECTED'}
                )

        return Response(VIPUpgradeRequestSerializer(upgrade_req).data)


class AdminTransactionViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminUserToken]
    queryset = Transaction.objects.all().order_by('-created_at')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = instance.user
        tx_type = instance.type
        amount = instance.amount
        
        # Log action
        AuditLog.objects.create(
            admin=request.admin_user,
            user=user,
            action='TRANSACTION_DELETE',
            entity_type='Transaction',
            entity_id=str(instance.id),
            new_values={'type': tx_type, 'amount': float(amount)}
        )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().update(request, *args, **kwargs)
        
        # Log action
        AuditLog.objects.create(
            admin=request.admin_user,
            user=instance.user,
            action='TRANSACTION_UPDATE',
            entity_type='Transaction',
            entity_id=str(instance.id),
            new_values=request.data
        )
        return response

class AdminInvestmentViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    serializer_class = AdminInvestmentSerializer
    permission_classes = [IsAdminUserToken]
    queryset = Investment.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='pause')
    def pause_investment(self, request, pk=None):
        inv = self.get_object()
        old_val = inv.is_paused
        inv.is_paused = True
        inv.status = 'PAUSED'
        inv.save()
        
        AuditLog.objects.create(
            admin=request.admin_user,
            user=inv.user,
            action='PAUSE_INVESTMENT',
            entity_type='Investment',
            entity_id=str(inv.id),
            old_values={'is_paused': old_val, 'status': 'ACTIVE'},
            new_values={'is_paused': True, 'status': 'PAUSED'}
        )
        return Response({'message': 'Investment paused successfully.'})

    @action(detail=True, methods=['post'], url_path='resume')
    def resume_investment(self, request, pk=None):
        inv = self.get_object()
        old_val = inv.is_paused
        inv.is_paused = False
        inv.status = 'ACTIVE'
        inv.next_payout_at = timezone.now()
        inv.save()

        AuditLog.objects.create(
            admin=request.admin_user,
            user=inv.user,
            action='RESUME_INVESTMENT',
            entity_type='Investment',
            entity_id=str(inv.id),
            old_values={'is_paused': old_val, 'status': 'PAUSED'},
            new_values={'is_paused': False, 'status': 'ACTIVE'}
        )
        return Response({'message': 'Investment resumed successfully.'})

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_investment(self, request, pk=None):
        inv = self.get_object()
        old_status = inv.status
        inv.status = 'CANCELLED'
        inv.is_paused = True
        inv.save()

        refund = request.data.get('refund', False)
        if refund:
            wallet, _ = Wallet.objects.get_or_create(user=inv.user, currency=inv.currency)
            wallet.balance += inv.amount
            wallet.save()
            
            Transaction.objects.create(
                user=inv.user,
                wallet=wallet,
                type='DEPOSIT',
                amount=inv.amount,
                currency=inv.currency,
                description=f"Refund principal for cancelled Investment #{inv.id}",
                reference_id=str(inv.id),
                status='COMPLETED'
            )

        AuditLog.objects.create(
            admin=request.admin_user,
            user=inv.user,
            action='CANCEL_INVESTMENT',
            entity_type='Investment',
            entity_id=str(inv.id),
            old_values={'status': old_status},
            new_values={'status': 'CANCELLED', 'refunded': refund}
        )
        return Response({'message': f"Investment cancelled successfully. Refunded: {refund}"})

    @action(detail=True, methods=['post'], url_path='trigger-payout')
    def trigger_payout(self, request, pk=None):
        inv = self.get_object()
        payout_amount = request.data.get('amount', None)
        if payout_amount is not None:
            try:
                payout_amount = Decimal(str(payout_amount))
            except Exception:
                return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            payout_amount = inv.amount_per_payout

        with transaction.atomic():
            wallet, _ = Wallet.objects.get_or_create(user=inv.user, currency=inv.currency)
            wallet.balance += payout_amount
            wallet.save()

            Transaction.objects.create(
                user=inv.user,
                wallet=wallet,
                type='PROFIT',
                amount=payout_amount,
                currency=inv.currency,
                description=f"Manual on-demand profit credit for investment #{inv.id}",
                reference_id=str(inv.id),
                status='COMPLETED'
            )

            inv.profit_accrued += payout_amount
            inv.save()

        AuditLog.objects.create(
            admin=request.admin_user,
            user=inv.user,
            action='MANUAL_PROFIT_CREDIT',
            entity_type='Investment',
            entity_id=str(inv.id),
            new_values={'credited_amount': float(payout_amount)}
        )
        return Response({'message': f"Manually credited {payout_amount} profit to user."})

    @action(detail=False, methods=['get', 'post'], url_path='automation')
    def automation_panel(self, request):
        if request.method == 'POST':
            # Toggle global switch
            global_enabled = request.data.get('global_enabled', None)
            if global_enabled is not None:
                setting, _ = WebsiteSetting.objects.get_or_create(
                    key='global_profit_distribution_enabled',
                    defaults={'category': 'general', 'value': True}
                )
                setting.value = bool(global_enabled)
                setting.save()
                
                AuditLog.objects.create(
                    admin=request.admin_user,
                    action='TOGGLE_GLOBAL_AUTOMATION',
                    entity_type='WebsiteSetting',
                    new_values={'global_profit_distribution_enabled': setting.value}
                )

            # Toggle user level automation
            user_id = request.data.get('user_id', None)
            user_enabled = request.data.get('user_enabled', None)
            if user_id is not None and user_enabled is not None:
                user = User.objects.filter(id=user_id).first()
                if user:
                    old_val = user.is_automation_enabled
                    user.is_automation_enabled = bool(user_enabled)
                    user.save()
                    
                    AuditLog.objects.create(
                        admin=request.admin_user,
                        user=user,
                        action='TOGGLE_USER_AUTOMATION',
                        entity_type='User',
                        entity_id=str(user.id),
                        old_values={'is_automation_enabled': old_val},
                        new_values={'is_automation_enabled': user.is_automation_enabled}
                    )

            # Toggle investment level automation
            inv_id = request.data.get('investment_id', None)
            inv_enabled = request.data.get('investment_enabled', None)
            if inv_id is not None and inv_enabled is not None:
                inv = Investment.objects.filter(id=inv_id).first()
                if inv:
                    old_val = inv.is_automated
                    inv.is_automated = bool(inv_enabled)
                    inv.save()
                    
                    AuditLog.objects.create(
                        admin=request.admin_user,
                        user=inv.user,
                        action='TOGGLE_INVESTMENT_AUTOMATION',
                        entity_type='Investment',
                        entity_id=str(inv.id),
                        old_values={'is_automated': old_val},
                        new_values={'is_automated': inv.is_automated}
                    )

        global_setting = WebsiteSetting.objects.filter(key='global_profit_distribution_enabled').first()
        global_val = global_setting.value if global_setting else True

        scheduled = []
        active_invs = Investment.objects.filter(status='ACTIVE').order_by('next_payout_at')[:50]
        for a in active_invs:
            scheduled.append({
                'id': a.id,
                'username': a.user.username,
                'plan_name': a.plan.name,
                'amount': float(a.amount),
                'next_payout_at': a.next_payout_at,
                'amount_per_payout': float(a.amount_per_payout),
                'payouts_made': a.payouts_made,
                'total_payouts_expected': a.total_payouts_expected,
                'is_automated': a.is_automated,
                'is_paused': a.is_paused,
                'user_enabled': a.user.is_automation_enabled
            })

        return Response({
            'global_enabled': global_val,
            'scheduled_payouts': scheduled
        })


