from django.db import models
from django.conf import settings

class Level(models.Model):
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    min_points = models.IntegerField(default=0, db_index=True)
    max_points = models.IntegerField(null=True, blank=True, help_text="Null for max tier (e.g. 350+)")
    icon = models.CharField(max_length=50, default='Award')
    color = models.CharField(max_length=30, default='#53E0AD')
    order = models.IntegerField(default=1)

    class Meta:
        ordering = ['min_points']

    def __str__(self):
        return f"{self.name_ar} ({self.name_en}) [{self.min_points}-{self.max_points or '+'}]"


class Achievement(models.Model):
    CONDITION_CHOICES = [
        ('POINTS_THRESHOLD', 'Points Threshold'),
        ('FIRST_POINTS', 'First Points Transaction'),
        ('LEVEL_REACHED', 'Level Reached'),
        ('TOP_THREE', 'Ranked in Top 3'),
        ('TOP_TEN', 'Ranked in Top 10'),
        ('CHALLENGE_COMPLETED', 'Challenge Completed'),
        ('MANUAL', 'Teacher/Admin Award'),
    ]

    slug = models.SlugField(max_length=100, unique=True)
    name_ar = models.CharField(max_length=150)
    name_en = models.CharField(max_length=150)
    description_ar = models.TextField()
    description_en = models.TextField()
    icon = models.CharField(max_length=50, default='Trophy')
    category = models.CharField(max_length=50, default='General')
    condition_type = models.CharField(max_length=30, choices=CONDITION_CHOICES, default='MANUAL')
    condition_value = models.IntegerField(default=0)
    badge_color = models.CharField(max_length=30, default='#FBBF24')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name_ar} ({self.slug})"


class StudentAchievement(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='awarded_to')
    earned_at = models.DateTimeField(auto_now_add=True)
    manual_award = models.BooleanField(default=False)
    awarded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='awarded_achievements')
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('student', 'achievement')
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.student.get_full_name()} -> {self.achievement.name_ar}"
