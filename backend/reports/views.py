import csv
import io
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Avg, Max
from accounts.models import User, StudentProfile
from classrooms.models import Classroom, Committee
from points.models import PointsTransaction, CoinsTransaction
from gamification.models import StudentAchievement
from challenges.models import Challenge, ChallengeParticipation
from accounts.permissions import IsTeacherOrAdmin

class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')

        students_qs = StudentProfile.objects.filter(user__status=User.STATUS_APPROVED)
        points_qs = PointsTransaction.objects.all()
        coins_qs = CoinsTransaction.objects.all()

        if classroom_id:
            students_qs = students_qs.filter(classroom_id=classroom_id)
            points_qs = points_qs.filter(student__student_profile__classroom_id=classroom_id)
            coins_qs = coins_qs.filter(student__student_profile__classroom_id=classroom_id)

        total_students = students_qs.count()
        total_points = students_qs.aggregate(total=Sum('points'))['total'] or 0
        total_coins = students_qs.aggregate(total=Sum('coins'))['total'] or 0
        avg_points = round(total_points / total_students, 1) if total_students > 0 else 0

        # Points by Category
        categories = dict(PointsTransaction.CATEGORY_CHOICES)
        points_by_cat = []
        for cat_key, cat_label in categories.items():
            cat_sum = points_qs.filter(category=cat_key, amount__gt=0).aggregate(total=Sum('amount'))['total'] or 0
            points_by_cat.append({
                'category': cat_key,
                'label': cat_label.split('/')[0].strip(),
                'total_points': cat_sum
            })

        # Classroom comparison
        classroom_comparison = []
        for c in Classroom.objects.all():
            c_students = StudentProfile.objects.filter(classroom=c, user__status=User.STATUS_APPROVED)
            c_count = c_students.count()
            c_pts = c_students.aggregate(total=Sum('points'))['total'] or 0
            c_cns = c_students.aggregate(total=Sum('coins'))['total'] or 0
            c_avg = round(c_pts / c_count, 1) if c_count > 0 else 0
            classroom_comparison.append({
                'classroom_id': c.id,
                'name': c.name,
                'name_ar': c.name_ar,
                'student_count': c_count,
                'total_points': c_pts,
                'total_coins': c_cns,
                'average_points': c_avg
            })

        # Committee performance
        committee_performance = []
        for com in Committee.objects.all():
            com_students = StudentProfile.objects.filter(approved_committee=com)
            com_count = com_students.count()
            com_pts = com_students.aggregate(total=Sum('points'))['total'] or 0
            committee_performance.append({
                'id': com.id,
                'name_ar': com.name_ar,
                'name_en': com.name_en,
                'student_count': com_count,
                'total_points': com_pts
            })

        # Level distribution
        level_counts = {}
        for sp in students_qs:
            lvl_name = sp.level.split('/')[0].strip() if '/' in sp.level else sp.level
            level_counts[lvl_name] = level_counts.get(lvl_name, 0) + 1

        level_distribution = [{'level': k, 'count': v} for k, v in level_counts.items()]

        # Top students
        top_students = [
            {
                'id': sp.user.id,
                'name': sp.user.full_name or sp.user.username,
                'classroom': sp.classroom.name,
                'points': sp.points,
                'coins': sp.coins,
                'level': sp.level
            }
            for sp in students_qs.select_related('user', 'classroom').order_by('-points', '-coins')[:5]
        ]

        return Response({
            'overview': {
                'total_students': total_students,
                'total_points': total_points,
                'total_coins': total_coins,
                'average_points': avg_points,
                'total_teachers': User.objects.filter(role=User.ROLE_TEACHER, status=User.STATUS_APPROVED).count(),
                'total_achievements_awarded': StudentAchievement.objects.count(),
                'active_challenges': Challenge.objects.filter(status='ACTIVE').count()
            },
            'points_by_category': points_by_cat,
            'classroom_comparison': classroom_comparison,
            'committee_performance': committee_performance,
            'level_distribution': level_distribution,
            'top_students': top_students
        })


class ExportCSVReportView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="class_champions_report.csv"'
        # Write UTF-8 BOM so Excel opens Arabic correctly
        response.write('\ufeff'.encode('utf8'))

        writer = csv.writer(response)
        writer.writerow([
            'الترتيب / Rank',
            'اسم الطالب / Student Name',
            'البريد الإلكتروني / Email',
            'الفصل / Classroom',
            'المنصب / Position',
            'اللجنة / Committee',
            'النقاط / Points',
            'العملات / Coins',
            'المستوى / Level'
        ])

        qs = StudentProfile.objects.filter(user__status=User.STATUS_APPROVED).select_related(
            'user', 'classroom', 'approved_position', 'approved_committee'
        )
        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)

        sorted_students = qs.order_by('-points', '-coins', 'user__first_name', 'id')

        for rank, sp in enumerate(sorted_students, 1):
            writer.writerow([
                rank,
                sp.user.full_name or sp.user.username,
                sp.user.email,
                sp.classroom.name if sp.classroom else '',
                sp.approved_position.name_ar if sp.approved_position else '-',
                sp.approved_committee.name_ar if sp.approved_committee else '-',
                sp.points,
                sp.coins,
                sp.level
            ])

        return response


class ExportPDFReportView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def get(self, request):
        classroom_id = request.query_params.get('classroom_id')
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#101B1A'),
            alignment=1 # Center
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#555555'),
            alignment=1
        )

        elements.append(Paragraph("CLASS CHAMPIONS — أبطال الفصل", title_style))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph("Official School Competition & Leadership Leaderboard Report", subtitle_style))
        elements.append(Spacer(1, 15))

        qs = StudentProfile.objects.filter(user__status=User.STATUS_APPROVED).select_related(
            'user', 'classroom', 'approved_position'
        )
        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)

        sorted_students = qs.order_by('-points', '-coins', 'user__first_name', 'id')

        table_data = [
            ['Rank', 'Student Name', 'Classroom', 'Position', 'Points', 'Coins', 'Level']
        ]

        for rank, sp in enumerate(sorted_students[:40], 1):
            pos_name = sp.approved_position.name_en if sp.approved_position else '-'
            table_data.append([
                str(rank),
                sp.user.full_name or sp.user.username,
                sp.classroom.name if sp.classroom else '-',
                pos_name,
                str(sp.points),
                str(sp.coins),
                sp.level.split('/')[1].strip() if '/' in sp.level else sp.level
            ])

        t = Table(table_data, colWidths=[40, 150, 80, 100, 50, 50, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172827')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#53E0AD')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F1F5F9')])
        ]))

        elements.append(t)
        doc.build(elements)

        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="class_champions_report.pdf"'
        return response
