from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from accounts.permissions import IsAdminUserRole

class ActivityLogListView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        action_type = request.query_params.get('action_type')
        classroom_id = request.query_params.get('classroom_id')
        user_id = request.query_params.get('user_id')

        qs = ActivityLog.objects.all().select_related('actor', 'target_user', 'classroom')

        if action_type:
            qs = qs.filter(action_type=action_type)
        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if user_id:
            qs = qs.filter(actor_id=user_id)

        return Response(ActivityLogSerializer(qs[:100], many=True).data)
