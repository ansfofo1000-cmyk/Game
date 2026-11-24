from rest_framework import permissions
from .models import User

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to administrators.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role)


class IsApprovedTeacher(permissions.BasePermission):
    """
    Allows access only to approved teachers.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_admin_role:
            return True
        if request.user.is_teacher and request.user.status == User.STATUS_APPROVED:
            profile = getattr(request.user, 'teacher_profile', None)
            return bool(profile and profile.is_approved)
        return False


class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Allows access to approved teachers or administrators.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_admin_role:
            return True
        if request.user.is_teacher and request.user.status == User.STATUS_APPROVED:
            profile = getattr(request.user, 'teacher_profile', None)
            return bool(profile and profile.is_approved)
        return False


class IsStudentRole(permissions.BasePermission):
    """
    Allows access only to students.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_student)
