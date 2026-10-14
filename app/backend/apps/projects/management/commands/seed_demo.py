"""Données de démonstration FICTIVES (mêmes que la maquette). Ne jamais lancer en production."""

import os
import secrets
from datetime import date, datetime, time, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Country, Presence, User
from apps.projects.models import (
    ActivityLog,
    CalendarEvent,
    Milestone,
    Project,
    ProjectActivity,
    Task,
)

YEAR = 2026
DEMO_TODAY = date(2026, 10, 14)


def d(mmdd: str) -> date:
    month, day = mmdd.split("-")
    return date(YEAR, int(month), int(day))


COUNTRIES = {"BJ": "Bénin", "TG": "Togo", "SN": "Sénégal", "CI": "Côte d’Ivoire"}

# username, prénom, nom, rôle, fonction, pays, statut, raison, lieu, précision, jusqu'au
PEOPLE = [
    ("aicha", "Aïcha", "Dossou", "responsable", "Analyste", "BJ", "available", "", "office", "", None),
    ("koffi", "Koffi", "Adjovi", "membre", "Développeur web", "BJ", "available", "", "remote", "", None),
    ("mireille", "Mireille", "Houngbo", "responsable", "Responsable de projets", "BJ", "meeting", "Comité de pilotage, jusqu’à 15 h", "office", "", None),
    ("sena", "Sèna", "Agbo", "responsable", "Suivi-évaluation", "BJ", "mission", "Atelier partenaires à Dakar, jusqu’au 16 oct.", "field", "Sénégal", d("10-16")),
    ("romuald", "Romuald", "Tossou", "responsable", "Contrôleur qualité", "TG", "leave", "Congé annuel, retour le 19 oct.", "absent", "", d("10-19")),
    ("fatou", "Fatou", "Bio", "membre", "Formatrice", "BJ", "available", "", "office", "", None),
    ("ibrahim", "Ibrahim", "Sow", "membre", "Statisticien", "SN", "training", "Formation Power BI, jusqu’au 15 oct.", "remote", "", d("10-15")),
    ("adjoa", "Adjoa", "Mensah", "membre", "Coordinatrice terrain", "TG", "mission", "Collecte terrain à Lomé, jusqu’au 20 oct.", "field", "Togo", d("10-20")),
]
ORDER = [p[0] for p in PEOPLE]

