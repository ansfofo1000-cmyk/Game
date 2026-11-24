from django.db import models
from django.contrib.auth.models import AbstractUser
from classrooms.models import Classroom, Position, Committee

class User(AbstractUser):
    ROLE_STUDENT = 'STUDENT'
    ROLE_TEACHER = 'TEACHER'
    ROLE_ADMIN = 'ADMIN'

    ROLE_CHOICES = [
        (ROLE_STUDENT, 'Student'),
        (ROLE_TEACHER, 'Teacher'),
        (ROLE_ADMIN, 'Administrator'),
    ]

    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_SUSPENDED = 'SUSPENDED'
    STATUS_REJECTED = 'REJECTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending Approval'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_SUSPENDED, 'Suspended'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_APPROVED, db_index=True)
    full_name = models.CharField(max_length=200, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    @property
    def is_student(self):
        return self.role == self.ROLE_STUDENT

    @property
    def is_teacher(self):
        return self.role == self.ROLE_TEACHER

    @property
    def is_admin_role(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser or self.is_staff

    def __str__(self):
        name = self.full_name or self.username
        return f"{name} ({self.role} - {self.status})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='students')
    approved_position = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True, blank=True, related_name='active_students')
    approved_committee = models.ForeignKey(Committee, on_delete=models.SET_NULL, null=True, blank=True, related_name='active_students')
    points = models.IntegerField(default=0, db_index=True)
    coins = models.IntegerField(default=0, db_index=True)
    level = models.CharField(max_length=100, default='مبتدئ / Beginner')
    avatar = models.CharField(max_length=255, blank=True, default='')
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-points', '-coins', 'user__first_name', 'user__last_name', 'id']

    def __str__(self):
        return f"{self.user.full_name or self.user.username} [{self.classroom.name}] - P:{self.points} C:{self.coins}"


class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    subject = models.CharField(max_length=150, blank=True)
    assigned_classrooms = models.ManyToManyField(Classroom, related_name='teachers', blank=True)
    is_approved = models.BooleanField(default=False, db_index=True)
    approval_date = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_teachers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.full_name or self.user.username} ({self.subject}) - Approved: {self.is_approved}"


class TeacherInvitationCode(models.Model):
    code = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    max_uses = models.IntegerField(default=100)
    current_uses = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Code {self.code} ({self.current_uses}/{self.max_uses}) - Active: {self.is_active}"
