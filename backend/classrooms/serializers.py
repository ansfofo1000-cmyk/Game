from rest_framework import serializers
from .models import Classroom, Position, Committee, PositionRequest
from accounts.models import StudentProfile

class ClassroomSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    total_points = serializers.SerializerMethodField()
    total_coins = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = ['id', 'name', 'name_ar', 'description', 'student_count', 'teacher_count', 'total_points', 'total_coins', 'created_at']

    def get_student_count(self, obj):
        return obj.students.count()

    def get_teacher_count(self, obj):
        return obj.teachers.count()

    def get_total_points(self, obj):
        return sum(obj.students.values_list('points', flat=True)) or 0

    def get_total_coins(self, obj):
        return sum(obj.students.values_list('coins', flat=True)) or 0


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = ['id', 'name_ar', 'name_en', 'description', 'responsibilities', 'is_exclusive', 'requires_committee']


class CommitteeSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Committee
        fields = ['id', 'name_ar', 'name_en', 'description', 'responsibilities', 'student_count']

    def get_student_count(self, obj):
        return obj.active_students.count()


class PositionRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_name_ar = serializers.CharField(source='classroom.name_ar', read_only=True)
    position_name_ar = serializers.CharField(source='position.name_ar', read_only=True)
    position_name_en = serializers.CharField(source='position.name_en', read_only=True)
    committee_name_ar = serializers.CharField(source='committee.name_ar', read_only=True, default=None)
    committee_name_en = serializers.CharField(source='committee.name_en', read_only=True, default=None)
    reviewer_name = serializers.CharField(source='reviewed_by.full_name', read_only=True, default=None)

    class Meta:
        model = PositionRequest
        fields = [
            'id', 'student', 'student_name', 'student_email', 'classroom',
            'classroom_name', 'classroom_name_ar', 'position', 'position_name_ar',
            'position_name_en', 'committee', 'committee_name_ar', 'committee_name_en',
            'status', 'notes', 'reviewed_by', 'reviewer_name', 'reviewed_at', 'created_at'
        ]
