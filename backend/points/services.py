from django.db import transaction
from django.core.exceptions import ValidationError
from accounts.models import StudentProfile, User
from .models import PointsTransaction, CoinsTransaction
from gamification.services import calculate_student_level, check_student_achievements, check_leaderboard_achievements
from notifications.models import Notification
from audit.models import ActivityLog

def process_points_transaction(student_user, amount, transaction_type, reason, category, teacher_user, request_meta=None):
    """
    Executes a points transaction safely with row-level locks, balance checks,
    gamification updates, notification triggers, and audit logging.
    """
    if amount == 0:
        raise ValidationError("قيمة النقاط لا يمكن أن تكون صفراً / Amount cannot be zero")

    reason = (reason or '').strip()
    if not reason:
        raise ValidationError("سبب العملية إجباري ولا يمكن تركه فارغاً / Reason is mandatory")

    with transaction.atomic():
        # Lock row for update
        profile = StudentProfile.objects.select_for_update().get(user=student_user)
        prev_balance = profile.points
        new_balance = prev_balance + amount

        # Reject negative balances by default
        if new_balance < 0:
            raise ValidationError(
                f"لا يمكن خصم النقاط لأن الرصيد الحالي ({prev_balance}) لا يكفي. الرصيد لا يمكن أن يكون سالباً."
            )

        # Update profile points
        profile.points = new_balance

        # Calculate and update level
        new_lvl = calculate_student_level(new_balance)
        old_level_title = profile.level
        new_level_title = f"{new_lvl.name_ar} / {new_lvl.name_en}" if new_lvl else "مبتدئ / Beginner"

        level_changed = (old_level_title != new_level_title)
        profile.level = new_level_title
        profile.save()

        # Create immutable PointsTransaction
        tx = PointsTransaction.objects.create(
            student=student_user,
            amount=amount,
            transaction_type=transaction_type,
            reason=reason,
            category=category or 'OTHER',
            teacher=teacher_user,
            previous_balance=prev_balance,
            new_balance=new_balance
        )

        # Notification for points
        sign = "+" if amount > 0 else ""
        action_word_ar = "إضافة" if amount > 0 else "خصم"
        action_word_en = "added" if amount > 0 else "deducted"

        Notification.objects.create(
            user=student_user,
            title_ar=f"تم {action_word_ar} {abs(amount)} نقطة",
            title_en=f"{abs(amount)} points {action_word_en}",
            message_ar=f"قام الأستاذ {teacher_user.full_name or teacher_user.username} بـ {action_word_ar} {abs(amount)} نقطة لرصيدك. السبب: {reason}. رصيدك الجديد: {new_balance} نقطة.",
            message_en=f"{teacher_user.full_name or teacher_user.username} {action_word_en} {abs(amount)} points. Reason: {reason}. New balance: {new_balance}.",
            notification_type=Notification.TYPE_POINTS
        )

        # Level up notification if level increased
        if level_changed and amount > 0:
            Notification.objects.create(
                user=student_user,
                title_ar=f"ترقية رتبة! لقد أصبحت الآن: {new_lvl.name_ar}",
                title_en=f"Level Up! You reached: {new_lvl.name_en}",
                message_ar=f"مبارك! بفضل جهودك ونقاطك ({new_balance} نقطة)، ترقيت رسمياً إلى رتبة: {new_lvl.name_ar}.",
                message_en=f"Congratulations! You reached the rank of {new_lvl.name_en} with {new_balance} points.",
                notification_type=Notification.TYPE_LEVEL
            )

        # Check achievements
        check_student_achievements(student_user, new_balance, is_first_tx=(prev_balance == 0 and amount > 0))
        check_leaderboard_achievements()

        # Audit log
        ip = request_meta.get('REMOTE_ADDR', '') if request_meta else ''
        ActivityLog.objects.create(
            actor=teacher_user,
            action_type=ActivityLog.ACTION_POINTS_MODIFY,
            description_ar=f"عملية {action_word_ar} {sign}{amount} نقطة للطالب {student_user.full_name}. السبب: {reason}",
            description_en=f"{action_word_en.capitalize()} {sign}{amount} points for student {student_user.full_name}. Reason: {reason}",
            target_user=student_user,
            classroom=profile.classroom,
            ip_address=ip
        )

        return tx, profile


def process_coins_transaction(student_user, amount, transaction_type, reason, teacher_user, request_meta=None):
    """
    Executes a coins transaction safely with row-level locks, balance checks,
    notification triggers, and audit logging.
    """
    if amount == 0:
        raise ValidationError("قيمة العملات لا يمكن أن تكون صفراً / Amount cannot be zero")

    reason = (reason or '').strip()
    if not reason:
        raise ValidationError("سبب منح أو خصم العملات إجباري / Reason is mandatory")

    with transaction.atomic():
        profile = StudentProfile.objects.select_for_update().get(user=student_user)
        prev_balance = profile.coins
        new_balance = prev_balance + amount

        if new_balance < 0:
            raise ValidationError(
                f"لا يمكن خصم العملات لأن الرصيد الحالي ({prev_balance}) لا يكفي. الرصيد لا يمكن أن يكون سالباً."
            )

        profile.coins = new_balance
        profile.save()

        tx = CoinsTransaction.objects.create(
            student=student_user,
            amount=amount,
            transaction_type=transaction_type,
            reason=reason,
            teacher=teacher_user,
            previous_balance=prev_balance,
            new_balance=new_balance
        )

        action_word_ar = "منح" if amount > 0 else "خصم"
        action_word_en = "awarded" if amount > 0 else "deducted"

        Notification.objects.create(
            user=student_user,
            title_ar=f"تم {action_word_ar} {abs(amount)} عملة ذهبية!",
            title_en=f"{abs(amount)} Coins {action_word_en}!",
            message_ar=f"قام الأستاذ {teacher_user.full_name or teacher_user.username} بـ {action_word_ar} {abs(amount)} عملة لرصيدك. السبب: {reason}. رصيدك الجديد: {new_balance} عملة.",
            message_en=f"{teacher_user.full_name or teacher_user.username} {action_word_en} {abs(amount)} coins. Reason: {reason}. New balance: {new_balance}.",
            notification_type=Notification.TYPE_COINS
        )

        ip = request_meta.get('REMOTE_ADDR', '') if request_meta else ''
        ActivityLog.objects.create(
            actor=teacher_user,
            action_type=ActivityLog.ACTION_COINS_MODIFY,
            description_ar=f"عملية {action_word_ar} {amount} عملة للطالب {student_user.full_name}. السبب: {reason}",
            description_en=f"{action_word_en.capitalize()} {amount} coins for student {student_user.full_name}. Reason: {reason}",
            target_user=student_user,
            classroom=profile.classroom,
            ip_address=ip
        )

        return tx, profile
