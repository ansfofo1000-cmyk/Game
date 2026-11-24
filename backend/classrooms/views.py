from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Classroom, Position, Committee, PositionRequest
from .serializers import (
    ClassroomSerializer,
    PositionSerializer,
    CommitteeSerializer,
    PositionRequestSerializer
)
from accounts.models import User, StudentProfile
from accounts.permissions import IsTeacherOrAdmin, IsAdminUserRole
from notifications.models import Notification
from audit.models import ActivityLog

class ClassroomListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        classrooms = Classroom.objects.all().prefetch_related('students', 'teachers')
        return Response(ClassroomSerializer(classrooms, many=True).data)

    def post(self, request):
        # Admin can add new classrooms
        if not (request.user.is_authenticated and request.user.is_admin_role):
            return Response({'error': 'صلاحية غير كافية / Admin permission required'}, status=status.HTTP_403_FORBIDDEN)
        
        name = request.data.get('name')
        name_ar = request.data.get('name_ar', '')
        description = request.data.get('description', '')
        if not name:
            return Response({'error': 'اسم الفصل مطلوب / Classroom name required'}, status=status.HTTP_400_BAD_REQUEST)

        classroom, created = Classroom.objects.get_or_create(
            name=name,
            defaults={'name_ar': name_ar, 'description': description}
        )
        return Response(ClassroomSerializer(classroom).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ClassroomDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            classroom = Classroom.objects.get(pk=pk)
        except Classroom.DoesNotExist:
            return Response({'error': 'الفصل غير موجود / Classroom not found'}, status=status.HTTP_404_NOT_FOUND)

        students = StudentProfile.objects.filter(classroom=classroom).select_related(
            'user', 'approved_position', 'approved_committee'
        ).order_by('-points', '-coins', 'user__first_name', 'user__last_name', 'id')

        students_data = []
        for rank, s in enumerate(students, 1):
            students_data.append({
                'id': s.id,
                'user_id': s.user.id,
                'name': s.user.full_name or s.user.username,
                'points': s.points,
                'coins': s.coins,
                'level': s.level,
                'avatar': s.avatar,
                'position_ar': s.approved_position.name_ar if s.approved_position else None,
                'position_en': s.approved_position.name_en if s.approved_position else None,
                'committee_ar': s.approved_committee.name_ar if s.approved_committee else None,
                'rank': rank
            })

        return Response({
            'classroom': ClassroomSerializer(classroom).data,
            'students': students_data,
            'top_three': students_data[:3],
            'top_ten': students_data[:10],
        })


class PositionListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        positions = Position.objects.all()
        return Response(PositionSerializer(positions, many=True).data)


class CommitteeListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        committees = Committee.objects.all()
        return Response(CommitteeSerializer(committees, many=True).data)


class PositionRequestListView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')
        status_filter = request.query_params.get('status', 'PENDING')

        qs = PositionRequest.objects.all().select_related(
            'student', 'classroom', 'position', 'committee', 'reviewed_by'
        )

        # Teachers can only view requests from their assigned classrooms unless admin
        if not request.user.is_admin_role and hasattr(request.user, 'teacher_profile'):
            teacher_classrooms = request.user.teacher_profile.assigned_classrooms.all()
            qs = qs.filter(classroom__in=teacher_classrooms)

        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(PositionRequestSerializer(qs, many=True).data)


class PositionRequestReviewView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request, pk):
        try:
            pos_req = PositionRequest.objects.select_related('student', 'classroom', 'position', 'committee').get(pk=pk)
        except PositionRequest.DoesNotExist:
            return Response({'error': 'طلب المنصب غير موجود / Request not found'}, status=status.HTTP_404_NOT_FOUND)

        # Validate teacher classroom access
        if not request.user.is_admin_role and hasattr(request.user, 'teacher_profile'):
            assigned = request.user.teacher_profile.assigned_classrooms.all()
            if pos_req.classroom not in assigned:
                return Response({'error': 'غير مصرح لك بإدارة هذا الفصل / Unauthorized classroom'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        notes = request.data.get('notes', '')

        with transaction.atomic():
            if action == 'APPROVE':
                # Exclusive position check: if position is exclusive, clear previous holder in this classroom
                if pos_req.position.is_exclusive:
                    StudentProfile.objects.filter(
                        classroom=pos_req.classroom,
                        approved_position=pos_req.position
                    ).exclude(user=pos_req.student).update(approved_position=None)

                # Update student profile
                student_profile = pos_req.student.student_profile
                student_profile.approved_position = pos_req.position
                if pos_req.position.requires_committee and pos_req.committee:
                    student_profile.approved_committee = pos_req.committee
                student_profile.save()

                pos_req.status = 'APPROVED'
                pos_req.reviewed_by = request.user
                pos_req.reviewed_at = timezone.now()
                pos_req.notes = notes
                pos_req.save()

                # In-app notification
                pos_title = pos_req.position.name_ar
                if pos_req.committee:
                    pos_title += f" ({pos_req.committee.name_ar})"

                Notification.objects.create(
                    user=pos_req.student,
                    title_ar="تم اعتماد منصبك القيادي!",
                    title_en="Position Request Approved!",
                    message_ar=f"مبروك! تم اعتمادك رسمياً كـ {pos_title} في {pos_req.classroom.name_ar or pos_req.classroom.name}.",
                    message_en=f"Congratulations! You are officially appointed as {pos_req.position.name_en} in {pos_req.classroom.name}.",
                    notification_type=Notification.TYPE_POSITION
                )

                ActivityLog.objects.create(
                    actor=request.user,
                    action_type=ActivityLog.ACTION_POSITION_ASSIGN,
                    description_ar=f"اعتماد منصب {pos_title} للطالب {pos_req.student.full_name}",
                    description_en=f"Approved position {pos_req.position.name_en} for student {pos_req.student.full_name}",
                    target_user=pos_req.student,
                    classroom=pos_req.classroom,
                    ip_address=request.META.get('REMOTE_ADDR', '')
                )

                return Response({'message': 'تم اعتماد المنصب بنجاح / Position approved successfully'})

            elif action == 'REJECT':
                pos_req.status = 'REJECTED'
                pos_req.reviewed_by = request.user
                pos_req.reviewed_at = timezone.now()
                pos_req.notes = notes
                pos_req.save()

                Notification.objects.create(
                    user=pos_req.student,
                    title_ar="تحديث بشأن طلب المنصب",
                    title_en="Position Request Update",
                    message_ar=f"نعتذر، لم يتم قبول طلب منصب {pos_req.position.name_ar} في الوقت الحالي. يمكنك التقديم على مناصب أخرى.",
                    message_en=f"Your request for {pos_req.position.name_en} was not accepted at this time.",
                    notification_type=Notification.TYPE_POSITION
                )

                return Response({'message': 'تم رفض طلب المنصب / Position request rejected'})

            else:
                return Response({'error': 'الإجراء غير صالح / Invalid action (APPROVE or REJECT)'}, status=status.HTTP_400_BAD_REQUEST)
