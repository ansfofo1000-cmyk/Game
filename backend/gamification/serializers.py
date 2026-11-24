from rest_framework import serializers
from .models import Level, Achievement, StudentAchievement
from accounts.models import StudentProfile

class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ['id', 'name_ar', 'name_en', 'min_points', 'max_points', 'icon', 'color', 'order']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'slug', 'name_ar', 'name_en', 'description_ar', 'description_en', 'icon', 'category', 'condition_type', 'condition_value', 'badge_color']


class StudentAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    awarded_by_name = serializers.CharField(source='awarded_by.full_name', read_only=True, default=None)

    class Meta:
        model = StudentAchievement
        fields = ['id', 'achievement', 'earned_at', 'manual_award', 'awarded_by_name', 'reason']
