"""Écran « Administration » (rôle administrateur uniquement) : utilisateurs, projets, pays."""

import secrets

from django.db import transaction
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Country, Presence, User
from apps.projects.models import ActivityLog, Project


class IsAdminRole(BasePermission):
    message = "Réservé aux administrateurs."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)


def _user_row(u: User) -> dict:
    return {
        "id": u.id, "username": u.username, "first_name": u.first_name, "last_name": u.last_name, "name": u.display_name,
        "initials": u.initials, "email": u.email, "role": u.role, "role_label": u.get_role_display(), "job_title": u.job_title,
        "country": u.country.code if u.country else "", "is_active": u.is_active, "last_login": u.last_login,
        "avatar": u.avatar,
    }


def _project_row(p: Project) -> dict:
    return {
        "id": p.id, "name": p.name, "description": p.description, "country": p.country.code, "owner": p.owner_id,
        "owner_name": p.owner.display_name, "start_date": p.start_date, "end_date": p.end_date, "status": p.status,
        "status_label": p.get_status_display(),
    }


class UserWriteSerializer(serializers.Serializer):
    username = serializers.RegexField(r"^[\w.@+-]{2,150}$", required=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)
    job_title = serializers.CharField(max_length=120, required=False, allow_blank=True)
    country = serializers.SlugRelatedField(slug_field="code", queryset=Country.objects.all(), required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)


class ProjectWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160)
    description = serializers.CharField(required=False, allow_blank=True)
    country = serializers.SlugRelatedField(slug_field="code", queryset=Country.objects.all())
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True))
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    status = serializers.ChoiceField(choices=Project.Status.choices, required=False)

    def validate(self, data):
        if data["start_date"] >= data["end_date"]:
            raise serializers.ValidationError({"end_date": "La fin doit être après le début."})
        if data["owner"].role == User.Role.MEMBRE:
            raise serializers.ValidationError({"owner": "Le responsable doit être un responsable ou un administrateur."})
        return data


class CountryWriteSerializer(serializers.Serializer):
    code = serializers.RegexField(r"^[A-Za-z]{2}$")
    name = serializers.CharField(max_length=80)

    def validate_code(self, value):
        value = value.upper()
        if Country.objects.filter(code=value).exists():
            raise serializers.ValidationError("Ce pays existe déjà.")
        return value


def _overview() -> dict:
    return {
        "users": [_user_row(u) for u in User.objects.select_related("country").order_by("-is_active", "last_name", "first_name", "username")],
        "projects": [_project_row(p) for p in Project.objects.select_related("country", "owner").order_by("-start_date", "name")],
        "countries": [{"code": c.code, "name": c.name, "users": c.user_set.count(), "projects": c.project_set.count()} for c in Country.objects.all()],
        "roles": [{"key": k, "label": label} for k, label in User.Role.choices],
        "statuses": [{"key": k, "label": label} for k, label in Project.Status.choices],
    }


class AdminOverviewView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(responses={200: serializers.DictField()})
    def get(self, request):
        return Response(_overview())


class AdminUsersView(APIView):
    """Création d'un compte : un mot de passe provisoire est généré et renvoyé une seule fois."""

    permission_classes = [IsAdminRole]

    @extend_schema(request=UserWriteSerializer, responses={201: serializers.DictField()})
    def post(self, request):
        data = UserWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        d = data.validated_data
        if not d.get("username"):
            raise serializers.ValidationError({"username": "Identifiant obligatoire."})
        if User.objects.filter(username__iexact=d["username"]).exists():
            raise serializers.ValidationError({"username": "Cet identifiant est déjà pris."})
        password = secrets.token_urlsafe(12)
        with transaction.atomic():
            user = User.objects.create_user(password=password, **{k: v for k, v in d.items() if k != "is_active"})
            Presence.objects.get_or_create(user=user)
        return Response({"user": _user_row(user), "password": password, **_overview()}, status=status.HTTP_201_CREATED)


class AdminUserView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(request=UserWriteSerializer, responses={200: serializers.DictField()})
    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if user is None:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        data = UserWriteSerializer(data=request.data, partial=True)
        data.is_valid(raise_exception=True)
        d = data.validated_data
        if user.id == request.user.id and (d.get("is_active") is False or d.get("role", User.Role.ADMIN) != User.Role.ADMIN):
            raise serializers.ValidationError({"detail": "Vous ne pouvez pas retirer vos propres droits d’administration."})
        if "username" in d and User.objects.filter(username__iexact=d["username"]).exclude(pk=user.pk).exists():
            raise serializers.ValidationError({"username": "Cet identifiant est déjà pris."})
        for k, v in d.items():
            setattr(user, k, v)
        user.save()
        return Response(_overview())


class AdminUserPasswordView(APIView):
    """Nouveau mot de passe provisoire (affiché une seule fois)."""

    permission_classes = [IsAdminRole]

    @extend_schema(request=None, responses={200: serializers.DictField()})
    def post(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if user is None:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        password = secrets.token_urlsafe(12)
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"password": password})


class AdminProjectsView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(request=ProjectWriteSerializer, responses={201: serializers.DictField()})
    def post(self, request):
        data = ProjectWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        project = Project.objects.create(**data.validated_data)
        ActivityLog.objects.create(project=project, actor=request.user, message=f"{request.user.display_name} a créé le projet")
        return Response({"project": _project_row(project), **_overview()}, status=status.HTTP_201_CREATED)


class AdminProjectView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(request=ProjectWriteSerializer, responses={200: serializers.DictField()})
    def patch(self, request, pk):
        project = Project.objects.filter(pk=pk).first()
        if project is None:
            return Response({"detail": "Projet introuvable."}, status=status.HTTP_404_NOT_FOUND)
        merged = {**_project_row(project), **request.data}
        data = ProjectWriteSerializer(data=merged)
        data.is_valid(raise_exception=True)
        for k, v in data.validated_data.items():
            setattr(project, k, v)
        project.save()
        return Response(_overview())


class AdminCountriesView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(request=CountryWriteSerializer, responses={201: serializers.DictField()})
    def post(self, request):
        data = CountryWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        Country.objects.create(**data.validated_data)
        return Response(_overview(), status=status.HTTP_201_CREATED)
