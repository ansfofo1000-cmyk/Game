from django.db import models
from django.conf import settings
from classrooms.models import Classroom, Committee

class Challenge(models.Model):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_EXPIRED = 'EXPIRED'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_EXPIRED, 'Expired'),
    ]

    title_ar = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    description = models.TextField()
    target_points = models.PositiveIntegerField(default=50)
    reward_points = models.PositiveIntegerField(default=20)
    reward_coins = models.PositiveIntegerField(default=5)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, null=True, blank=True, related_name='challenges', help_text="Null if available for all classrooms")
    committee = models.ForeignKey(Committee, on_delete=models.SET_NULL, null=True, blank=True, related_name='challenges', help_text="Null for general challenges")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_challenges')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title_ar} - {self.title_en} ({self.status})"


class ChallengeParticipation(models.Model):
    STATUS_JOINED = 'JOINED'
    STATUS_COMPLETED = 'COMPLETED'

    STATUS_CHOICES = [
        (STATUS_JOINED, 'Joined'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participations')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='challenge_participations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_JOINED, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    reward_awarded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('challenge', 'student')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.get_full_name()} -> {self.challenge.title_ar} ({self.status})"
