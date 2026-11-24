from django.urls import path
from .views import (
    CSRFTokenView,
    RegisterStudentView,
    RegisterTeacherView,
    LoginView,
    LogoutView,
    MeView,
    UpdateProfileView,
    PendingTeachersView,
    ApproveTeacherView,
    RejectTeacherView,
    UserManagementView,
    ToggleUserStatusView,
    TeacherInvitationCodeManagementView,
    TeachersDirectoryView
)

urlpatterns = [
    path('csrf/', CSRFTokenView.as_view(), name='auth-csrf'),
    path('register/student/', RegisterStudentView.as_view(), name='register-student'),
    path('register/teacher/', RegisterTeacherView.as_view(), name='register-teacher'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    
    # Teachers Directory (Public for students/teachers)
    path('teachers/directory/', TeachersDirectoryView.as_view(), name='teachers-directory'),

    # Admin Management
    path('admin/teachers/pending/', PendingTeachersView.as_view(), name='admin-pending-teachers'),
    path('admin/teachers/<int:pk>/approve/', ApproveTeacherView.as_view(), name='admin-approve-teacher'),
    path('admin/teachers/<int:pk>/reject/', RejectTeacherView.as_view(), name='admin-reject-teacher'),
    path('admin/users/', UserManagementView.as_view(), name='admin-users-list'),
    path('admin/users/<int:pk>/toggle-status/', ToggleUserStatusView.as_view(), name='admin-toggle-user-status'),
    path('admin/teacher-codes/', TeacherInvitationCodeManagementView.as_view(), name='admin-teacher-codes'),
]
