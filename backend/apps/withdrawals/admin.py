from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.html import format_html
from django.utils import timezone
from django.db import transaction
from .models import Withdrawal
from transactions.models import Transaction
from notifications.models import Notification

@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ('transaction_code', 'user', 'amount', 'currency', 'withdrawal_method', 'created_at', 'status', 'contact_support_link')
    list_filter = ('withdrawal_method', 'status', 'created_at')
    search_fields = ('transaction_code', 'user__username', 'user__email', 'address', 'account_number', 'crypto_address', 'paypal_email')
    readonly_fields = ('transaction_code', 'created_at', 'updated_at', 'confirmation_code')
    actions = ['approve_withdrawals', 'reject_withdrawals', 'mark_pending_withdrawals']

    def contact_support_link(self, obj):
        url = f"{obj.id}/contact-support/"
        return format_html('<a class="button" style="background: #0284c7; color: white; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-weight: bold;" href="{}">Contact Support</a>', url)
    contact_support_link.short_description = 'Contact Support'
    contact_support_link.allow_tags = True

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<path:object_id>/contact-support/', self.admin_site.admin_view(self.contact_support_view), name='withdrawal_contact_support'),
        ]
        return custom_urls + urls

    def contact_support_view(self, request, object_id):
        withdrawal = get_object_or_404(Withdrawal, id=object_id)

        if request.method == 'POST':
            action = request.POST.get('action')
            admin_note = request.POST.get('admin_notes', '')

            if action == 'approve':
                self.process_approval(request, withdrawal, admin_note)
            elif action == 'reject':
                self.process_rejection(request, withdrawal, admin_note)
            elif action == 'pending':
                withdrawal.status = 'PENDING'
                withdrawal.admin_notes = admin_note
                withdrawal.save()
                messages.info(request, f"Withdrawal {withdrawal.transaction_code} status set to PENDING.")

            return redirect('admin:withdrawals_withdrawal_changelist')

        context = {
            **self.admin_site.each_context(request),
            'withdrawal': withdrawal,
            'title': f"Verification & Support: {withdrawal.transaction_code}",
            'opts': self.model._meta,
        }
        return render(request, 'admin/withdrawals/contact_support.html', context)

    def process_approval(self, request, withdrawal, admin_note=""):
        if withdrawal.status == 'COMPLETED':
            messages.warning(request, f"Withdrawal {withdrawal.transaction_code} is already completed.")
            return

        with transaction.atomic():
            wallet = withdrawal.wallet
            # Deduct from locked balance
            if wallet.locked_balance >= withdrawal.amount:
                wallet.locked_balance -= withdrawal.amount
            else:
                wallet.balance = max(0, wallet.balance - withdrawal.amount)
            wallet.save()

            withdrawal.status = 'COMPLETED'
            withdrawal.processed_at = timezone.now()
            if admin_note:
                withdrawal.admin_notes = admin_note
            withdrawal.save()

            # Record completed transaction
            tx, created = Transaction.objects.get_or_create(
                reference_id=str(withdrawal.id),
                type='WITHDRAWAL',
                defaults={
                    'user': withdrawal.user,
                    'wallet': wallet,
                    'amount': withdrawal.amount,
                    'currency': withdrawal.currency,
                    'description': f"Withdrawal ({withdrawal.withdrawal_method}) - Code: {withdrawal.transaction_code}",
                    'status': 'COMPLETED'
                }
            )
            if not created and tx.status != 'COMPLETED':
                tx.status = 'COMPLETED'
                tx.save()

            # Dashboard notification
            Notification.objects.create(
                user=withdrawal.user,
                title="Withdrawal Approved",
                message=f"Your withdrawal of {withdrawal.amount} {withdrawal.currency} ({withdrawal.transaction_code}) has been approved and processed successfully."
            )

        messages.success(request, f"Withdrawal {withdrawal.transaction_code} approved successfully!")

    def process_rejection(self, request, withdrawal, admin_note=""):
        if withdrawal.status in ['REJECTED', 'COMPLETED']:
            messages.warning(request, f"Withdrawal {withdrawal.transaction_code} cannot be rejected in current state.")
            return

        with transaction.atomic():
            wallet = withdrawal.wallet
            # Refund locked balance back to available balance
            if wallet.locked_balance >= withdrawal.amount:
                wallet.locked_balance -= withdrawal.amount
                wallet.balance += withdrawal.amount
            wallet.save()

            withdrawal.status = 'REJECTED'
            withdrawal.processed_at = timezone.now()
            if admin_note:
                withdrawal.admin_notes = admin_note
            withdrawal.save()

            # Notification
            Notification.objects.create(
                user=withdrawal.user,
                title="Withdrawal Rejected",
                message=f"Your withdrawal request of {withdrawal.amount} {withdrawal.currency} ({withdrawal.transaction_code}) was rejected. Funds have been returned to your wallet balance."
            )

        messages.info(request, f"Withdrawal {withdrawal.transaction_code} rejected and funds refunded.")

    def approve_withdrawals(self, request, queryset):
        for w in queryset:
            self.process_approval(request, w)
    approve_withdrawals.short_description = "Approve selected withdrawals"

    def reject_withdrawals(self, request, queryset):
        for w in queryset:
            self.process_rejection(request, w)
    reject_withdrawals.short_description = "Reject selected withdrawals"

    def mark_pending_withdrawals(self, request, queryset):
        queryset.update(status='PENDING')
        messages.info(request, "Selected withdrawals marked as PENDING.")
    mark_pending_withdrawals.short_description = "Mark selected as Pending"
