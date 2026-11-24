from django.db import models
from django.conf import settings

class Classroom(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    name_ar = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.name_ar})" if self.name_ar else self.name


class Position(models.Model):
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)
    is_exclusive = models.BooleanField(default=True, help_text="If True, only one student can hold this per classroom")
    requires_committee = models.BooleanField(default=False, help_text="True if Reporter/مقرر")

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name_ar} - {self.name_en}"


class Committee(models.Model):
    name_ar = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name_ar} - {self.name_en}"


class PositionRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='position_requests')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='position_requests')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='requests')
    committee = models.ForeignKey(Committee, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_position_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.get_full_name()} -> {self.position.name_ar} ({self.status})"
