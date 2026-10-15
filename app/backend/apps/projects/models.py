from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Project(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "En cours"
        COMPLETED = "completed", "Achevé"
        ARCHIVED = "archived", "Archivé"

    name = models.CharField("Nom", max_length=160)
    description = models.TextField("Description", blank=True)
    country = models.ForeignKey("accounts.Country", verbose_name="Pays", on_delete=models.PROTECT)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, verbose_name="Responsable", on_delete=models.PROTECT, related_name="owned_projects"
    )
    start_date = models.DateField("Début")
    end_date = models.DateField("Fin prévue")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "projet"
        ordering = ["start_date", "name"]
        constraints = [
            models.CheckConstraint(
                condition=Q(start_date__lt=F("end_date")), name="project_start_before_end"
            )
        ]

    def __str__(self) -> str:
        return self.name


class ProjectActivity(models.Model):
    """Une activité regroupe des tâches au sein d'un projet (projet → activités → tâches)."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="activities")
    name = models.CharField("Nom", max_length=160)
    start_date = models.DateField("Début")
    end_date = models.DateField("Fin prévue")

    class Meta:
        verbose_name = "activité"
        ordering = ["start_date", "id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(start_date__lt=F("end_date")), name="activity_start_before_end"
            )
        ]

    def __str__(self) -> str:
        return f"{self.project} · {self.name}"


class Task(models.Model):
    class Status(models.TextChoices):
        TODO = "todo", "En attente"
        DOING = "doing", "En cours"
        DONE = "done", "Fait"
        REVIEW = "review", "En revue"
        APPROVED = "approved", "Approuvé"

    class Priority(models.TextChoices):
        NORMAL = "n", "Normale"
        HIGH = "h", "Haute"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    activity = models.ForeignKey(
        ProjectActivity, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks"
    )
    title = models.CharField("Intitulé", max_length=200)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks"
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=1, choices=Priority.choices, default=Priority.NORMAL)
    due_date = models.DateField("Échéance")

    class Meta:
        verbose_name = "tâche"
        ordering = ["due_date", "id"]

    def __str__(self) -> str:
        return self.title

    # Une tâche est « avancée » dès que l'exécutant l'a terminée (fait, en revue ou approuvée).
    COMPLETE = (Status.DONE, Status.REVIEW, Status.APPROVED)

    @property
    def is_complete(self) -> bool:
        return self.status in self.COMPLETE


class Milestone(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="milestones")
    name = models.CharField("Nom", max_length=160)
    due_date = models.DateField("Échéance")
    achieved_on = models.DateField("Atteint le", null=True, blank=True)
    # Dépendances déclarées par le gestionnaire : ce jalon ne peut aboutir qu'après ceux-ci (même projet).
    depends_on = models.ManyToManyField(
        "self", symmetrical=False, blank=True, related_name="dependents", verbose_name="Dépend de"
    )

    class Meta:
        verbose_name = "jalon"
        ordering = ["due_date", "id"]

    def __str__(self) -> str:
        return f"{self.project} · {self.name}"

    @property
    def is_achieved(self) -> bool:
        return self.achieved_on is not None


class ProjectKeyDate(models.Model):
    """Date clé renseignée par le gestionnaire du projet (revue, rencontre, lancement…), distincte des jalons."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="key_dates")
    date = models.DateField("Date")
    label = models.CharField("Libellé", max_length=120)

    class Meta:
        verbose_name = "date clé"
        verbose_name_plural = "dates clés"
        ordering = ["date", "id"]

    def __str__(self) -> str:
        return f"{self.project} · {self.label}"


class Deliverable(models.Model):
    """Livrable attendu d'un projet (rapport, outil, base de données…) ; livré quand la date de remise est renseignée."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="deliverables")
    name = models.CharField("Intitulé", max_length=160)
    due_date = models.DateField("Échéance")
    delivered_on = models.DateField("Livré le", null=True, blank=True)

    class Meta:
        verbose_name = "livrable"
        ordering = ["due_date", "id"]

    def __str__(self) -> str:
        return f"{self.project} · {self.name}"

    @property
    def is_delivered(self) -> bool:
        return self.delivered_on is not None


class CalendarEvent(models.Model):
    class Kind(models.TextChoices):
        MEETING = "meeting", "Réunion"
        MISSION = "mission", "Mission"

    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.MEETING)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.CASCADE, related_name="events")
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="events", verbose_name="Participants")

    class Meta:
        verbose_name = "événement"
        ordering = ["starts_at"]


class ActivityLog(models.Model):
    """Journal des actions (activités récentes)."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="log")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    message = models.CharField(max_length=240)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "journal d'activité"
        ordering = ["-created_at", "-id"]
