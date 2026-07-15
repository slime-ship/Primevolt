from rest_framework import serializers
from .models import SupportTicket, TicketMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class SupportUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']

class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = '__all__'
        read_only_fields = ['id', 'ticket', 'sender', 'is_admin', 'created_at']

    def get_sender_name(self, obj):
        if obj.is_admin:
            return "Support Specialist"
        return obj.sender.full_name if obj.sender else "User"

class SupportTicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    user_details = SupportUserSerializer(source='user', read_only=True)

    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['id', 'user', 'status', 'assigned_to', 'resolved_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        return SupportTicket.objects.create(user=user, **validated_data)
