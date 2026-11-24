from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'title_ar', 'title_en', 'message_ar', 'message_en',
            'notification_type', 'is_read', 'link', 'created_at'
        ]
