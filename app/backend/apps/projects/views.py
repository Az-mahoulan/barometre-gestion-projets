from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import ListCreateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .access import can_manage_project, can_update_task_status, visible_projects
from .models import ActivityLog, Task
from .serializers import TaskSerializer, TaskStatusSerializer


class TaskListCreateView(ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.filter(project__in=visible_projects(self.request.user)).select_related(
            "project", "assignee"
        )
        if self.request.user.role == self.request.user.Role.MEMBRE and self.request.query_params.get("mine"):
            qs = qs.filter(assignee=self.request.user)
        project = self.request.query_params.get("project")
        return qs.filter(project_id=project) if project else qs

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        if not can_manage_project(self.request.user, project):
            raise PermissionDenied("Vous ne pouvez pas créer de tâche dans ce projet.")
        task = serializer.save()
        ActivityLog.objects.create(
            project=project, actor=self.request.user, message=f"{self.request.user.display_name} a ajouté « {task.title} »"
        )


class TaskStatusView(APIView):
    @extend_schema(request=TaskStatusSerializer, responses={200: TaskSerializer})
    def post(self, request, pk):
        task = get_object_or_404(Task.objects.select_related("project"), pk=pk, project__in=visible_projects(request.user))
        if not can_update_task_status(request.user, task):
            raise PermissionDenied("Vous ne pouvez modifier que vos propres tâches.")
        serializer = TaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        # L'approbation est réservée à ceux qui gèrent le projet.
        if new_status == Task.Status.APPROVED and not can_manage_project(request.user, task.project):
            raise PermissionDenied("Seul le responsable du projet peut approuver une tâche.")
        task.status = new_status
        task.save(update_fields=["status"])
        ActivityLog.objects.create(
            project=task.project,
            actor=request.user,
            message=f"{request.user.display_name} a passé « {task.title} » : {task.get_status_display().lower()}",
        )
        return Response(TaskSerializer(task).data)


class TaskRemindView(APIView):
    """Relance le responsable d'une tâche (enregistrée au journal ; l'envoi des notifications viendra ensuite)."""

    @extend_schema(request=None, responses={200: serializers.DictField()})
    def post(self, request, pk):
        task = get_object_or_404(Task.objects.select_related("project", "assignee"), pk=pk, project__in=visible_projects(request.user))
        if not can_manage_project(request.user, task.project):
            raise PermissionDenied("Seul le responsable du projet peut relancer.")
        who = task.assignee.display_name if task.assignee else "l'équipe"
        ActivityLog.objects.create(
            project=task.project, actor=request.user, message=f"{request.user.display_name} a relancé {who} pour « {task.title} »"
        )
        return Response({"detail": f"Relance enregistrée pour {who}."}, status=status.HTTP_200_OK)
