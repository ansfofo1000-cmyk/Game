import os
from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = "Safely initialize or update the system administrator account"

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default=None)
        parser.add_argument('--email', type=str, default=None)
        parser.add_argument('--password', type=str, default=None)

    def handle(self, *args, **options):
        username = options['username'] or os.getenv('ADMIN_DEFAULT_USERNAME', 'admin')
        email = options['email'] or os.getenv('ADMIN_DEFAULT_EMAIL', 'admin@classchampions.edu')
        password = options['password'] or os.getenv('ADMIN_DEFAULT_PASSWORD', 'AdminPass2026!')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'role': User.ROLE_ADMIN,
                'status': User.STATUS_APPROVED,
                'is_staff': True,
                'is_superuser': True,
                'full_name': 'System Administrator (مدير النظام)'
            }
        )

        user.set_password(password)
        user.role = User.ROLE_ADMIN
        user.status = User.STATUS_APPROVED
        user.is_staff = True
        user.is_superuser = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Successfully created administrator: {email}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully updated administrator credentials: {email}"))
