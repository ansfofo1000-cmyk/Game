from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, StudentProfile, TeacherProfile
from classrooms.models import Classroom
from points.models import PointsTransaction, CoinsTransaction
from gamification.models import Level

class PointsAndCoinsTransactionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Classrooms
        self.wheeler2 = Classroom.objects.create(name='Wheeler 2')
        self.wheeler3 = Classroom.objects.create(name='Wheeler 3')

        # Levels
        Level.objects.create(name_ar='مبتدئ', name_en='Beginner', min_points=0, max_points=49)
        Level.objects.create(name_ar='طالب نشط', name_en='Active Student', min_points=50, max_points=99)
        Level.objects.create(name_ar='متميز', name_en='Achiever', min_points=100, max_points=199)

        # Approved Teacher 1 (assigned to Wheeler 2)
        self.teacher1 = User.objects.create_user(
            username='teacher1',
            email='t1@school.edu',
            password='password123',
            role=User.ROLE_TEACHER,
            status=User.STATUS_APPROVED
        )
        self.teacher1_profile = TeacherProfile.objects.create(user=self.teacher1, is_approved=True)
        self.teacher1_profile.assigned_classrooms.add(self.wheeler2)

        # Student 1 (Wheeler 2)
        self.student1 = User.objects.create_user(
            username='student1',
            email='s1@school.edu',
            password='password123',
            role=User.ROLE_STUDENT,
            status=User.STATUS_APPROVED
        )
        self.student1_profile = StudentProfile.objects.create(
            user=self.student1,
            classroom=self.wheeler2,
            points=0,
            coins=0
        )

        # Student 2 (Wheeler 3)
        self.student2 = User.objects.create_user(
            username='student2',
            email='s2@school.edu',
            password='password123',
            role=User.ROLE_STUDENT,
            status=User.STATUS_APPROVED
        )
        self.student2_profile = StudentProfile.objects.create(
            user=self.student2,
            classroom=self.wheeler3,
            points=0,
            coins=0
        )

    def test_teacher_can_add_points_with_reason(self):
        self.client.force_authenticate(user=self.teacher1)
        url = reverse('points-add')
        payload = {
            'student_id': self.student1.id,
            'amount': 25,
            'reason': 'حل مسألة رياضية صعبة والمشاركة الفعالة',
            'category': 'ACADEMIC'
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.student1_profile.refresh_from_db()
        self.assertEqual(self.student1_profile.points, 25)

        tx = PointsTransaction.objects.filter(student=self.student1).first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.amount, 25)
        self.assertEqual(tx.previous_balance, 0)
        self.assertEqual(tx.new_balance, 25)
        self.assertEqual(tx.teacher, self.teacher1)

    def test_points_deduction_and_negative_balance_prevention(self):
        # First give student 10 points
        self.student1_profile.points = 10
        self.student1_profile.save()

        self.client.force_authenticate(user=self.teacher1)
        url = reverse('points-deduct')

        # Try to deduct 20 points (would result in -10, which must be rejected!)
        res = self.client.post(url, {
            'student_id': self.student1.id,
            'amount': 20,
            'reason': 'عدم تسليم النشاط'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Deduct valid 5 points (balance becomes 5)
        res_valid = self.client.post(url, {
            'student_id': self.student1.id,
            'amount': 5,
            'reason': 'عدم إحضار الكتاب المدرسي'
        }, format='json')
        self.assertEqual(res_valid.status_code, status.HTTP_201_CREATED)

        self.student1_profile.refresh_from_db()
        self.assertEqual(self.student1_profile.points, 5)

    def test_student_cannot_add_or_deduct_points(self):
        self.client.force_authenticate(user=self.student1)
        url = reverse('points-add')
        res = self.client.post(url, {
            'student_id': self.student1.id,
            'amount': 100,
            'reason': 'Self award attempt'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_manage_student_in_unauthorized_classroom(self):
        # Teacher 1 is assigned only to Wheeler 2; Student 2 is in Wheeler 3
        self.client.force_authenticate(user=self.teacher1)
        url = reverse('points-add')
        res = self.client.post(url, {
            'student_id': self.student2.id,
            'amount': 15,
            'reason': 'Attempt outside assigned classroom'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_coins_award_and_history(self):
        self.client.force_authenticate(user=self.teacher1)
        url = reverse('coins-award')
        res = self.client.post(url, {
            'student_id': self.student1.id,
            'amount': 5,
            'reason': 'المبادرة الإبداعية في تنظيم ركن الفصل'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.student1_profile.refresh_from_db()
        self.assertEqual(self.student1_profile.coins, 5)

        tx = CoinsTransaction.objects.filter(student=self.student1).first()
        self.assertIsNotNone(tx)
        self.assertEqual(tx.amount, 5)
        self.assertEqual(tx.teacher, self.teacher1)
