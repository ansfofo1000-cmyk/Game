from django.urls import path
from .views import (
    ChallengeListCreateView,
    ChallengeDetailView,
    JoinChallengeView,
    CompleteChallengeView
)

urlpatterns = [
    path('', ChallengeListCreateView.as_view(), name='challenges-list-create'),
    path('<int:pk>/', ChallengeDetailView.as_view(), name='challenge-detail'),
    path('<int:pk>/join/', JoinChallengeView.as_view(), name='challenge-join'),
    path('<int:pk>/complete/', CompleteChallengeView.as_view(), name='challenge-complete'),
]
