from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import date
from gamify.models import DailyGoal
from gamify.serializers import DailyGoalSerializer

class DailyGoalViewSet(viewsets.GenericViewSet):
    serializer_class = DailyGoalSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    queryset = DailyGoal.objects.all()

    @action(detail=False, methods=["get", "post"], url_path="today")
    def today(self, request):
        goal, created = DailyGoal.objects.get_or_create(
            user=request.user,
            date=date.today(),
            defaults={"target_minutes": 0, "achieved_minutes": 0}
        )

        if request.method == "POST":
            target_minutes = request.data.get("target_minutes")
            if target_minutes is None:
                return Response({"target_minutes": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            try:
                goal.target_minutes = int(target_minutes)
                goal.save()
            except (ValueError, TypeError):
                return Response({"target_minutes": ["A valid integer is required."]}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
