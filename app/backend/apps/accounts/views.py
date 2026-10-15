from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .avatars import assign_avatar


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


def user_payload(user) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "name": user.display_name,
        "initials": user.initials,
        "role": user.role,
        "role_label": user.get_role_display(),
        "job_title": user.job_title,
        "avatar": user.avatar,
        "avatar_style": user.avatar_style,
    }


class CsrfView(APIView):
    """Pose le cookie CSRF ; à appeler avant la connexion."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    @extend_schema(responses={200: serializers.DictField()})
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @extend_schema(request=LoginSerializer, responses={200: serializers.DictField()})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_active:
            return Response({"detail": "Identifiants incorrects."}, status=status.HTTP_400_BAD_REQUEST)
        login(request, user)
        return Response(user_payload(user))


class LogoutView(APIView):
    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AvatarSerializer(serializers.Serializer):
    style = serializers.ChoiceField(choices=["neutral", "masculine", "feminine"], required=False)


class MeAvatarView(APIView):
    """Tire un nouvel avatar unique pour soi (et change éventuellement son style)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=AvatarSerializer, responses={200: serializers.DictField()})
    def post(self, request):
        serializer = AvatarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assign_avatar(request.user, serializer.validated_data.get("style"))
        return Response(user_payload(request.user))


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: serializers.DictField()})
    def get(self, request):
        return Response(user_payload(request.user))
