from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Transaction

def is_credit_transaction(tx):
    if tx.type in ['WITHDRAWAL', 'INVESTMENT', 'FEE']:
        return False
    if tx.type == 'ADMIN_ADJUSTMENT' and tx.amount < 0:
        return False
    return True

def send_transaction_email(tx):
    user = tx.user
    is_credit = is_credit_transaction(tx)
    action_type = "Credit Alert" if is_credit else "Debit Alert"
    
    wallet_balance_str = ""
    if tx.wallet:
        try:
            tx.wallet.refresh_from_db()
            wallet_balance_str = f"Your new wallet balance is {tx.wallet.balance:.2f} {tx.currency}."
        except Exception:
            pass
        
    subject = f"{action_type}: {abs(tx.amount):.2f} {tx.currency} at PrimeVolt"
    
    message = (
        f"Dear {user.full_name or user.username},\n\n"
        f"This is a notification for a transaction on your account:\n\n"
        f"Transaction Type: {tx.type}\n"
        f"Transaction Status: {tx.status}\n"
        f"Amount: {abs(tx.amount):.2f} {tx.currency}\n"
        f"Description: {tx.description or 'N/A'}\n"
        f"Date: {tx.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if tx.created_at else 'Just now'}\n\n"
        f"{wallet_balance_str}\n\n"
        f"Thank you for choosing PrimeVolt.\n\n"
        f"Best regards,\n"
        f"The PrimeVolt Team"
    )
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception as e:
        print("Failed to send transaction email:", str(e))

@receiver(pre_save, sender=Transaction)
def track_transaction_status(sender, instance, **kwargs):
    if instance.id:
        try:
            instance._original_status = Transaction.objects.get(id=instance.id).status
        except Transaction.DoesNotExist:
            instance._original_status = None
    else:
        instance._original_status = None

@receiver(post_save, sender=Transaction)
def handle_transaction_notification(sender, instance, created, **kwargs):
    original_status = getattr(instance, '_original_status', None)
    if instance.status == 'COMPLETED' and (created or original_status != 'COMPLETED'):
        send_transaction_email(instance)
