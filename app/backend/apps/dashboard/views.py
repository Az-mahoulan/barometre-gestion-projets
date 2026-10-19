from django.db import connection
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Country

from apps.projects.models import Project

from .projects import (
    build_calendar,
    build_my_tasks,
    build_notifications,
    build_project_detail,
    build_projects_list,
    build_team_screen,
)
from .services import build_dashboard


class DashboardQuerySerializer(serializers.Serializer):
    country = serializers.CharField(required=False, allow_blank=True, max_length=2)
    period = serializers.ChoiceField(choices=["month", "quarter", "year"], required=False, default="year")
    week = serializers.IntegerField(required=False, default=0, min_value=-52, max_value=52)
    trend_project = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    tasks_project = serializers.IntegerField(required=False, allow_null=True, min_value=1)

    def validate_country(self, value):
        value = value.upper()
        if value and not Country.objects.filter(code=value).exists():
            raise serializers.ValidationError("Pays inconnu.")
        return value or None


class DashboardView(APIView):
    @extend_schema(
        parameters=[
            OpenApiParameter("country", str, description="Code pays ISO (ex. BJ)"),
            OpenApiParameter("period", str, enum=["month", "quarter", "year"]),
            OpenApiParameter("week", int, description="Décalage de la semaine affichée (0 = cette semaine)"),
            OpenApiParameter("trend_project", int, description="Limite l'évolution mensuelle à un projet"),
            OpenApiParameter("tasks_project", int, description="Limite la progression des tâches à un projet"),
        ],
        responses={200: serializers.DictField()},
    )
    def get(self, request):
        query = DashboardQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        return Response(
            build_dashboard(
                request.user,
                country=query.validated_data.get("country"),
                period=query.validated_data["period"],
                week=query.validated_data["week"],
                trend_project=query.validated_data.get("trend_project"),
                tasks_project=query.validated_data.get("tasks_project"),
            )
        )


class ProjectsQuerySerializer(serializers.Serializer):
    country = serializers.CharField(required=False, allow_blank=True, max_length=2)
    status = serializers.ChoiceField(choices=[c[0] for c in Project.Status.choices], required=False, allow_blank=True)
    q = serializers.CharField(required=False, allow_blank=True, max_length=80)

    def validate_country(self, value):
        return DashboardQuerySerializer().validate_country(value)


class ProjectsView(APIView):
    """Liste des projets visibles (filtres : pays, statut, recherche par nom)."""

    @extend_schema(
        parameters=[
            OpenApiParameter("country", str, description="Code pays ISO (ex. BJ)"),
            OpenApiParameter("status", str, enum=[c[0] for c in Project.Status.choices]),
            OpenApiParameter("q", str, description="Recherche dans le nom du projet"),
        ],
        responses={200: serializers.DictField()},
    )
    def get(self, request):
        query = ProjectsQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        d = query.validated_data
        return Response(build_projects_list(request.user, country=d.get("country"), status=d.get("status") or None, q=d.get("q", "")))


class ProjectDetailView(APIView):
    """Détail d'un projet visible : en-tête, tâches, jalons, activités, livrables, équipe, journal."""

    @extend_schema(responses={200: serializers.DictField()})
    def get(self, request, pk):
        data = build_project_detail(request.user, pk)
        if data is None:
            raise NotFound("Projet introuvable ou hors de votre périmètre.")
        return Response(data)


class MyTasksView(APIView):
    """Tâches de la personne connectée, ou des projets qu'elle gère (scope=projects, responsables et administrateurs)."""

    @extend_schema(parameters=[OpenApiParameter("scope", str, enum=["mine", "projects"])], responses={200: serializers.DictField()})
    def get(self, request):
        return Response(build_my_tasks(request.user, request.query_params.get("scope", "mine")))


class CalendarQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)
    project = serializers.IntegerField(required=False, min_value=1)


class CalendarView(APIView):
    """Calendrier mensuel : réunions, jalons, échéances, dates clés, livrables (projets visibles)."""

    @extend_schema(
        parameters=[OpenApiParameter("year", int), OpenApiParameter("month", int), OpenApiParameter("project", int)],
        responses={200: serializers.DictField()},
    )
    def get(self, request):
        from .services import today_date

        query = CalendarQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        d = query.validated_data
        today = today_date()
        return Response(build_calendar(request.user, d.get("year", today.year), d.get("month", today.month), d.get("project")))


class TeamsView(APIView):
    """Écran « Équipes » : disponibilité, charge et projets de chacun (filtre pays)."""

    @extend_schema(parameters=[OpenApiParameter("country", str)], responses={200: serializers.DictField()})
    def get(self, request):
        query = ProjectsQuerySerializer(data={"country": request.query_params.get("country", "")})
        query.is_valid(raise_exception=True)
        return Response(build_team_screen(request.user, query.validated_data.get("country")))


class NotificationsView(APIView):
    """À traiter (retards, échéances proches, approbations) et fil des projets, avec les non-lus."""

    @extend_schema(responses={200: serializers.DictField()})
    def get(self, request):
        return Response(build_notifications(request.user))


class NotificationsSeenView(APIView):
    """Marque toutes les notifications comme lues (jusqu'à maintenant)."""

    @extend_schema(request=None, responses={200: serializers.DictField()})
    def post(self, request):
        from django.utils import timezone

        request.user.notifications_seen_at = timezone.now()
        request.user.save(update_fields=["notifications_seen_at"])
        return Response(build_notifications(request.user))


class CountriesView(APIView):
    @extend_schema(responses={200: serializers.ListField()})
    def get(self, request):
        return Response([{"code": c.code, "name": c.name} for c in Country.objects.all()])


class HealthView(APIView):
    """Sonde de santé pour l'hébergeur : répond 200 si le serveur et la base fonctionnent."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    @extend_schema(responses={200: serializers.DictField()})
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response({"status": "ok"})
