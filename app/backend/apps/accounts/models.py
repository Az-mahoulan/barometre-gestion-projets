from django.contrib.auth.models import AbstractUser
from django.db import models


class Country(models.Model):
    code = models.CharField("Code ISO", max_length=2, unique=True)
    name = models.CharField("Nom", max_length=80)

    class Meta:
        verbose_name = "pays"
        verbose_name_plural = "pays"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrateur"
        RESPONSABLE = "responsable", "Responsable"
        MEMBRE = "membre", "Membre"

    role = models.CharField("Rôle", max_length=12, choices=Role.choices, default=Role.MEMBRE)
    job_title = models.CharField("Fonction", max_length=120, blank=True)
    country = models.ForeignKey(Country, verbose_name="Pays", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"

    @property
    def display_name(self) -> str:
        return self.get_full_name() or self.username

    @property
    def initials(self) -> str:
        parts = self.display_name.split()
        return "".join(p[0] for p in parts[:2]).upper()

    @property
    def is_admin_role(self) -> bool:
        return self.role == self.Role.ADMIN


class Presence(models.Model):
    """Disponibilité actuelle d'un membre (statut, raison, lieu)."""

    class Status(models.TextChoices):
        AVAILABLE = "available", "Disponible"
        MEETING = "meeting", "En réunion"
        MISSION = "mission", "En mission"
        TRAINING = "training", "En formation"
        LEAVE = "leave", "En congé"

    class Place(models.TextChoices):
        OFFICE = "office", "Au bureau"
        REMOTE = "remote", "À distance"
        FIELD = "field", "Sur le terrain"
        ABSENT = "absent", "Absent"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="presence")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.AVAILABLE)
    reason = models.CharField("Raison", max_length=200, blank=True)
    place = models.CharField("Lieu", max_length=10, choices=Place.choices, default=Place.OFFICE)
    place_detail = models.CharField("Précision du lieu", max_length=120, blank=True)
    until = models.DateField("Jusqu'au", null=True, blank=True)

    class Meta:
        verbose_name = "disponibilité"
        verbose_name_plural = "disponibilités"

    def __str__(self) -> str:
        return f"{self.user} : {self.get_status_display()}"