# nom, pays, responsable, début, fin, statut, activités[(nom, début, fin)], jalons[(nom, échéance, atteint)],
# tâches[(intitulé, assigné, statut, échéance, priorité, index d'activité)]
PROJECTS = [
    ("Enquête nationale T4", "BJ", "mireille", "09-01", "12-15", "active",
     [("Préparation", "09-01", "09-30"), ("Collecte terrain", "10-01", "11-20"), ("Analyse et rapport", "11-15", "12-15")],
     [("Termes de référence validés", "09-10", 1), ("Questionnaire validé", "09-25", 1), ("Collecte lancée", "10-12", 1), ("Collecte terminée", "11-20", 0), ("Rapport préliminaire", "12-10", 0)],
     [("Rédiger les termes de référence", "mireille", "approved", "09-09", "n", 0), ("Finaliser le questionnaire", "mireille", "approved", "09-24", "n", 0), ("Former les superviseurs", "fatou", "approved", "10-05", "n", 0),
      ("Déployer les tablettes", "adjoa", "approved", "10-09", "n", 1), ("Lancer la collecte", "mireille", "approved", "10-12", "h", 1), ("Valider le plan d’échantillonnage", "ibrahim", "doing", "10-15", "n", 1),
      ("Suivre le taux de réponse", "sena", "doing", "10-20", "h", 1), ("Contrôler la qualité des saisies", "romuald", "doing", "10-30", "n", 1), ("Rédiger la note méthodologique", "aicha", "todo", "11-10", "n", 2),
      ("Rapport préliminaire", "mireille", "todo", "12-08", "h", 2)]),
    ("Refonte du site web", "BJ", "mireille", "08-17", "11-30", "active",
     [("Conception", "08-17", "09-30"), ("Développement", "09-15", "11-06"), ("Recette et mise en ligne", "11-01", "11-30")],
     [("Arborescence validée", "08-28", 1), ("Contenus rédigés", "09-18", 0), ("Maquettes validées", "09-30", 1), ("Version bêta", "10-30", 0), ("Mise en ligne", "11-27", 0)],
     [("Arborescence du site", "koffi", "approved", "08-27", "n", 0), ("Maquettes des pages clés", "koffi", "approved", "09-28", "n", 0), ("Charte graphique appliquée", "koffi", "approved", "10-02", "n", 0),
      ("Intégration de la page d’accueil", "koffi", "doing", "10-09", "n", 1), ("Page Méthodologie : contenus", "aicha", "review", "10-10", "h", 1), ("Intégration des pages de résultats", "koffi", "doing", "10-23", "n", 1),
      ("Tests d’accessibilité", "fatou", "todo", "11-06", "n", 2), ("Mise en ligne", "koffi", "todo", "11-27", "h", 2)]),
    ("Rapport annuel 2026", "BJ", "mireille", "09-14", "12-18", "active",
     [("Plan et données", "09-14", "10-16"), ("Rédaction", "10-12", "11-30"), ("Finalisation", "11-25", "12-18")],
     [("Plan validé", "09-28", 1), ("Chiffres clés collectés", "10-08", 1), ("Premier jet", "11-06", 0), ("Relecture", "12-01", 0), ("Publication", "12-18", 0)],
     [("Plan du rapport", "aicha", "approved", "09-28", "n", 0), ("Collecte des chiffres clés", "sena", "approved", "10-09", "n", 0), ("Valider la liste des tableaux", "sena", "todo", "10-17", "n", 0),
      ("Rédaction du chapitre 1", "aicha", "doing", "10-28", "n", 1), ("Rédaction du chapitre 2", "ibrahim", "todo", "11-06", "n", 1), ("Mise en page", "koffi", "todo", "11-25", "n", 2),
      ("Relecture finale", "romuald", "todo", "12-01", "n", 2)]),
    ("Tableau de bord partenaires", "SN", "sena", "10-01", "11-27", "active",
     [("Cadrage", "10-01", "10-16"), ("Prototype", "10-12", "11-06"), ("Test et livraison", "11-02", "11-27")],
     [("Cadrage validé", "10-09", 0), ("Prototype", "10-30", 0), ("Livraison v1", "11-27", 0)],
     [("Recueillir les besoins", "sena", "approved", "10-07", "n", 0), ("Atelier de cadrage", "sena", "doing", "10-09", "h", 0), ("Liste des indicateurs", "ibrahim", "todo", "10-12", "h", 0),
      ("Prototype interactif", "koffi", "todo", "10-30", "n", 1), ("Test avec trois partenaires", "fatou", "todo", "11-13", "n", 2), ("Livraison v1", "sena", "todo", "11-27", "n", 2)]),
    ("Audit qualité des données", "TG", "romuald", "07-06", "10-30", "active",
     [("Préparation", "07-06", "08-14"), ("Audit terrain", "08-17", "09-25"), ("Rapport et suivi", "09-28", "10-30")],
     [("Cadrage de l’audit", "07-10", 1), ("Plan d’audit", "07-31", 1), ("Audit terrain", "09-25", 1), ("Rapport d’audit", "10-30", 0)],
     [("Plan d’audit", "romuald", "approved", "07-30", "n", 0), ("Échantillonnage", "romuald", "approved", "08-14", "n", 0), ("Visites de contrôle", "adjoa", "approved", "09-18", "n", 1),
      ("Analyse des écarts", "ibrahim", "approved", "09-30", "n", 2), ("Restitution aux équipes", "romuald", "done", "10-09", "n", 2), ("Rapport d’audit", "romuald", "review", "10-28", "h", 2),
      ("Relire le rapport d’audit", "aicha", "review", "10-16", "h", 2), ("Plan d’actions correctives", "mireille", "todo", "10-30", "n", 2)]),
    ("Formation des enquêteurs", "BJ", "mireille", "10-05", "11-06", "active",
     [("Préparation", "10-05", "10-16"), ("Sessions", "10-19", "10-30"), ("Évaluation", "11-02", "11-06")],
     [("Supports prêts", "10-16", 0), ("Sessions terminées", "10-28", 0), ("Évaluation", "11-06", 0)],
     [("Programme de formation", "fatou", "approved", "10-08", "n", 0), ("Supports de formation", "fatou", "doing", "10-12", "h", 0), ("Réserver les salles", "aicha", "todo", "10-20", "n", 1),
      ("Sessions de formation", "fatou", "todo", "10-28", "n", 1), ("Évaluation des acquis", "mireille", "todo", "11-06", "n", 2)]),
    ("Cartographie des partenaires", "CI", "mireille", "06-15", "09-30", "completed",
     [("Inventaire", "06-15", "07-31"), ("Validation", "08-01", "09-30")],
     [("Inventaire terminé", "07-15", 1), ("Fiches validées", "08-14", 1), ("Carte publiée", "09-30", 1)],
     [("Inventaire des partenaires", "aicha", "approved", "07-15", "n", 0), ("Validation des fiches", "aicha", "approved", "08-14", "n", 1), ("Publication de la carte", "koffi", "approved", "09-30", "n", 1)]),
    ("Évaluation 2025", "BJ", "aicha", "05-04", "08-28", "completed",
     [("Collecte", "05-04", "06-30"), ("Rapport", "07-01", "08-28")],
     [("Collecte close", "07-03", 1), ("Rapport remis", "08-28", 1)],
     [("Collecte des données", "sena", "approved", "06-30", "n", 0), ("Analyse", "ibrahim", "approved", "07-31", "n", 1), ("Rapport final", "aicha", "approved", "08-28", "n", 1)]),
]

