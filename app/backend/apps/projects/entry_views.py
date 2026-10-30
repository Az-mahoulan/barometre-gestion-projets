"""Saisie des jalons et des livrables d'un projet (responsable du projet ou administrateur)."""

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .access import can_manage_project, visible_projects
from .models import ActivityLog, Deliverable, Milestone, Project


def _check_dates(project: Project, day, field: str):
    """Une échéance doit tomber pendant le projet (du début à la fin prévue)."""
    if day is not None and not (project.start_date <= day <= project.end_date):
        raise serializers.ValidationError(
            {field: f"La date doit être comprise entre le début ({project.start_date:%d/%m/%Y}) et la fin prévue ({project.end_date:%d/%m/%Y}) du projet."}
        )


class MilestoneSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    due_date = serializers.DateField()
    achieved_on = serializers.DateField(required=False, allow_null=True)
    depends_on = serializers.ListField(child=serializers.IntegerField(min_value=1), required=False, max_length=50)


class DeliverableSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    due_date = serializers.DateField()
    delivered_on = serializers.DateField(required=False, allow_null=True)


def _project_for(user, pk) -> Project:
    project = get_object_or_404(visible_projects(user), pk=pk)
    if not can_manage_project(user, project):
        raise PermissionDenied("Seul le responsable du projet (ou un administrateur) peut modifier ses jalons et livrables.")
    return project


def _log(project, user, message):
    ActivityLog.objects.create(project=project, actor=user, message=f"{user.display_name} {message}")


def _set_dependencies(milestone: Milestone, ids: list[int]):
    """Dépendances : jalons du même projet, jamais lui-même, sans boucle (A dépend de B qui dépend de A)."""
    ids = set(ids) - {milestone.id}
    others = {m.id: m for m in Milestone.objects.filter(project=milestone.project, id__in=ids).prefetch_related("depends_on")}
    if len(others) != len(ids):
        raise serializers.ValidationError({"depends_on": "Un jalon ne peut dépendre que d'autres jalons du même projet."})
    # Refus des boucles : aucun des jalons choisis ne doit dépendre (même indirectement) de celui-ci.
    graph = {m.id: {d.id for d in m.depends_on.all()} for m in Milestone.objects.filter(project=milestone.project).prefetch_related("depends_on")}
    graph[milestone.id] = ids
    seen, stack = set(), list(ids)
    while stack:
        cur = stack.pop()
        if cur == milestone.id:
            raise serializers.ValidationError({"depends_on": "Ces dépendances formeraient une boucle entre jalons."})
        if cur not in seen:
            seen.add(cur)
            stack.extend(graph.get(cur, ()))
    milestone.depends_on.set(others.values())


class MilestoneCreateView(APIView):
    @extend_schema(request=MilestoneSerializer, responses={201: serializers.DictField()})
    def post(self, request, pk):
        project = _project_for(request.user, pk)
        data = MilestoneSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        d = data.validated_data
        _check_dates(project, d["due_date"], "due_date")
        m = Milestone.objects.create(project=project, name=d["name"], due_date=d["due_date"], achieved_on=d.get("achieved_on"))
        if d.get("depends_on"):
            _set_dependencies(m, d["depends_on"])
        _log(project, request.user, f"a ajouté le jalon « {m.name} »")
        return Response({"id": m.id}, status=status.HTTP_201_CREATED)


class MilestoneView(APIView):
    def _get(self, request, pk) -> Milestone:
        m = get_object_or_404(Milestone.objects.select_related("project"), pk=pk, project__in=visible_projects(request.user))
        if not can_manage_project(request.user, m.project):
            raise PermissionDenied("Seul le responsable du projet (ou un administrateur) peut modifier ses jalons.")
        return m

    @extend_schema(request=MilestoneSerializer, responses={200: serializers.DictField()})
    def patch(self, request, pk):
        m = self._get(request, pk)
        data = MilestoneSerializer(data=request.data, partial=True)
        data.is_valid(raise_exception=True)
        d = data.validated_data
        if "due_date" in d:
            _check_dates(m.project, d["due_date"], "due_date")
        was_achieved = m.is_achieved
        for k in ("name", "due_date", "achieved_on"):
            if k in d:
                setattr(m, k, d[k])
        m.save()
        if "depends_on" in d:
            _set_dependencies(m, d["depends_on"])
        if not was_achieved and m.is_achieved:
            _log(m.project, request.user, f"a marqué le jalon « {m.name} » comme atteint")
        elif was_achieved and not m.is_achieved:
            _log(m.project, request.user, f"a rouvert le jalon « {m.name} »")
        else:
            _log(m.project, request.user, f"a modifié le jalon « {m.name} »")
        return Response({"id": m.id})

    @extend_schema(responses={204: None})
    def delete(self, request, pk):
        m = self._get(request, pk)
        _log(m.project, request.user, f"a supprimé le jalon « {m.name} »")
        m.delete()  # les activités rattachées perdent simplement leur jalon (SET_NULL)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeliverableCreateView(APIView):
    @extend_schema(request=DeliverableSerializer, responses={201: serializers.DictField()})
    def post(self, request, pk):
        project = _project_for(request.user, pk)
        data = DeliverableSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        d = data.validated_data
        _check_dates(project, d["due_date"], "due_date")
        x = Deliverable.objects.create(project=project, **d)
        _log(project, request.user, f"a ajouté le livrable « {x.name} »")
        return Response({"id": x.id}, status=status.HTTP_201_CREATED)


class DeliverableView(APIView):
    def _get(self, request, pk) -> Deliverable:
        x = get_object_or_404(Deliverable.objects.select_related("project"), pk=pk, project__in=visible_projects(request.user))
        if not can_manage_project(request.user, x.project):
            raise PermissionDenied("Seul le responsable du projet (ou un administrateur) peut modifier ses livrables.")
        return x

    @extend_schema(request=DeliverableSerializer, responses={200: serializers.DictField()})
    def patch(self, request, pk):
        x = self._get(request, pk)
        data = DeliverableSerializer(data=request.data, partial=True)
        data.is_valid(raise_exception=True)
        d = data.validated_data
        if "due_date" in d:
            _check_dates(x.project, d["due_date"], "due_date")
        was = x.is_delivered
        for k, v in d.items():
            setattr(x, k, v)
        x.save()
        if not was and x.is_delivered:
            _log(x.project, request.user, f"a remis le livrable « {x.name} »")
        else:
            _log(x.project, request.user, f"a modifié le livrable « {x.name} »")
        return Response({"id": x.id})

    @extend_schema(responses={204: None})
    def delete(self, request, pk):
        x = self._get(request, pk)
        _log(x.project, request.user, f"a supprimé le livrable « {x.name} »")
        x.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
