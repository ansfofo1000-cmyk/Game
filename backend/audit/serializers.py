from rest_framework import serializers
from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True, default='النظام / System')
    actor_role = serializers.CharField(source='actor.role', read_only=True, default='')
    target_name = serializers.CharField(source='target_user.full_name', read_only=True, default=None)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True, default=None)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'actor', 'actor_name', 'actor_role', 'action_type',
            'description_ar', 'description_en', 'target_user', 'target_name',
            'classroom', 'classroom_name', 'ip_address', 'timestamp'
        ]
