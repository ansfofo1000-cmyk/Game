from django.urls import path
from .views import (
    LeaderboardView,
    AchievementsListView,
    ManualAwardAchievementView,
    LevelsListView
)

urlpatterns = [
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('achievements/', AchievementsListView.as_view(), name='achievements-list'),
    path('achievements/award/', ManualAwardAchievementView.as_view(), name='achievements-award'),
    path('levels/', LevelsListView.as_view(), name='levels-list'),
]