EVENTS = [("10-12", "10:00", "Point hebdomadaire", "meeting"), ("10-14", "15:00", "Comité de pilotage", "meeting"),
          ("10-15", "09:00", "Atelier partenaires (Dakar)", "mission"), ("10-16", "14:00", "Revue des jalons", "meeting")]

LOGS = [(2, "mireille", "a approuvé « Lancer la collecte »", "Enquête nationale T4"), (3, "sena", "a passé « Atelier de cadrage » en cours", "Tableau de bord partenaires"),
        (26, "koffi", "a terminé « Arborescence du site »", "Refonte du site web"), (27, "romuald", "a commenté « Rapport d’audit »", "Audit qualité des données"),
        (50, "adjoa", "a ajouté 3 tâches à « Enquête nationale T4 »", "Enquête nationale T4"), (72, "aicha", "a importé un Gantt dans « Rapport annuel 2026 »", "Rapport annuel 2026")]


class Command(BaseCommand):
    help = "Crée des données de démonstration fictives."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Supprime projets, tâches et utilisateurs de démonstration avant de recréer.")

    @transaction.atomic
    def handle(self, *args, **opts):
        if Project.objects.exists() and not opts["reset"]:
            raise CommandError("Des projets existent déjà. Utilisez --reset pour repartir de zéro (données de démonstration uniquement).")
        if opts["reset"]:
            ActivityLog.objects.all().delete()
            CalendarEvent.objects.all().delete()
            Project.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        password = os.environ.get("DEMO_PASSWORD") or secrets.token_urlsafe(12)
        countries = {code: Country.objects.get_or_create(code=code, defaults={"name": name})[0] for code, name in COUNTRIES.items()}

        users = {}
        for username, first, last, role, title, cc, status, reason, place, detail, until in PEOPLE:
            u = User.objects.create_user(username=username, first_name=first, last_name=last, role=role, job_title=title,
                                         country=countries[cc], password=password)
            Presence.objects.create(user=u, status=status, reason=reason, place=place, place_detail=detail, until=until)
            users[username] = u
        admin = User.objects.filter(username="admin").first() or User.objects.create_user(
            username="admin", first_name="Administration", role="admin", is_staff=True, password=password)
        admin.role = "admin"
        admin.save()

        projects = {}
        for name, cc, owner, start, end, status, activities, milestones, tasks in PROJECTS:
            p = Project.objects.create(name=name, country=countries[cc], owner=users[owner], start_date=d(start), end_date=d(end), status=status)
            projects[name] = p
            acts = [ProjectActivity.objects.create(project=p, name=n, start_date=d(s), end_date=d(e)) for n, s, e in activities]
            for n, due, achieved in milestones:
                Milestone.objects.create(project=p, name=n, due_date=d(due), achieved_on=d(due) if achieved else None)
            for title, who, st, due, prio, act in tasks:
                Task.objects.create(project=p, activity=acts[act], title=title, assignee=users[who], status=st, due_date=d(due), priority=prio)

        tz = timezone.get_current_timezone()
        for day, hour, title, kind in EVENTS:
            at = timezone.make_aware(datetime.combine(d(day), time.fromisoformat(hour)), tz)
            CalendarEvent.objects.create(title=title, kind=kind, starts_at=at)

        noon = timezone.make_aware(datetime.combine(DEMO_TODAY, time(14, 0)), tz)
        for hours_ago, who, message, project in LOGS:
            entry = ActivityLog.objects.create(project=projects[project], actor=users[who], message=f"{users[who].first_name} {message}")
            ActivityLog.objects.filter(pk=entry.pk).update(created_at=noon - timedelta(hours=hours_ago))

        self.stdout.write(self.style.SUCCESS("Données de démonstration créées."))
        self.stdout.write(f"Comptes : admin et {', '.join(ORDER)}")
        if not os.environ.get("DEMO_PASSWORD"):
            self.stdout.write(f"Mot de passe généré (à noter, affiché une seule fois) : {password}")
