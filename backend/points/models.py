from django.db import models
from django.conf import settings

class PointsTransaction(models.Model):
    TYPE_ADD = 'ADD'
    TYPE_DEDUCT = 'DEDUCT'
    TYPE_ADJUSTMENT = 'ADJUSTMENT'

    TRANSACTION_TYPES = [
        (TYPE_ADD, 'Add Points'),
        (TYPE_DEDUCT, 'Deduct Points'),
        (TYPE_ADJUSTMENT, 'Administrative Adjustment'),
    ]

    CATEGORY_CHOICES = [
        ('ACADEMIC', 'التميز الأكاديمي / Academic Excellence'),
        ('HELPING', 'مساعدة الآخرين / Helping Others'),
        ('SPORTS', 'المشاركة الرياضية / Sports Participation'),
        ('ARTISTIC', 'الإبداع الفني / Artistic Creativity'),
        ('DISCIPLINE', 'الانضباط الصفي / Classroom Discipline'),
        ('TEAMWORK', 'العمل الجماعي / Teamwork'),
        ('VOLUNTEERING', 'العمل التطوعي / Volunteering'),
        ('OTHER', 'أخرى / Other'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='points_transactions')
    amount = models.IntegerField(help_text="Positive for addition, negative for deduction")
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default=TYPE_ADD, db_index=True)
    reason = models.TextField(help_text="Mandatory detailed reason")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER', db_index=True)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='awarded_points')
    previous_balance = models.IntegerField()
    new_balance = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        sign = "+" if self.amount > 0 else ""
        return f"{self.student.get_full_name()} {sign}{self.amount} ({self.reason[:30]})"


class CoinsTransaction(models.Model):
    TYPE_AWARD = 'AWARD'
    TYPE_DEDUCT = 'DEDUCT'
    TYPE_ADJUSTMENT = 'ADJUSTMENT'

    TRANSACTION_TYPES = [
        (TYPE_AWARD, 'Award Coins'),
        (TYPE_DEDUCT, 'Deduct Coins'),
        (TYPE_ADJUSTMENT, 'Administrative Adjustment'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coins_transactions')
    amount = models.IntegerField(help_text="Positive for award, negative for deduction")
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default=TYPE_AWARD, db_index=True)
    reason = models.TextField(help_text="Mandatory detailed reason")
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='awarded_coins')
    previous_balance = models.IntegerField()
    new_balance = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        sign = "+" if self.amount > 0 else ""
        return f"{self.student.get_full_name()} {sign}{self.amount} Coins ({self.reason[:30]})"
