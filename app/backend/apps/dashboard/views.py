from django.db import connection
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Country

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
