from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from django.db import transaction
from .models import User, StudentProfile, TeacherProfile, TeacherInvitationCode
from classrooms.models import Classroom, Position, Committee, PositionRequest

class StudentRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True)
    classroom_id = serializers.IntegerField(required=True)
    position_id = serializers.IntegerField(required=False, allow_null=True)
    committee_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("البريد الإلكتروني مسجل بالفعل في المنصة / Email is already registered")
        return email

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "كلمات المرور غير متطابقة / Passwords do not match"})
        
        # Classroom validation
        try:
            classroom = Classroom.objects.get(id=data['classroom_id'])
            data['classroom_instance'] = classroom
        except Classroom.DoesNotExist:
            raise serializers.ValidationError({"classroom_id": "الفصل المحدد غير موجود / Selected classroom does not exist"})

        # Position validation
        pos_id = data.get('position_id')
        if pos_id:
            try:
                position = Position.objects.get(id=pos_id)
                data['position_instance'] = position
                if position.requires_committee:
                    com_id = data.get('committee_id')
                    if not com_id:
                        raise serializers.ValidationError({"committee_id": "يجب اختيار اللجنة المقررة عند اختيار صفة مقرر / Committee selection is required for Reporter"})
                    try:
                        committee = Committee.objects.get(id=com_id)
                        data['committee_instance'] = committee
                    except Committee.DoesNotExist:
                        raise serializers.ValidationError({"committee_id": "اللجنة المختارة غير صالحة / Invalid committee selected"})
            except Position.DoesNotExist:
                raise serializers.ValidationError({"position_id": "المنصب المحدد غير صالح / Invalid position selected"})

        return data

    def create(self, validated_data):
        with transaction.atomic():
            email = validated_data['email']
            full_name = validated_data['full_name'].strip()
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Backend explicitly assigns Student role
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                role=User.ROLE_STUDENT,
                status=User.STATUS_APPROVED
            )
            user.set_password(validated_data['password'])
            user.save()

            # Create Student Profile with 0 Points, 0 Coins, Beginner Level
            student_profile = StudentProfile.objects.create(
                user=user,
                classroom=validated_data['classroom_instance'],
                points=0,
                coins=0,
                level='مبتدئ / Beginner',
                bio=validated_data.get('notes', '')
            )

            # If student requested a position, create a PositionRequest
            pos_instance = validated_data.get('position_instance')
            if pos_instance:
                PositionRequest.objects.create(
                    student=user,
                    classroom=validated_data['classroom_instance'],
                    position=pos_instance,
                    committee=validated_data.get('committee_instance'),
                    status='PENDING',
                    notes=validated_data.get('notes', '')
                )

            return user


class TeacherRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True)
    subject = serializers.CharField(max_length=150, required=True)
    access_code = serializers.CharField(max_length=100, required=True)
    classroom_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=[])

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("البريد الإلكتروني مسجل بالفعل / Email is already registered")
        return email

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "كلمات المرور غير متطابقة / Passwords do not match"})

        # Validate Teacher Access Code
        code = data.get('access_code', '').strip()
        env_code = getattr(settings, 'TEACHER_REGISTRATION_CODE', 'teach2026').strip()
        
        is_valid_code = (code == env_code)
        if not is_valid_code:
            # Check database invitation codes
            db_code = TeacherInvitationCode.objects.filter(code=code, is_active=True).first()
            if db_code and db_code.current_uses < db_code.max_uses:
                is_valid_code = True
                data['db_code_instance'] = db_code

        if not is_valid_code:
            raise serializers.ValidationError({"access_code": "كود تسجيل المعلم غير صحيح أو غير مفعل / Invalid teacher access code"})

        return data

    def create(self, validated_data):
        with transaction.atomic():
            email = validated_data['email']
            full_name = validated_data['full_name'].strip()
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Backend assigns TEACHER role, status PENDING
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                role=User.ROLE_TEACHER,
                status=User.STATUS_PENDING
            )
            user.set_password(validated_data['password'])
            user.save()

            teacher_profile = TeacherProfile.objects.create(
                user=user,
                subject=validated_data.get('subject', '').strip(),
                is_approved=False
            )

            # Assign classrooms if provided
            classroom_ids = validated_data.get('classroom_ids', [])
            if classroom_ids:
                classrooms = Classroom.objects.filter(id__in=classroom_ids)
                teacher_profile.assigned_classrooms.set(classrooms)

            # Update DB invitation code usage if used
            if 'db_code_instance' in validated_data:
                db_code = validated_data['db_code_instance']
                db_code.current_uses += 1
                db_code.save()

            return user


class StudentProfileDetailSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    classroom_name_ar = serializers.CharField(source='classroom.name_ar', read_only=True)
    position_name_ar = serializers.CharField(source='approved_position.name_ar', read_only=True, default=None)
    position_name_en = serializers.CharField(source='approved_position.name_en', read_only=True, default=None)
    committee_name_ar = serializers.CharField(source='approved_committee.name_ar', read_only=True, default=None)
    committee_name_en = serializers.CharField(source='approved_committee.name_en', read_only=True, default=None)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'classroom', 'classroom_name', 'classroom_name_ar',
            'approved_position', 'position_name_ar', 'position_name_en',
            'approved_committee', 'committee_name_ar', 'committee_name_en',
            'points', 'coins', 'level', 'avatar', 'bio', 'created_at'
        ]


class TeacherProfileDetailSerializer(serializers.ModelSerializer):
    assigned_classrooms_data = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'subject', 'assigned_classrooms', 'assigned_classrooms_data',
            'is_approved', 'approval_date'
        ]

    def get_assigned_classrooms_data(self, obj):
        return [
            {'id': c.id, 'name': c.name, 'name_ar': c.name_ar}
            for c in obj.assigned_classrooms.all()
        ]


class UserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileDetailSerializer(read_only=True)
    teacher_profile = TeacherProfileDetailSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'status',
            'is_staff', 'is_superuser', 'student_profile', 'teacher_profile', 'date_joined'
        ]
