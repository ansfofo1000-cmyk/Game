from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        unread_count = notifications.filter(is_read=False).count()
        return Response({
            'unread_count': unread_count,
            'notifications': NotificationSerializer(notifications[:50], many=True).data
        })


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'message': 'تم تعليم الإشعار كمقروء / Notification marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'الإشعار غير موجود / Notification not found'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'تم تعليم جميع الإشعارات كمقروءة / All notifications marked as read'})
