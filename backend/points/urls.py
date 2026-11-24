from django.urls import path
from .views import (
    AddPointsView,
    DeductPointsView,
    AwardCoinsView,
    AdminAdjustmentView,
    StudentPointsHistoryView,
    StudentCoinsHistoryView,
    ActivityFeedView
)

urlpatterns = [
    path('add/', AddPointsView.as_view(), name='points-add'),
    path('deduct/', DeductPointsView.as_view(), name='points-deduct'),
    path('coins/award/', AwardCoinsView.as_view(), name='coins-award'),
    path('adjustment/', AdminAdjustmentView.as_view(), name='points-adjustment'),
    path('history/', StudentPointsHistoryView.as_view(), name='points-history-self'),
    path('history/<int:student_id>/', StudentPointsHistoryView.as_view(), name='points-history-student'),
    path('coins/history/', StudentCoinsHistoryView.as_view(), name='coins-history-self'),
    path('coins/history/<int:student_id>/', StudentCoinsHistoryView.as_view(), name='coins-history-student'),
    path('activity/', ActivityFeedView.as_view(), name='activity-feed'),
]
