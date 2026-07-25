from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import SupportTicket, TicketMessage
from .serializers import SupportTicketSerializer, TicketMessageSerializer
from admin_panel.permissions import IsAdminUserToken

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='messages')
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                ticket=ticket,
                sender=request.user,
                is_admin=False
            )
            if ticket.status in ('RESOLVED', 'CLOSED'):
                ticket.status = 'IN_PROGRESS'
                ticket.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminSupportTicketViewSet(viewsets.ModelViewSet):
    authentication_classes = ()
    permission_classes = [IsAdminUserToken]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    serializer_class = SupportTicketSerializer
    queryset = SupportTicket.objects.all().order_by('-updated_at')

    @action(detail=True, methods=['post'], url_path='messages')
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                ticket=ticket,
                sender=None,
                is_admin=True
            )
            if ticket.status == 'OPEN':
                ticket.status = 'IN_PROGRESS'
                ticket.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
