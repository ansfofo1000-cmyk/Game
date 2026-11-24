from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import User, TeacherProfile, TeacherInvitationCode, StudentProfile
from .serializers import (
    StudentRegisterSerializer,
    TeacherRegisterSerializer,
    UserSerializer,
    StudentProfileDetailSerializer
)
from .permissions import IsAdminUserRole, IsApprovedTeacher, IsTeacherOrAdmin
from audit.models import ActivityLog
from notifications.models import Notification

class CSRFTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        csrf_token = get_token(request)
        return Response({'csrfToken': csrf_token})


class RegisterStudentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            ActivityLog.objects.create(
                actor=user,
                action_type=ActivityLog.ACTION_STUDENT_REGISTER,
                description_ar=f"تسجيل حساب طالب جديد: {user.full_name} ({user.email})",
                description_en=f"New student registration: {user.full_name} ({user.email})",
                target_user=user,
                classroom=user.student_profile.classroom,
                ip_address=request.META.get('REMOTE_ADDR', '')
            )
            # Create welcome notification
            Notification.objects.create(
                user=user,
                title_ar="مرحباً بك في أبطال الفصل!",
                title_en="Welcome to Class Champions!",
                message_ar="تم إنشاء حسابك بنجاح. انطلق للمنافسة، احصد النقاط والعملات، وتصدر منصة التتويج!",
                message_en="Your account has been created. Start competing, earn points and coins, and reach the top!",
                notification_type=Notification.TYPE_SYSTEM
            )
            # Log in the user immediately
            login(request, user)
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterTeacherView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TeacherRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            ActivityLog.objects.create(
                actor=user,
                action_type=ActivityLog.ACTION_TEACHER_REGISTER,
                description_ar=f"تسجيل معلم جديد بانتظار الاعتماد: {user.full_name} ({user.email})",
                description_en=f"New teacher registration pending approval: {user.full_name} ({user.email})",
                target_user=user,
                ip_address=request.META.get('REMOTE_ADDR', '')
            )
            return Response({
                'message_ar': 'تم تسجيل حساب المعلم بنجاح وهو قيد مراجعة واعتماد الإدارة.',
                'message_en': 'Teacher registration submitted successfully and is pending administrator approval.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({
                'error': 'البريد الإلكتروني وكلمة المرور مطلوبان / Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({
                'error': 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور / Invalid login credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Check account status
        if user.status == User.STATUS_PENDING and user.role == User.ROLE_TEACHER:
            return Response({
                'error': 'حسابك كمعلم قيد المراجعة والاعتماد من إدارة المدرسة. يرجى الانتظار لحين التفعيل / Your teacher account is pending administrator approval'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.status == User.STATUS_SUSPENDED:
            return Response({
                'error': 'تم تجميد هذا الحساب من قبل الإدارة. يرجى مراجعة المسؤول / Account is suspended'
            }, status=status.HTTP_403_FORBIDDEN)

        if user.status == User.STATUS_REJECTED:
            return Response({
                'error': 'تم رفض طلب التسجيل لهذا الحساب / Account registration was rejected'
            }, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        return Response({
            'message': 'تم تسجيل الدخول بنجاح / Logged in successfully',
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logout(request)
        return Response({'message': 'تم تسجيل الخروج بنجاح / Logged out successfully'})


class MeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                'isAuthenticated': True,
                'user': UserSerializer(request.user).data
            })
        return Response({'isAuthenticated': False, 'user': None})


class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        full_name = request.data.get('full_name')
        if full_name:
            user.full_name = full_name.strip()
            user.save()

        if user.is_student and hasattr(user, 'student_profile'):
            profile = user.student_profile
            bio = request.data.get('bio')
            avatar = request.data.get('avatar')
            if bio is not None:
                profile.bio = bio
            if avatar is not None:
                profile.avatar = avatar
            profile.save()

        return Response(UserSerializer(user).data)


# ----------------- ADMINISTRATOR VIEWS -----------------

class PendingTeachersView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        pending_teachers = User.objects.filter(role=User.ROLE_TEACHER, status=User.STATUS_PENDING).order_by('-date_joined')
        return Response(UserSerializer(pending_teachers, many=True).data)


class ApproveTeacherView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            teacher_user = User.objects.get(pk=pk, role=User.ROLE_TEACHER)
        except User.DoesNotExist:
            return Response({'error': 'المعلم غير موجود / Teacher not found'}, status=status.HTTP_404_NOT_FOUND)

        teacher_user.status = User.STATUS_APPROVED
        teacher_user.save()

        profile, _ = TeacherProfile.objects.get_or_create(user=teacher_user)
        profile.is_approved = True
        profile.approval_date = timezone.now()
        profile.approved_by = request.user

        # Assign classrooms if sent
        classroom_ids = request.data.get('classroom_ids')
        if classroom_ids is not None:
            profile.assigned_classrooms.set(classroom_ids)
        profile.save()

        # Notification & Audit
        Notification.objects.create(
            user=teacher_user,
            title_ar="تم اعتماد حساب المعلم!",
            title_en="Teacher Account Approved!",
            message_ar="مبروك! تم اعتماد حسابك كمعلم في منصة أبطال الفصل. يمكنك الآن الدخول وإدارة الفصول المخصصة لك.",
            message_en="Congratulations! Your teacher account has been approved. You can now access your classroom portal.",
            notification_type=Notification.TYPE_SYSTEM
        )

        ActivityLog.objects.create(
            actor=request.user,
            action_type=ActivityLog.ACTION_TEACHER_APPROVAL,
            description_ar=f"اعتماد المعلم {teacher_user.full_name} ({teacher_user.email}) بواسطة الإدارة",
            description_en=f"Teacher {teacher_user.full_name} approved by admin",
            target_user=teacher_user,
            ip_address=request.META.get('REMOTE_ADDR', '')
        )

        return Response({
            'message': 'تم اعتماد المعلم بنجاح / Teacher approved successfully',
            'user': UserSerializer(teacher_user).data
        })


class RejectTeacherView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            teacher_user = User.objects.get(pk=pk, role=User.ROLE_TEACHER)
        except User.DoesNotExist:
            return Response({'error': 'المعلم غير موجود / Teacher not found'}, status=status.HTTP_404_NOT_FOUND)

        teacher_user.status = User.STATUS_REJECTED
        teacher_user.save()

        if hasattr(teacher_user, 'teacher_profile'):
            teacher_user.teacher_profile.is_approved = False
            teacher_user.teacher_profile.save()

        ActivityLog.objects.create(
            actor=request.user,
            action_type=ActivityLog.ACTION_TEACHER_REJECTION,
            description_ar=f"رفض طلب تسجيل المعلم {teacher_user.full_name} ({teacher_user.email})",
            description_en=f"Teacher registration rejected: {teacher_user.full_name}",
            target_user=teacher_user,
            ip_address=request.META.get('REMOTE_ADDR', '')
        )

        return Response({'message': 'تم رفض تسجيل المعلم / Teacher rejected'})


class UserManagementView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        role = request.query_args = request.query_params.get('role')
        status_param = request.query_params.get('status')
        classroom_id = request.query_params.get('classroom_id')
        search = request.query_params.get('search')

        qs = User.objects.all().select_related('student_profile', 'teacher_profile')

        if role:
            qs = qs.filter(role=role)
        if status_param:
            qs = qs.filter(status=status_param)
        if classroom_id:
            qs = qs.filter(student_profile__classroom_id=classroom_id)
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )

        return Response(UserSerializer(qs.order_by('-date_joined'), many=True).data)


class ToggleUserStatusView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'المستخدم غير موجود / User not found'}, status=status.HTTP_404_NOT_FOUND)

        if target_user.is_superuser:
            return Response({'error': 'لا يمكن تعليق حساب مدير النظام الرئيسي / Cannot suspend superadmin'}, status=status.HTTP_400_BAD_REQUEST)

        new_status = request.data.get('status')
        if new_status not in [User.STATUS_APPROVED, User.STATUS_SUSPENDED]:
            # toggle between approved and suspended
            new_status = User.STATUS_SUSPENDED if target_user.status == User.STATUS_APPROVED else User.STATUS_APPROVED

        target_user.status = new_status
        target_user.save()

        ActivityLog.objects.create(
            actor=request.user,
            action_type=ActivityLog.ACTION_ACCOUNT_MODIFY,
            description_ar=f"تغيير حالة حساب {target_user.full_name} إلى {new_status}",
            description_en=f"Updated account status of {target_user.full_name} to {new_status}",
            target_user=target_user,
            ip_address=request.META.get('REMOTE_ADDR', '')
        )

        return Response({
            'message': f'تم تعديل حالة الحساب بنجاح / Account status updated to {new_status}',
            'user': UserSerializer(target_user).data
        })


class TeacherInvitationCodeManagementView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        codes = TeacherInvitationCode.objects.all().order_by('-created_at')
        data = [{
            'id': c.id,
            'code': c.code,
            'is_active': c.is_active,
            'max_uses': c.max_uses,
            'current_uses': c.current_uses,
            'created_at': c.created_at
        } for c in codes]
        return Response(data)

    def post(self, request):
        code_str = request.data.get('code', '').strip()
        max_uses = int(request.data.get('max_uses', 100))
        if not code_str:
            return Response({'error': 'كود التسجيل مطلوب / Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = TeacherInvitationCode.objects.get_or_create(
            code=code_str,
            defaults={'max_uses': max_uses, 'is_active': True}
        )
        if not created:
            obj.is_active = True
            obj.max_uses = max_uses
            obj.save()

        return Response({
            'id': obj.id,
            'code': obj.code,
            'is_active': obj.is_active,
            'max_uses': obj.max_uses,
            'current_uses': obj.current_uses,
            'created_at': obj.created_at
        }, status=status.HTTP_201_CREATED)


class TeachersDirectoryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        approved_teachers = User.objects.filter(
            role=User.ROLE_TEACHER,
            status=User.STATUS_APPROVED,
            teacher_profile__is_approved=True
        ).select_related('teacher_profile').prefetch_related('teacher_profile__assigned_classrooms')

        data = []
        for t in approved_teachers:
            profile = getattr(t, 'teacher_profile', None)
            assigned = []
            student_count = 0
            if profile:
                assigned = [{'id': c.id, 'name': c.name, 'name_ar': c.name_ar} for c in profile.assigned_classrooms.all()]
                student_count = StudentProfile.objects.filter(classroom__in=profile.assigned_classrooms.all()).count()

            data.append({
                'id': t.id,
                'name': t.full_name or t.username,
                'subject': profile.subject if profile else '',
                'assigned_classrooms': assigned,
                'students_managed': student_count,
            })
        return Response(data)
