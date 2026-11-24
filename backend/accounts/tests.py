from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, StudentProfile, TeacherProfile, TeacherInvitationCode
from classrooms.models import Classroom, Position, Committee

class AuthenticationAndRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Seed classrooms
        self.wheeler2 = Classroom.objects.create(name='Wheeler 2', name_ar='ويلر 2')
        self.wheeler3 = Classroom.objects.create(name='Wheeler 3', name_ar='ويلر 3')

        # Seed positions
        self.monitor = Position.objects.create(name_ar='أمين الفصل', name_en='Class Monitor', is_exclusive=True)
        self.reporter = Position.objects.create(name_ar='مقرر', name_en='Reporter', is_exclusive=False, requires_committee=True)
        self.sci_comm = Committee.objects.create(name_ar='المقرر العلمي', name_en='Scientific Committee')

        # Seed access code
        TeacherInvitationCode.objects.create(code='teach2026', is_active=True, max_uses=100)

        # Admin user
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@school.edu',
            password='AdminPass2026!',
            role=User.ROLE_ADMIN,
            status=User.STATUS_APPROVED
        )

    def test_student_registration_success(self):
        url = reverse('register-student')
        payload = {
            'full_name': 'Zaid Omar',
            'email': 'zaid@student.edu',
            'password': 'password123',
            'confirm_password': 'password123',
            'classroom_id': self.wheeler2.id,
            'position_id': self.monitor.id,
            'notes': 'I want to be class monitor'
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['role'], 'STUDENT')
        self.assertEqual(res.data['status'], 'APPROVED')

        student = User.objects.get(email='zaid@student.edu')
        self.assertEqual(student.student_profile.classroom, self.wheeler2)
        self.assertEqual(student.student_profile.points, 0)
        self.assertEqual(student.student_profile.coins, 0)
        self.assertIsNone(student.student_profile.approved_position) # Request is pending approval!

    def test_student_registration_duplicate_email(self):
        url = reverse('register-student')
        payload = {
            'full_name': 'Zaid Omar',
            'email': 'zaid@student.edu',
            'password': 'password123',
            'confirm_password': 'password123',
            'classroom_id': self.wheeler2.id
        }
        self.client.post(url, payload, format='json')
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_registration_valid_code(self):
        url = reverse('register-teacher')
        payload = {
            'full_name': 'Mr. Hani',
            'email': 'hani@teacher.edu',
            'password': 'password123',
            'confirm_password': 'password123',
            'subject': 'Physics',
            'access_code': 'teach2026',
            'classroom_ids': [self.wheeler2.id]
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        teacher = User.objects.get(email='hani@teacher.edu')
        self.assertEqual(teacher.role, User.ROLE_TEACHER)
        self.assertEqual(teacher.status, User.STATUS_PENDING) # Starts in Pending!
        self.assertFalse(teacher.teacher_profile.is_approved)

    def test_teacher_registration_invalid_code(self):
        url = reverse('register-teacher')
        payload = {
            'full_name': 'Intruder',
            'email': 'intruder@fake.edu',
            'password': 'password123',
            'confirm_password': 'password123',
            'subject': 'Math',
            'access_code': 'wrongcode',
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('access_code', res.data)

    def test_pending_teacher_cannot_login_until_approved(self):
        # Register teacher
        teacher = User.objects.create_user(
            username='pending_teacher',
            email='pending@teacher.edu',
            password='password123',
            role=User.ROLE_TEACHER,
            status=User.STATUS_PENDING
        )
        TeacherProfile.objects.create(user=teacher, subject='Math', is_approved=False)

        login_url = reverse('auth-login')
        res = self.client.post(login_url, {'email': 'pending@teacher.edu', 'password': 'password123'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin approves teacher
        self.client.force_authenticate(user=self.admin)
        approve_url = reverse('admin-approve-teacher', kwargs={'pk': teacher.id})
        approve_res = self.client.post(approve_url, {'classroom_ids': [self.wheeler2.id]}, format='json')
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        # Now login succeeds
        self.client.force_authenticate(user=None)
        res_after = self.client.post(login_url, {'email': 'pending@teacher.edu', 'password': 'password123'}, format='json')
        self.assertEqual(res_after.status_code, status.HTTP_200_OK)
