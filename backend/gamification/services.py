from django.utils import timezone
from .models import Level, Achievement, StudentAchievement
from notifications.models import Notification

def calculate_student_level(points):
    """
    Calculate student level dynamically based on Level table thresholds.
    """
    levels = Level.objects.all().order_by('-min_points')
    for lvl in levels:
        if points >= lvl.min_points:
            return lvl
    return Level.objects.order_by('min_points').first()


def check_student_achievements(student_user, current_points, is_first_tx=False):
    """
    Evaluates and awards achievements for a student based on current points and conditions.
    """
    newly_awarded = []

    # 1. First points transaction achievement
    if is_first_tx or current_points > 0:
        first_ach = Achievement.objects.filter(slug='first-achievement').first()
        if first_ach and not StudentAchievement.objects.filter(student=student_user, achievement=first_ach).exists():
            sa = StudentAchievement.objects.create(
                student=student_user,
                achievement=first_ach,
                reason="الحصول على أول نقاط في المنصة"
            )
            newly_awarded.append(first_ach)
            Notification.objects.create(
                user=student_user,
                title_ar="شارة إنجاز جديدة!",
                title_en="New Achievement Unlocked!",
                message_ar=f"تهانينا! حصلت على وسام: {first_ach.name_ar} - {first_ach.description_ar}",
                message_en=f"Congratulations! You unlocked: {first_ach.name_en}",
                notification_type=Notification.TYPE_ACHIEVEMENT
            )

    # 2. Points thresholds
    threshold_achs = Achievement.objects.filter(condition_type='POINTS_THRESHOLD', condition_value__lte=current_points)
    for ach in threshold_achs:
        if not StudentAchievement.objects.filter(student=student_user, achievement=ach).exists():
            StudentAchievement.objects.create(
                student=student_user,
                achievement=ach,
                reason=f"الوصول إلى {ach.condition_value} نقطة"
            )
            newly_awarded.append(ach)
            Notification.objects.create(
                user=student_user,
                title_ar="شارة إنجاز جديدة!",
                title_en="New Achievement Unlocked!",
                message_ar=f"إنجاز رائع! حصلت على وسام: {ach.name_ar} - {ach.description_ar}",
                message_en=f"Milestone reached! You unlocked: {ach.name_en}",
                notification_type=Notification.TYPE_ACHIEVEMENT
            )

    return newly_awarded


def check_leaderboard_achievements():
    """
    Periodically or on ranking updates, awards top 3 and top 10 badges to overall leaders.
    """
    from accounts.models import StudentProfile
    top_students = StudentProfile.objects.filter(points__gt=0).order_by('-points', '-coins', 'id')[:10]

    top_3_ach = Achievement.objects.filter(slug='top-three-champion').first()
    top_10_ach = Achievement.objects.filter(slug='top-ten-student').first()

    for index, sp in enumerate(top_students, 1):
        if top_10_ach and not StudentAchievement.objects.filter(student=sp.user, achievement=top_10_ach).exists():
            StudentAchievement.objects.create(
                student=sp.user,
                achievement=top_10_ach,
                reason="الوصول إلى قائمة الطلاب العشرة الأوائل"
            )
            Notification.objects.create(
                user=sp.user,
                title_ar="شارة التميز: قائمة العشرة الأوائل!",
                title_en="Top 10 Achievement!",
                message_ar="أحسنت صنعاً! دخلت رسمياً قائمة العشرة الأوائل على مستوى المدرسة.",
                message_en="You are officially ranked among the Top 10 students school-wide.",
                notification_type=Notification.TYPE_ACHIEVEMENT
            )

        if index <= 3 and top_3_ach and not StudentAchievement.objects.filter(student=sp.user, achievement=top_3_ach).exists():
            StudentAchievement.objects.create(
                student=sp.user,
                achievement=top_3_ach,
                reason=f"الوصول إلى المركز {index} على منصة التتويج"
            )
            Notification.objects.create(
                user=sp.user,
                title_ar="شارة البطولة: منصة التتويج!",
                title_en="Podium Champion Achievement!",
                message_ar=f"إنجاز أسطوري! أنت الآن في المركز {index} على منصة تتويج أبطال الفصل.",
                message_en=f"Legendary! You reached position #{index} on the champions podium.",
                notification_type=Notification.TYPE_ACHIEVEMENT
            )
