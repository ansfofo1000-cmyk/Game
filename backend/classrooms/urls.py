from django.urls import path
from .views import (
    ClassroomListView,
    ClassroomDetailView,
    PositionListView,
    CommitteeListView,
    PositionRequestListView,
    PositionRequestReviewView
)

urlpatterns = [
    path('', ClassroomListView.as_view(), name='classroom-list'),
    path('<int:pk>/', ClassroomDetailView.as_view(), name='classroom-detail'),
    path('positions/', PositionListView.as_view(), name='position-list'),
    path('committees/', CommitteeListView.as_view(), name='committee-list'),
    path('position-requests/', PositionRequestListView.as_view(), name='position-request-list'),
    path('position-requests/<int:pk>/review/', PositionRequestReviewView.as_view(), name='position-request-review'),
]
