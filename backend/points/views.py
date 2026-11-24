from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.exceptions import ValidationError
from accounts.models import User, StudentProfile
from accounts.permissions import IsTeacherOrAdmin, IsAdminUserRole
from .models import PointsTransaction, CoinsTransaction
from .serializers import PointsTransactionSerializer, CoinsTransactionSerializer
from .services import process_points_transaction, process_coins_transaction

class AddPointsView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        student_id = request.data.get('student_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason')
        category = request.data.get('category', 'OTHER')

        if not student_id or amount is None or not reason:
            return Response({'error': 'الطالب، وعدد النقاط، وسبب العملية حقول مطلوبة / Student, amount, and reason are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = int(amount)
            if amount <= 0:
                return Response({'error': 'قيمة النقاط المضافة يجب أن تكون أكبر من صفر / Amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'قيمة النقاط يجب أن تكون رقماً صحيحاً / Amount must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
            profile = student_user.student_profile
        except (User.DoesNotExist, StudentProfile.DoesNotExist):
            return Response({'error': 'الطالب غير موجود / Student not found'}, status=status.HTTP_404_NOT_FOUND)

        # Classroom permission check for teachers
        if not request.user.is_admin_role and hasattr(request.user, 'teacher_profile'):
            assigned = request.user.teacher_profile.assigned_classrooms.all()
            if profile.classroom not in assigned:
                return Response({'error': 'غير مصرح لك بإضافة نقاط لطلاب خارج فصولك المعتمدة / You cannot award points to students outside your assigned classrooms'}, status=status.HTTP_403_FORBIDDEN)

        try:
            tx, updated_profile = process_points_transaction(
                student_user=student_user,
                amount=amount,
                transaction_type=PointsTransaction.TYPE_ADD,
                reason=reason,
                category=category,
                teacher_user=request.user,
                request_meta=request.META
            )
            return Response({
                'message': f'تمت إضافة {amount} نقطة بنجاح للطالب {student_user.full_name}',
                'transaction': PointsTransactionSerializer(tx).data,
                'new_points': updated_profile.points,
                'level': updated_profile.level
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class DeductPointsView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        student_id = request.data.get('student_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason')
        category = request.data.get('category', 'OTHER')

        if not student_id or amount is None or not reason:
            return Response({'error': 'الطالب، وعدد النقاط، وسبب العملية حقول مطلوبة / Student, amount, and reason are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = int(amount)
            if amount <= 0:
                return Response({'error': 'قيمة الخصم يجب أن تكون قيمة موجبة في النموذج / Deduct amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'قيمة الخصم يجب أن تكون رقماً / Amount must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
            profile = student_user.student_profile
        except (User.DoesNotExist, StudentProfile.DoesNotExist):
            return Response({'error': 'الطالب غير موجود / Student not found'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_admin_role and hasattr(request.user, 'teacher_profile'):
            assigned = request.user.teacher_profile.assigned_classrooms.all()
            if profile.classroom not in assigned:
                return Response({'error': 'غير مصرح لك بخصم نقاط لطلاب خارج فصولك المعتمدة / Unauthorized classroom'}, status=status.HTTP_403_FORBIDDEN)

        try:
            tx, updated_profile = process_points_transaction(
                student_user=student_user,
                amount=-amount,
                transaction_type=PointsTransaction.TYPE_DEDUCT,
                reason=reason,
                category=category,
                teacher_user=request.user,
                request_meta=request.META
            )
            return Response({
                'message': f'تم خصم {amount} نقطة بنجاح من رصيد الطالب {student_user.full_name}',
                'transaction': PointsTransactionSerializer(tx).data,
                'new_points': updated_profile.points,
                'level': updated_profile.level
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class AwardCoinsView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request):
        student_id = request.data.get('student_id')
        amount = request.data.get('amount')
        reason = request.data.get('reason')

        if not student_id or amount is None or not reason:
            return Response({'error': 'الطالب، وعدد العملات، وسبب المنح حقول مطلوبة / Student, amount, and reason required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = int(amount)
            if amount <= 0:
                return Response({'error': 'قيمة العملات يجب أن تكون أكبر من صفر / Amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'قيمة العملات يجب أن تكون رقماً صحيحاً / Amount must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
            profile = student_user.student_profile
        except (User.DoesNotExist, StudentProfile.DoesNotExist):
            return Response({'error': 'الطالب غير موجود / Student not found'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_admin_role and hasattr(request.user, 'teacher_profile'):
            assigned = request.user.teacher_profile.assigned_classrooms.all()
            if profile.classroom not in assigned:
                return Response({'error': 'غير مصرح لك بمنح عملات لطلاب خارج فصولك / Unauthorized classroom'}, status=status.HTTP_403_FORBIDDEN)

        try:
            tx, updated_profile = process_coins_transaction(
                student_user=student_user,
                amount=amount,
                transaction_type=CoinsTransaction.TYPE_AWARD,
                reason=reason,
                teacher_user=request.user,
                request_meta=request.META
            )
            return Response({
                'message': f'تم منح {amount} عملة ذهبية بنجاح للطالب {student_user.full_name}',
                'transaction': CoinsTransactionSerializer(tx).data,
                'new_coins': updated_profile.coins
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminAdjustmentView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        student_id = request.data.get('student_id')
        currency_type = request.data.get('currency_type', 'POINTS') # 'POINTS' or 'COINS'
        amount = request.data.get('amount')
        reason = request.data.get('reason')

        if not student_id or amount is None or not reason:
            return Response({'error': 'جميع الحقول مطلوبة لتسجيل عملية التعديل الإداري / All fields required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = int(amount)
        except ValueError:
            return Response({'error': 'القيمة يجب أن تكون رقماً صحيحاً / Amount must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
        except User.DoesNotExist:
            return Response({'error': 'الطالب غير موجود / Student not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            if currency_type == 'POINTS':
                tx, prof = process_points_transaction(
                    student_user=student_user,
                    amount=amount,
                    transaction_type=PointsTransaction.TYPE_ADJUSTMENT,
                    reason=f"[تعديل إداري / Admin Adjustment]: {reason}",
                    category='OTHER',
                    teacher_user=request.user,
                    request_meta=request.META
                )
                return Response({
                    'message': 'تم تسجيل عملية التعديل الإداري للنقاط بنجاح',
                    'transaction': PointsTransactionSerializer(tx).data,
                    'new_points': prof.points
                })
            else:
                tx, prof = process_coins_transaction(
                    student_user=student_user,
                    amount=amount,
                    transaction_type=CoinsTransaction.TYPE_ADJUSTMENT,
                    reason=f"[تعديل إداري / Admin Adjustment]: {reason}",
                    teacher_user=request.user,
                    request_meta=request.META
                )
                return Response({
                    'message': 'تم تسجيل عملية التعديل الإداري للعملات بنجاح',
                    'transaction': CoinsTransactionSerializer(tx).data,
                    'new_coins': prof.coins
                })
        except ValidationError as e:
            return Response({'error': str(e.message if hasattr(e, 'message') else e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentPointsHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id=None):
        if student_id is None:
            # Current user's points history if student
            if not request.user.is_student:
                return Response({'error': 'معرف الطالب مطلوب / student_id required'}, status=status.HTTP_400_BAD_REQUEST)
            target_user = request.user
        else:
            try:
                target_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
            except User.DoesNotExist:
                return Response({'error': 'الطالب غير موجود / Student not found'}, status=status.HTTP_404_NOT_FOUND)

            # Permission check: student cannot view other students' private transaction history
            if request.user.is_student and request.user.id != target_user.id:
                return Response({'error': 'غير مصرح لك بالاطلاع على سجلات الطلاب الآخرين / Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

            # Teacher classroom check
            if not request.user.is_admin_role and hasattr(request.user, 'teacher_profile'):
                assigned = request.user.teacher_profile.assigned_classrooms.all()
                if target_user.student_profile.classroom not in assigned:
                    return Response({'error': 'غير مصرح لك بالاطلاع على طلاب خارج فصولك / Unauthorized classroom'}, status=status.HTTP_403_FORBIDDEN)

        transactions = PointsTransaction.objects.filter(student=target_user).select_related('teacher', 'student').order_by('-timestamp')
        return Response(PointsTransactionSerializer(transactions, many=True).data)


class StudentCoinsHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id=None):
        if student_id is None:
            if not request.user.is_student:
                return Response({'error': 'معرف الطالب مطلوب / student_id required'}, status=status.HTTP_400_BAD_REQUEST)
            target_user = request.user
        else:
            try:
                target_user = User.objects.get(pk=student_id, role=User.ROLE_STUDENT)
            except User.DoesNotExist:
                return Response({'error': 'الطالب غير موجود / Student not found'}, status=status.HTTP_404_NOT_FOUND)

            if request.user.is_student and request.user.id != target_user.id:
                return Response({'error': 'غير مصرح لك بالاطلاع على سجلات الطلاب الآخرين / Unauthorized access'}, status=status.HTTP_403_FORBIDDEN)

            if not request.user.is_admin_role and hasattr(request.user, 'teacher_profile'):
                assigned = request.user.teacher_profile.assigned_classrooms.all()
                if target_user.student_profile.classroom not in assigned:
                    return Response({'error': 'غير مصرح لك بالاطلاع على طلاب خارج فصولك / Unauthorized classroom'}, status=status.HTTP_403_FORBIDDEN)

        transactions = CoinsTransaction.objects.filter(student=target_user).select_related('teacher', 'student').order_by('-timestamp')
        return Response(CoinsTransactionSerializer(transactions, many=True).data)


class ActivityFeedView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')
        limit = int(request.query_params.get('limit', 20))

        points_qs = PointsTransaction.objects.all().select_related(
            'student__student_profile__classroom', 'teacher'
        )
        if classroom_id:
            points_qs = points_qs.filter(student__student_profile__classroom_id=classroom_id)

        items = []
        for tx in points_qs[:limit]:
            items.append({
                'id': f"pts-{tx.id}",
                'type': 'POINTS',
                'amount': tx.amount,
                'student_name': tx.student.full_name or tx.student.username,
                'classroom_name': tx.student.student_profile.classroom.name if hasattr(tx.student, 'student_profile') else '',
                'reason': tx.reason,
                'category': tx.get_category_display(),
                'teacher_name': tx.teacher.full_name if tx.teacher else 'الإدارة / System',
                'timestamp': tx.timestamp
            })

        return Response(items)
