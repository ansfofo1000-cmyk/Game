from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_POINTS = 'POINTS_CHANGE'
    TYPE_COINS = 'COINS_AWARD'
    TYPE_LEVEL = 'LEVEL_UP'
    TYPE_ACHIEVEMENT = 'ACHIEVEMENT_UNLOCKED'
    TYPE_POSITION = 'POSITION_UPDATE'
    TYPE_CHALLENGE = 'CHALLENGE_UPDATE'
    TYPE_SYSTEM = 'SYSTEM'

    TYPE_CHOICES = [
        (TYPE_POINTS, 'Points Change'),
        (TYPE_COINS, 'Coins Award'),
        (TYPE_LEVEL, 'Level Up'),
        (TYPE_ACHIEVEMENT, 'Achievement Unlocked'),
        (TYPE_POSITION, 'Position Update'),
        (TYPE_CHALLENGE, 'Challenge Update'),
        (TYPE_SYSTEM, 'System Notification'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title_ar = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    message_ar = models.TextField()
    message_en = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_SYSTEM, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title_ar} (Read: {self.is_read})"
