from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Challenge, ChallengeParticipation
from .serializers import ChallengeSerializer, ChallengeParticipationSerializer
from accounts.models import User
from accounts.permissions import IsTeacherOrAdmin, IsStudentRole
from points.services import process_points_transaction, process_coins_transaction
from points.models import PointsTransaction, CoinsTransaction
from notifications.models import Notification
from audit.models import ActivityLog

class ChallengeListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')
        status_param = request.query_params.get('status')

        qs = Challenge.objects.all().select_related('classroom', 'committee', 'created_by')

        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if status_param:
            qs = qs.filter(status=status_param)

        serializer = ChallengeSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not (request.user.is_authenticated and (request.user.is_teacher or request.user.is_admin_role)):
            return Response({'error': 'صلاحية غير كافية لإنشاء تحدي / Teacher or Admin required'}, status=status.HTTP_403_FORBIDDEN)

        title_ar = request.data.get('title_ar')
        title_en = request.data.get('title_en', '')
        description = request.data.get('description', '')
        target_points = int(request.data.get('target_points', 50))
        reward_points = int(request.data.get('reward_points', 20))
        reward_coins = int(request.data.get('reward_coins', 5))
        classroom_id = request.data.get('classroom_id')
        committee_id = request.data.get('committee_id')
        start_date = request.data.get('start_date', timezone.now().date())
        end_date = request.data.get('end_date')

        if not title_ar or not end_date:
            return Response({'error': 'عنوان التحدي وتاريخ الانتهاء مطلوبان / Title and end_date required'}, status=status.HTTP_400_BAD_REQUEST)

        challenge = Challenge.objects.create(
            title_ar=title_ar,
            title_en=title_en or title_ar,
            description=description,
            target_points=target_points,
            reward_points=reward_points,
            reward_coins=reward_coins,
            classroom_id=classroom_id if classroom_id else None,
            committee_id=committee_id if committee_id else None,
            start_date=start_date,
            end_date=end_date,
            created_by=request.user
        )

        ActivityLog.objects.create(
            actor=request.user,
            action_type=ActivityLog.ACTION_CHALLENGE_CREATE,
            description_ar=f"إنشاء تحدي جديد: {challenge.title_ar}",
            description_en=f"Created challenge: {challenge.title_en}",
            classroom=challenge.classroom,
            ip_address=request.META.get('REMOTE_ADDR', '')
        )

        return Response(ChallengeSerializer(challenge, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ChallengeDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            challenge = Challenge.objects.select_related('classroom', 'committee', 'created_by').get(pk=pk)
        except Challenge.DoesNotExist:
            return Response({'error': 'التحدي غير موجود / Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

        participations = challenge.participations.select_related('student__student_profile__classroom').order_by('-created_at')

        return Response({
            'challenge': ChallengeSerializer(challenge, context={'request': request}).data,
            'participations': ChallengeParticipationSerializer(participations, many=True).data
        })


class JoinChallengeView(APIView):
    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        try:
            challenge = Challenge.objects.get(pk=pk)
        except Challenge.DoesNotExist:
            return Response({'error': 'التحدي غير موجود / Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

        # Classroom eligibility check
        if challenge.classroom and challenge.classroom != request.user.student_profile.classroom:
            return Response({'error': 'هذا التحدي مخصص لفصل دراسي آخر / Challenge is not open to your classroom'}, status=status.HTTP_403_FORBIDDEN)

        participation, created = ChallengeParticipation.objects.get_or_create(
            challenge=challenge,
            student=request.user,
            defaults={'status': ChallengeParticipation.STATUS_JOINED}
        )

        if not created:
            return Response({'message': 'أنت منضم بالفعل إلى هذا التحدي / Already joined'})

        return Response({'message': 'تم الانضمام إلى التحدي بنجاح! / Joined challenge successfully'}, status=status.HTTP_201_CREATED)


class CompleteChallengeView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request, pk):
        try:
            challenge = Challenge.objects.get(pk=pk)
        except Challenge.DoesNotExist:
            return Response({'error': 'التحدي غير موجود / Challenge not found'}, status=status.HTTP_404_NOT_FOUND)

        student_id = request.data.get('student_id')
        if not student_id:
            return Response({'error': 'معرف الطالب مطلوب / student_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
        except User.DoesNotExist:
            return Response({'error': 'الطالب غير موجود / Student not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            participation, _ = ChallengeParticipation.objects.get_or_create(
                challenge=challenge,
                student=student_user
            )

            # Check if reward already awarded to prevent duplicate processing
            if participation.reward_awarded:
                return Response({'error': 'تم صرف مكافأة هذا التحدي للطالب مسبقاً / Reward already awarded'}, status=status.HTTP_400_BAD_REQUEST)

            participation.status = ChallengeParticipation.STATUS_COMPLETED
            participation.completed_at = timezone.now()
            participation.reward_awarded = True
            participation.save()

            # Award Reward Points
            if challenge.reward_points > 0:
                process_points_transaction(
                    student_user=student_user,
                    amount=challenge.reward_points,
                    transaction_type=PointsTransaction.TYPE_ADD,
                    reason=f"إكمال التحدي: {challenge.title_ar}",
                    category='OTHER',
                    teacher_user=request.user,
                    request_meta=request.META
                )

            # Award Reward Coins
            if challenge.reward_coins > 0:
                process_coins_transaction(
                    student_user=student_user,
                    amount=challenge.reward_coins,
                    transaction_type=CoinsTransaction.TYPE_AWARD,
                    reason=f"مكافأة عملات إكمال التحدي: {challenge.title_ar}",
                    teacher_user=request.user,
                    request_meta=request.META
                )

            Notification.objects.create(
                user=student_user,
                title_ar=f"إنجاز التحدي: {challenge.title_ar}!",
                title_en=f"Challenge Completed: {challenge.title_en}!",
                message_ar=f"أحسنت! أكملت التحدي بنجاح ونلت {challenge.reward_points} نقطة و {challenge.reward_coins} عملة ذهبية.",
                message_en=f"Congratulations! You completed the challenge and earned {challenge.reward_points} points and {challenge.reward_coins} coins.",
                notification_type=Notification.TYPE_CHALLENGE
            )

            return Response({
                'message': f'تم اعتماد إكمال التحدي وصرف {challenge.reward_points} نقطة و {challenge.reward_coins} عملة للطالب {student_user.full_name}',
                'participation': ChallengeParticipationSerializer(participation).data
            })
