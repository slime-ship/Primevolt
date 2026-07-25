from django.db import transaction
from django.utils import timezone
from investments.models import Investment
from wallets.models import Wallet
from transactions.models import Transaction

def process_matured_investments_for_user(user=None):
    """
    Checks active investments whose end_date or total_payouts_expected have arrived,
    and automatically moves the accrued profit + principal into the user's main wallet balance.
    """
    now = timezone.now()
    qs = Investment.objects.filter(status='ACTIVE', end_date__lte=now)
    if user:
        qs = qs.filter(user=user)

    matured_count = 0
    for inv in qs:
        with transaction.atomic():
            inv_user = inv.user
            wallet, _ = Wallet.objects.get_or_create(user=inv_user, currency=inv.currency)
            total_payout = inv.amount + inv.profit_accrued

            if inv.auto_reinvest:
                if inv.profit_accrued > 0:
                    wallet.balance += inv.profit_accrued
                    wallet.save()
                    Transaction.objects.create(
                        user=inv_user,
                        wallet=wallet,
                        type='PROFIT',
                        amount=inv.profit_accrued,
                        currency=inv.currency,
                        description=f"Accrued profit payout on maturity of Investment #{inv.id}",
                        reference_id=str(inv.id),
                        status='COMPLETED'
                    )

                inv.status = 'COMPLETED'
                inv.save()

                Investment.objects.create(
                    user=inv_user,
                    plan=inv.plan,
                    amount=inv.amount,
                    currency=inv.currency,
                    auto_reinvest=True
                )
            else:
                wallet.balance += total_payout
                wallet.save()

                # Sync user balance
                inv_user.balance = wallet.balance
                inv_user.save(update_fields=['balance'])

                if inv.profit_accrued > 0:
                    Transaction.objects.create(
                        user=inv_user,
                        wallet=wallet,
                        type='PROFIT',
                        amount=inv.profit_accrued,
                        currency=inv.currency,
                        description=f"Automated profit payout on maturity of Investment #{inv.id}",
                        reference_id=str(inv.id),
                        status='COMPLETED'
                    )
                Transaction.objects.create(
                    user=inv_user,
                    wallet=wallet,
                    type='DEPOSIT',
                    amount=inv.amount,
                    currency=inv.currency,
                    description=f"Principal returned for matured Investment #{inv.id}",
                    reference_id=str(inv.id),
                    status='COMPLETED'
                )

                inv.status = 'COMPLETED'
                inv.save()

            matured_count += 1

    return matured_count
