from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import InvestmentPlan, Investment
from .serializers import InvestmentPlanSerializer, InvestmentSerializer
from wallets.models import Wallet
from transactions.models import Transaction

class InvestmentPlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvestmentPlanSerializer
    queryset = InvestmentPlan.objects.filter(is_active=True)
    permission_classes = [permissions.AllowAny]

class InvestmentViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .utils import process_matured_investments_for_user
        if self.request.user and self.request.user.is_authenticated:
            process_matured_investments_for_user(self.request.user)
        return Investment.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='reinvest')
    def toggle_reinvest(self, request, pk=None):
        investment = self.get_object()
        investment.auto_reinvest = not investment.auto_reinvest
        investment.save()
        return Response({
            'status': 'success',
            'auto_reinvest': investment.auto_reinvest,
            'message': f"Auto reinvestment {'enabled' if investment.auto_reinvest else 'disabled'}."
        })

    @action(detail=True, methods=['post'], url_path='withdraw-profit')
    def withdraw_profit(self, request, pk=None):
        investment = self.get_object()
        profit = investment.profit_accrued

        if profit <= 0:
            return Response({'error': 'No accrued profit available to withdraw.'}, status=status.HTTP_400_BAD_REQUEST)

        wallet, _ = Wallet.objects.get_or_create(user=request.user, currency=investment.currency)

        with transaction.atomic():
            # Add to wallet
            wallet.balance += profit
            wallet.save()

            # Record ledger
            Transaction.objects.create(
                user=request.user,
                wallet=wallet,
                type='PROFIT',
                amount=profit,
                currency=investment.currency,
                description=f"Withdrew profit from {investment.plan.name} investment #{investment.id}",
                reference_id=str(investment.id)
            )

            # Reset accrued profit
            investment.profit_accrued = 0
            investment.save()

        return Response({
            'status': 'success',
            'withdrawn_amount': float(profit),
            'message': f"Successfully withdrew {profit} {investment.currency} to your wallet."
        })
