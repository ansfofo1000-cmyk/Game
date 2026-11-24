from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/classrooms/', include('classrooms.urls')),
    path('api/points/', include('points.urls')),
    path('api/gamification/', include('gamification.urls')),
    path('api/challenges/', include('challenges.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/reports/', include('reports.urls')),
]
