from django.core.management.base import BaseCommand
from django.db import transaction
from classrooms.models import Classroom, Position, Committee
from gamification.models import Level, Achievement
from accounts.models import TeacherInvitationCode

class Command(BaseCommand):
    help = "Safely seed initial data for Class Champions without duplicates"

    def handle(self, *args, **options):
        self.stdout.write("Starting safe database seeding for Class Champions...")

        with transaction.atomic():
            # 1. Seed Classrooms (Wheeler 2 and Wheeler 3)
            classrooms_data = [
                {
                    'name': 'Wheeler 2',
                    'name_ar': 'ويلر 2',
                    'description': 'فصل ويلر 2 المتميز للمنافسة والأنشطة والريادة الصفية'
                },
                {
                    'name': 'Wheeler 3',
                    'name_ar': 'ويلر 3',
                    'description': 'فصل ويلر 3 الرائد للإبداع والمبادرات والمشاريع الصفية'
                }
            ]
            for c in classrooms_data:
                obj, created = Classroom.objects.get_or_create(
                    name=c['name'],
                    defaults={'name_ar': c['name_ar'], 'description': c['description']}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created Classroom: {obj.name}"))
                else:
                    self.stdout.write(f"Classroom already exists: {obj.name}")

            # 2. Seed Student Positions
            positions_data = [
                {
                    'name_ar': 'أمين الفصل',
                    'name_en': 'Class Monitor',
                    'description': 'مسؤول إدارة وتنظيم الفصل وتمثيل الطلاب أمام إدارة المدرسة والمعلمين',
                    'responsibilities': 'متابعة شؤون الطلاب، الحفاظ على الهدوء والنظام، التنسيق مع المعلمين ومقرري اللجان',
                    'is_exclusive': True,
                    'requires_committee': False
                },
                {
                    'name_ar': 'أمين مساعد',
                    'name_en': 'Assistant Monitor',
                    'description': 'معاونة أمين الفصل وتولي مهامه أثناء غيابه والمساعدة في تنسيق الأنشطة',
                    'responsibilities': 'مساعدة أمين الفصل، تنظيم السجلات، رصد الحضور والتنظيم الميداني',
                    'is_exclusive': True,
                    'requires_committee': False
                },
                {
                    'name_ar': 'مقرر',
                    'name_en': 'Reporter',
                    'description': 'قيادة إحدى اللجان الصفية المتخصصة وتنسيق فعالياتها ومبادراتها',
                    'responsibilities': 'إعداد الخطط والأنشطة التابعة للجنة المحددة ورصد مشاركات الطلاب',
                    'is_exclusive': False,
                    'requires_committee': True
                }
            ]
            for p in positions_data:
                obj, created = Position.objects.get_or_create(
                    name_en=p['name_en'],
                    defaults={
                        'name_ar': p['name_ar'],
                        'description': p['description'],
                        'responsibilities': p['responsibilities'],
                        'is_exclusive': p['is_exclusive'],
                        'requires_committee': p['requires_committee']
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created Position: {obj.name_ar}"))

            # 3. Seed Reporter Committees
            committees_data = [
                {
                    'name_ar': 'المقرر العلمي',
                    'name_en': 'Scientific Committee',
                    'description': 'مسؤول عن التجارب والمسابقات العلمية والبحث والاستكشاف المنهجي',
                    'responsibilities': 'تنظيم المسابقات العلمية وإدارة ركن العلوم في الفصل'
                },
                {
                    'name_ar': 'المقرر الثقافي',
                    'name_en': 'Cultural Committee',
                    'description': 'مسؤول عن الإذاعة المدرسية، المسابقات الثقافية، القراءة والمكتبة',
                    'responsibilities': 'تنظيم الفعاليات الأدبية والثقافية ومسابقات الإلقاء والمعرفة'
                },
                {
                    'name_ar': 'المقرر الاجتماعي',
                    'name_en': 'Social Committee',
                    'description': 'مسؤول عن العمل التطوعي، مساعدة الزملاء، وتعزيز روح التكافل',
                    'responsibilities': 'تنسيق المبادرات الخيرية وتنظيم المناسبات الاجتماعية والاحتفاء بالزملاء'
                },
                {
                    'name_ar': 'المقرر الرياضي',
                    'name_en': 'Sports Committee',
                    'description': 'مسؤول عن الدوريات الرياضية، اللياقة البدنية والأنشطة الحركية',
                    'responsibilities': 'تنظيم المنافسات الرياضية الداخلية وتشكيل فرق الفصل'
                },
                {
                    'name_ar': 'المقرر الفني',
                    'name_en': 'Artistic / Technical Committee',
                    'description': 'مسؤول عن تزيين الفصل، اللوحات الفنية، المعارض والابتكار التقني',
                    'responsibilities': 'إدارة المجلات الحائطية وتصميم لوحات الشرف وتنسيق المعارض'
                }
            ]
            for com in committees_data:
                obj, created = Committee.objects.get_or_create(
                    name_en=com['name_en'],
                    defaults={
                        'name_ar': com['name_ar'],
                        'description': com['description'],
                        'responsibilities': com['responsibilities']
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created Committee: {obj.name_ar}"))

            # 4. Seed Gamification Levels
            levels_data = [
                {'name_ar': 'مبتدئ', 'name_en': 'Beginner', 'min_points': 0, 'max_points': 49, 'icon': 'Shield', 'color': '#8EA8A4', 'order': 1},
                {'name_ar': 'طالب نشط', 'name_en': 'Active Student', 'min_points': 50, 'max_points': 99, 'icon': 'Zap', 'color': '#38BDF8', 'order': 2},
                {'name_ar': 'متميز', 'name_en': 'Achiever', 'min_points': 100, 'max_points': 199, 'icon': 'Award', 'color': '#53E0AD', 'order': 3},
                {'name_ar': 'بطل', 'name_en': 'Champion', 'min_points': 200, 'max_points': 349, 'icon': 'Crown', 'color': '#A78BFA', 'order': 4},
                {'name_ar': 'أسطورة', 'name_en': 'Legend', 'min_points': 350, 'max_points': None, 'icon': 'Flame', 'color': '#FBBF24', 'order': 5},
            ]
            for lvl in levels_data:
                obj, created = Level.objects.get_or_create(
                    min_points=lvl['min_points'],
                    defaults={
                        'name_ar': lvl['name_ar'],
                        'name_en': lvl['name_en'],
                        'max_points': lvl['max_points'],
                        'icon': lvl['icon'],
                        'color': lvl['color'],
                        'order': lvl['order']
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created Level: {obj.name_ar} ({obj.min_points}-{obj.max_points or '+'})"))

            # 5. Seed Achievements
            achievements_data = [
                {
                    'slug': 'first-achievement',
                    'name_ar': 'الإنجاز الأول',
                    'name_en': 'First Achievement',
                    'description_ar': 'الحصول على أول نقاط تشجيعية في الفصل الدراسي',
                    'description_en': 'Earned first points transaction in the classroom',
                    'icon': 'Sparkles',
                    'category': 'General',
                    'condition_type': 'FIRST_POINTS',
                    'condition_value': 1,
                    'badge_color': '#53E0AD'
                },
                {
                    'slug': 'active-student-badge',
                    'name_ar': 'طالب نشط',
                    'name_en': 'Active Student',
                    'description_ar': 'الوصول إلى 50 نقطة بنشاط واجتهاد متواصل',
                    'description_en': 'Reached 50 points threshold through active engagement',
                    'icon': 'Zap',
                    'category': 'Milestone',
                    'condition_type': 'POINTS_THRESHOLD',
                    'condition_value': 50,
                    'badge_color': '#38BDF8'
                },
                {
                    'slug': 'achiever-badge',
                    'name_ar': 'شارة التميز',
                    'name_en': 'Achiever Badge',
                    'description_ar': 'تخطي حاجز 100 نقطة والترقي إلى رتبة متميز',
                    'description_en': 'Reached 100 points milestone',
                    'icon': 'Award',
                    'category': 'Milestone',
                    'condition_type': 'POINTS_THRESHOLD',
                    'condition_value': 100,
                    'badge_color': '#53E0AD'
                },
                {
                    'slug': 'champion-crown',
                    'name_ar': 'تاج البطولة',
                    'name_en': 'Champion Crown',
                    'description_ar': 'الوصول إلى 200 نقطة ونيل لقب بطل الفصل',
                    'description_en': 'Reached 200 points milestone and became a Champion',
                    'icon': 'Crown',
                    'category': 'Milestone',
                    'condition_type': 'POINTS_THRESHOLD',
                    'condition_value': 200,
                    'badge_color': '#A78BFA'
                },
                {
                    'slug': 'legend-cup',
                    'name_ar': 'كأس الأسطورة',
                    'name_en': 'Legend Cup',
                    'description_ar': 'تخطي 350 نقطة والوصول إلى أرفع مراتب الفخر',
                    'description_en': 'Reached 350+ points and achieved Legend status',
                    'icon': 'Flame',
                    'category': 'Milestone',
                    'condition_type': 'POINTS_THRESHOLD',
                    'condition_value': 350,
                    'badge_color': '#FBBF24'
                },
                {
                    'slug': 'top-three-champion',
                    'name_ar': 'بطل منصة التتويج',
                    'name_en': 'Top Three Champion',
                    'description_ar': 'الوصول إلى المراكز الثلاثة الأولى في المتصدرين',
                    'description_en': 'Ranked in the top 3 on the leaderboard',
                    'icon': 'Trophy',
                    'category': 'Ranking',
                    'condition_type': 'TOP_THREE',
                    'condition_value': 3,
                    'badge_color': '#FBBF24'
                },
                {
                    'slug': 'top-ten-student',
                    'name_ar': 'قائمة الشرف العشرة',
                    'name_en': 'Top Ten Student',
                    'description_ar': 'الوصول إلى قائمة الطلاب العشرة الأوائل',
                    'description_en': 'Ranked in the top 10 on the leaderboard',
                    'icon': 'Medal',
                    'category': 'Ranking',
                    'condition_type': 'TOP_TEN',
                    'condition_value': 10,
                    'badge_color': '#CBD5E1'
                },
                {
                    'slug': 'helping-hand',
                    'name_ar': 'يد العون',
                    'name_en': 'Helping Hand',
                    'description_ar': 'مساعدة الزملاء والمساهمة الفعالة في العمل الخيري والتطوعي',
                    'description_en': 'Assisting peers and contributing to school initiatives',
                    'icon': 'HeartHandshake',
                    'category': 'Social',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#FB7185'
                },
                {
                    'slug': 'science-star',
                    'name_ar': 'نجم العلوم',
                    'name_en': 'Science Star',
                    'description_ar': 'التفوق في التجارب العلمية والمشاريع الاستكشافية',
                    'description_en': 'Excellence in science experiments and projects',
                    'icon': 'Atom',
                    'category': 'Academic',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#38BDF8'
                },
                {
                    'slug': 'creative-mind',
                    'name_ar': 'العقل المبدع',
                    'name_en': 'Creative Mind',
                    'description_ar': 'تقديم أفكار ابتكارية وأعمال فنية استثنائية',
                    'description_en': 'Demonstrating innovation and creative craftsmanship',
                    'icon': 'Lightbulb',
                    'category': 'Creative',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#A78BFA'
                },
                {
                    'slug': 'sports-champion',
                    'name_ar': 'بطل الرياضة',
                    'name_en': 'Sports Champion',
                    'description_ar': 'إظهار الروح الرياضية العالية والتفوق في الأنشطة البدنية',
                    'description_en': 'Outstanding sportsmanship and physical participation',
                    'icon': 'Activity',
                    'category': 'Sports',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#53E0AD'
                },
                {
                    'slug': 'team-player',
                    'name_ar': 'روح الفريق',
                    'name_en': 'Team Player',
                    'description_ar': 'التعاون النموذجي ودعم أفراد الفريق في المهام الصفية',
                    'description_en': 'Exemplary collaboration and supporting team members',
                    'icon': 'Users',
                    'category': 'Teamwork',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#38BDF8'
                },
                {
                    'slug': 'perfect-attendance',
                    'name_ar': 'الحضور المثالي',
                    'name_en': 'Perfect Attendance',
                    'description_ar': 'الالتزام التام بالحضور والانضباط اليومي دون انقطاع',
                    'description_en': 'Flawless attendance and daily punctuality',
                    'icon': 'CalendarCheck',
                    'category': 'Discipline',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#53E0AD'
                },
                {
                    'slug': 'classroom-hero',
                    'name_ar': 'بطل الفصل',
                    'name_en': 'Classroom Hero',
                    'description_ar': 'المبادرة الإيجابية في خدمة الفصل والحرص على نظافته وتنظيمه',
                    'description_en': 'Taking initiative to serve and organize the classroom',
                    'icon': 'ShieldAlert',
                    'category': 'Discipline',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#FBBF24'
                },
                {
                    'slug': 'perfect-commitment',
                    'name_ar': 'الالتزام التام',
                    'name_en': 'Perfect Commitment',
                    'description_ar': 'تسليم جميع الواجبات والمهام الموكلة بأعلى جودة وفي موعدها',
                    'description_en': 'Submitting all assigned tasks on time with quality',
                    'icon': 'CheckCircle2',
                    'category': 'Academic',
                    'condition_type': 'MANUAL',
                    'condition_value': 0,
                    'badge_color': '#53E0AD'
                }
            ]
            for ach in achievements_data:
                obj, created = Achievement.objects.get_or_create(
                    slug=ach['slug'],
                    defaults={
                        'name_ar': ach['name_ar'],
                        'name_en': ach['name_en'],
                        'description_ar': ach['description_ar'],
                        'description_en': ach['description_en'],
                        'icon': ach['icon'],
                        'category': ach['category'],
                        'condition_type': ach['condition_type'],
                        'condition_value': ach['condition_value'],
                        'badge_color': ach['badge_color']
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created Achievement: {obj.name_ar}"))

            # 6. Seed Teacher Registration Code
            code_obj, code_created = TeacherInvitationCode.objects.get_or_create(
                code='teach2026',
                defaults={
                    'is_active': True,
                    'max_uses': 500,
                    'current_uses': 0
                }
            )
            if code_created:
                self.stdout.write(self.style.SUCCESS("Created Teacher Access Code: teach2026"))

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
