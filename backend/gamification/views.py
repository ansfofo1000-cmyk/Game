from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q
from .models import Level, Achievement, StudentAchievement
from .serializers import LevelSerializer, AchievementSerializer, StudentAchievementSerializer
from accounts.models import StudentProfile, User
from accounts.permissions import IsTeacherOrAdmin
from classrooms.models import Classroom
from notifications.models import Notification
from audit.models import ActivityLog

class LeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Calculates and returns leaderboard data with deterministic tie-breaking.
        Tie-breaking logic:
        1. Higher Points = Higher Rank.
        2. Equal Points = Shared Rank (Competition Ranking 1-2-2-4 format).
        3. Deterministic display order within ties: Coins DESC, First Name ASC, Last Name ASC, Student ID ASC.
        """
        classroom_id = request.query_params.get('classroom_id')
        search = request.query_params.get('search')
        position_id = request.query_params.get('position_id')

        # Base queryset of active approved students
        qs = StudentProfile.objects.filter(user__status=User.STATUS_APPROVED).select_related(
            'user', 'classroom', 'approved_position', 'approved_committee'
        ).prefetch_related('user__achievements__achievement')

        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if position_id:
            qs = qs.filter(approved_position_id=position_id)
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search) |
                Q(user__username__icontains=search)
            )

        # Deterministic sorting
        sorted_students = list(qs.order_by(
            '-points',
            '-coins',
            'user__first_name',
            'user__last_name',
            'id'
        ))

        # Competition Ranking with Shared Ranks
        ranked_list = []
        current_rank = 0
        previous_points = None

        for index, sp in enumerate(sorted_students, start=1):
            if sp.points != previous_points:
                current_rank = index
                previous_points = sp.points

            earned_badges = [
                {
                    'id': sa.achievement.id,
                    'slug': sa.achievement.slug,
                    'name_ar': sa.achievement.name_ar,
                    'name_en': sa.achievement.name_en,
                    'icon': sa.achievement.icon,
                    'badge_color': sa.achievement.badge_color
                }
                for sa in sp.user.achievements.all()
            ]

            ranked_list.append({
                'rank': current_rank,
                'display_order': index,
                'user_id': sp.user.id,
                'student_profile_id': sp.id,
                'name': sp.user.full_name or sp.user.username,
                'avatar': sp.avatar,
                'classroom_id': sp.classroom.id,
                'classroom_name': sp.classroom.name,
                'classroom_name_ar': sp.classroom.name_ar,
                'position_ar': sp.approved_position.name_ar if sp.approved_position else None,
                'position_en': sp.approved_position.name_en if sp.approved_position else None,
                'committee_ar': sp.approved_committee.name_ar if sp.approved_committee else None,
                'committee_en': sp.approved_committee.name_en if sp.approved_committee else None,
                'points': sp.points,
                'coins': sp.coins,
                'level': sp.level,
                'achievements_count': len(earned_badges),
                'badges': earned_badges[:5],
            })

        total_pts = sum(s['points'] for s in ranked_list)
        total_cns = sum(s['coins'] for s in ranked_list)
        avg_pts = round(total_pts / len(ranked_list), 1) if ranked_list else 0

        return Response({
            'total_students': len(ranked_list),
            'total_points': total_pts,
            'total_coins': total_cns,
            'average_points': avg_pts,
            'top_three': ranked_list[:3],
            'top_ten': ranked_list[:10],
            'ranking': ranked_list
        })


class AchievementsListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        achievements = Achievement.objects.all().order_by('id')
        user = request.user if request.user.is_authenticated else None

        earned_ids = set()
        earned_dates = {}
        if user and user.is_student:
            student_achs = StudentAchievement.objects.filter(student=user)
            for sa in student_achs:
                earned_ids.add(sa.achievement_id)
                earned_dates[sa.achievement_id] = sa.earned_at

        data = []
        for ach in achievements:
            is_earned = (ach.id in earned_ids)
            data.append({
                'id': ach.id,
                'slug': ach.slug,
                'name_ar': ach.name_ar,
                'name_en': ach.name_en,
                'description_ar': ach.description_ar,
                'description_en': ach.description_en,
                'icon': ach.icon,
                'category': ach.category,
                'condition_type': ach.condition_type,
                'condition_value': ach.condition_value,
                'badge_color': ach.badge_color,
                'is_earned': is_earned,
                'earned_at': earned_dates.get(ach.id)
            })
        return Response(data)


class ManualAwardAchievementView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        student_id = request.data.get('student_id')
        achievement_id = request.data.get('achievement_id')
        reason = request.data.get('reason', 'منح تشجيعي من المعلم')

        if not student_id or not achievement_id:
            return Response({'error': 'الطالب ووسام الإنجاز مطلوبان / student_id and achievement_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
            achievement = Achievement.objects.get(pk=achievement_id)
        except (User.DoesNotExist, Achievement.DoesNotExist):
            return Response({'error': 'الطالب أو وسام الإنجاز غير موجود / Not found'}, status=status.HTTP_404_NOT_FOUND)

        sa, created = StudentAchievement.objects.get_or_create(
            student=student_user,
            achievement=achievement,
            defaults={
                'manual_award': True,
                'awarded_by': request.user,
                'reason': reason
            }
        )

        if not created:
            return Response({'error': 'هذا الطالب يمتلك هذا الإنجاز بالفعل / Achievement already awarded'}, status=status.HTTP_400_BAD_REQUEST)

        Notification.objects.create(
            user=student_user,
            title_ar="تم منحك وسام إنجاز خاص!",
            title_en="Special Achievement Awarded!",
            message_ar=f"قام الأستاذ {request.user.full_name or request.user.username} بمنحك وسام: {achievement.name_ar}. السبب: {reason}",
            message_en=f"{request.user.full_name or request.user.username} awarded you: {achievement.name_en}. Reason: {reason}",
            notification_type=Notification.TYPE_ACHIEVEMENT
        )

        ActivityLog.objects.create(
            actor=request.user,
            action_type=ActivityLog.ACTION_ACHIEVEMENT_AWARD,
            description_ar=f"منح وسام {achievement.name_ar} للطالب {student_user.full_name}. السبب: {reason}",
            description_en=f"Awarded achievement {achievement.name_en} to {student_user.full_name}. Reason: {reason}",
            target_user=student_user,
            classroom=student_user.student_profile.classroom,
            ip_address=request.META.get('REMOTE_ADDR', '')
        )

        return Response({
            'message': f'تم منح وسام {achievement.name_ar} بنجاح للطالب {student_user.full_name}',
            'achievement': AchievementSerializer(achievement).data
        }, status=status.HTTP_201_CREATED)


class LevelsListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        levels = Level.objects.all().order_by('min_points')
        return Response(LevelSerializer(levels, many=True).data)
