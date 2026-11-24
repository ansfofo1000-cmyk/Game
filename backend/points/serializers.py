from rest_framework import serializers
from .models import PointsTransaction, CoinsTransaction

class PointsTransactionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='student.student_profile.classroom.name', read_only=True, default='')
    classroom_name_ar = serializers.CharField(source='student.student_profile.classroom.name_ar', read_only=True, default='')
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True, default='النظام / System')
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = PointsTransaction
        fields = [
            'id', 'student', 'student_name', 'student_email', 'classroom_name', 'classroom_name_ar',
            'amount', 'transaction_type', 'reason', 'category', 'category_display',
            'teacher', 'teacher_name', 'previous_balance', 'new_balance', 'timestamp'
        ]


class CoinsTransactionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='student.student_profile.classroom.name', read_only=True, default='')
    classroom_name_ar = serializers.CharField(source='student.student_profile.classroom.name_ar', read_only=True, default='')
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True, default='النظام / System')

    class Meta:
        model = CoinsTransaction
        fields = [
            'id', 'student', 'student_name', 'student_email', 'classroom_name', 'classroom_name_ar',
            'amount', 'transaction_type', 'reason', 'teacher', 'teacher_name',
            'previous_balance', 'new_balance', 'timestamp'
        ]
