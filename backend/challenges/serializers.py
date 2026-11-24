from rest_framework import serializers
from .models import Challenge, ChallengeParticipation

class ChallengeSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True, default='جميع الفصول / School-wide')
    classroom_name_ar = serializers.CharField(source='classroom.name_ar', read_only=True, default='جميع الفصول')
    committee_name_ar = serializers.CharField(source='committee.name_ar', read_only=True, default='عام')
    participant_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default=None)

    class Meta:
        model = Challenge
        fields = [
            'id', 'title_ar', 'title_en', 'description', 'target_points',
            'reward_points', 'reward_coins', 'classroom', 'classroom_name', 'classroom_name_ar',
            'committee', 'committee_name_ar', 'start_date', 'end_date', 'status',
            'participant_count', 'is_joined', 'is_completed', 'created_by_name', 'created_at'
        ]

    def get_participant_count(self, obj):
        return obj.participations.count()

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_student:
            return obj.participations.filter(student=request.user).exists()
        return False

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_student:
            return obj.participations.filter(student=request.user, status=ChallengeParticipation.STATUS_COMPLETED).exists()
        return False


class ChallengeParticipationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='student.student_profile.classroom.name', read_only=True, default='')

    class Meta:
        model = ChallengeParticipation
        fields = ['id', 'challenge', 'student', 'student_name', 'student_email', 'classroom_name', 'status', 'completed_at', 'reward_awarded', 'created_at']
