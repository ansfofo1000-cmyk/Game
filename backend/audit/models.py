from django.db import models
from django.conf import settings
from classrooms.models import Classroom

class ActivityLog(models.Model):
    ACTION_STUDENT_REGISTER = 'STUDENT_REGISTER'
    ACTION_TEACHER_REGISTER = 'TEACHER_REGISTER'
    ACTION_TEACHER_APPROVAL = 'TEACHER_APPROVAL'
    ACTION_TEACHER_REJECTION = 'TEACHER_REJECTION'
    ACTION_POINTS_MODIFY = 'POINTS_MODIFY'
    ACTION_COINS_MODIFY = 'COINS_MODIFY'
    ACTION_POSITION_ASSIGN = 'POSITION_ASSIGN'
    ACTION_CLASSROOM_CHANGE = 'CLASSROOM_CHANGE'
    ACTION_ACCOUNT_MODIFY = 'ACCOUNT_MODIFY'
    ACTION_CHALLENGE_CREATE = 'CHALLENGE_CREATE'
    ACTION_ACHIEVEMENT_AWARD = 'ACHIEVEMENT_AWARD'
    ACTION_ADMIN_ACTION = 'ADMIN_ACTION'

    ACTION_CHOICES = [
        (ACTION_STUDENT_REGISTER, 'Student Registration'),
        (ACTION_TEACHER_REGISTER, 'Teacher Registration'),
        (ACTION_TEACHER_APPROVAL, 'Teacher Approval'),
        (ACTION_TEACHER_REJECTION, 'Teacher Rejection'),
        (ACTION_POINTS_MODIFY, 'Points Modification'),
        (ACTION_COINS_MODIFY, 'Coins Modification'),
        (ACTION_POSITION_ASSIGN, 'Position Assignment'),
        (ACTION_CLASSROOM_CHANGE, 'Classroom Change'),
        (ACTION_ACCOUNT_MODIFY, 'Account Modification'),
        (ACTION_CHALLENGE_CREATE, 'Challenge Creation'),
        (ACTION_ACHIEVEMENT_AWARD, 'Achievement Awarded'),
        (ACTION_ADMIN_ACTION, 'Administrative Action'),
    ]

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='actor_logs')
    action_type = models.CharField(max_length=40, choices=ACTION_CHOICES, db_index=True)
    description_ar = models.TextField()
    description_en = models.TextField()
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='target_logs')
    classroom = models.ForeignKey(Classroom, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    ip_address = models.CharField(max_length=45, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"[{self.action_type}] {actor_name}: {self.description_en[:40]}"
