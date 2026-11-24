from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, StudentProfile, TeacherProfile
from classrooms.models import Classroom
from gamification.models import Level, Achievement, StudentAchievement
from points.services import process_points_transaction
from points.models import PointsTransaction

class GamificationAndLeaderboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.w2 = Classroom.objects.create(name='Wheeler 2')
        self.w3 = Classroom.objects.create(name='Wheeler 3')

        # Levels
        self.lvl_beg = Level.objects.create(name_ar='مبتدئ', name_en='Beginner', min_points=0, max_points=49)
        self.lvl_act = Level.objects.create(name_ar='طالب نشط', name_en='Active Student', min_points=50, max_points=99)
        self.lvl_ach = Level.objects.create(name_ar='متميز', name_en='Achiever', min_points=100, max_points=199)

        # Achievements
        self.ach_first = Achievement.objects.create(
            slug='first-achievement',
            name_ar='الإنجاز الأول',
            name_en='First Achievement',
            condition_type='FIRST_POINTS',
            condition_value=1
        )
        self.ach_active = Achievement.objects.create(
            slug='active-student-badge',
            name_ar='طالب نشط',
            name_en='Active Student',
            condition_type='POINTS_THRESHOLD',
            condition_value=50
        )

        # Teacher
        self.teacher = User.objects.create_user(username='t_lead', email='tl@school.edu', password='p', role=User.ROLE_TEACHER, status=User.STATUS_APPROVED)
        tp = TeacherProfile.objects.create(user=self.teacher, is_approved=True)
        tp.assigned_classrooms.add(self.w2, self.w3)

        # Students
        # Student A: 100 points, 10 coins
        self.sA = User.objects.create_user(username='stuA', first_name='Adam', last_name='Z', email='a@school.edu', password='p', role=User.ROLE_STUDENT, status=User.STATUS_APPROVED)
        self.spA = StudentProfile.objects.create(user=self.sA, classroom=self.w2, points=100, coins=10)

        # Student B: 100 points, 20 coins (Tied in points with A, but higher coins!)
        self.sB = User.objects.create_user(username='stuB', first_name='Bilal', last_name='A', email='b@school.edu', password='p', role=User.ROLE_STUDENT, status=User.STATUS_APPROVED)
        self.spB = StudentProfile.objects.create(user=self.sB, classroom=self.w2, points=100, coins=20)

        # Student C: 50 points
        self.sC = User.objects.create_user(username='stuC', first_name='Camil', last_name='M', email='c@school.edu', password='p', role=User.ROLE_STUDENT, status=User.STATUS_APPROVED)
        self.spC = StudentProfile.objects.create(user=self.sC, classroom=self.w3, points=50, coins=5)

    def test_leaderboard_shared_rank_and_deterministic_order(self):
        url = reverse('leaderboard')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        ranking = res.data['ranking']
        self.assertEqual(len(ranking), 3)

        # Both student A and B have 100 points -> both must share Rank 1
        self.assertEqual(ranking[0]['rank'], 1)
        self.assertEqual(ranking[1]['rank'], 1)

        # Deterministic tie-breaking: Student B has 20 coins vs Student A's 10 coins -> B comes first in display order
        self.assertEqual(ranking[0]['user_id'], self.sB.id)
        self.assertEqual(ranking[1]['user_id'], self.sA.id)

        # Next student C has 50 points -> competition rank must be 3
        self.assertEqual(ranking[2]['rank'], 3)
        self.assertEqual(ranking[2]['user_id'], self.sC.id)

    def test_automatic_level_up_and_achievement_on_points_transaction(self):
        new_student = User.objects.create_user(username='stu_fresh', email='fresh@school.edu', password='p', role=User.ROLE_STUDENT, status=User.STATUS_APPROVED)
        sp = StudentProfile.objects.create(user=new_student, classroom=self.w2, points=0, coins=0)

        # Award 60 points
        process_points_transaction(
            student_user=new_student,
            amount=60,
            transaction_type=PointsTransaction.TYPE_ADD,
            reason='Outstanding performance in school project',
            category='ACADEMIC',
            teacher_user=self.teacher
        )

        sp.refresh_from_db()
        self.assertEqual(sp.points, 60)
        # Level must automatically update to Active Student
        self.assertIn('طالب نشط', sp.level)

        # Achievements: should have unlocked both 'first-achievement' and 'active-student-badge' (50 pts threshold)
        awarded_slugs = StudentAchievement.objects.filter(student=new_student).values_list('achievement__slug', flat=True)
        self.assertIn('first-achievement', awarded_slugs)
        self.assertIn('active-student-badge', awarded_slugs)
