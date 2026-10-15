from datetime import datetime, time

from django.db import migrations
from django.utils import timezone

# Démonstration (données fictives) : rattache les réunions de démonstration à leur projet et ajoute trois
# revues / rencontres. Ne fait rien si les projets de démonstration n'existent pas (base réelle).
LINKS = {
    "Comité de pilotage": "Enquête nationale T4",
    "Atelier partenaires (Dakar)": "Tableau de bord partenaires",
    "Revue des jalons": "Rapport annuel 2026",
}
EXTRA = [
    ("2026-10-22", "10:00", "Revue avec le partenaire", "Tableau de bord partenaires", ["sena", "aicha"]),
    ("2026-10-27", "15:00", "Revue qualité", "Audit qualité des données", ["romuald", "aicha"]),
    ("2026-11-05", "09:30", "Rencontre bailleur", "Enquête nationale T4", ["mireille", "adjoa"]),
]


def link_demo_events(apps, schema_editor):
    CalendarEvent = apps.get_model("projects", "CalendarEvent")
    Project = apps.get_model("projects", "Project")
    User = apps.get_model("accounts", "User")
    projects = {p.name: p for p in Project.objects.filter(name__in=set(LINKS.values()) | {e[3] for e in EXTRA})}
    if len(projects) < 4:
        return
    for title, name in LINKS.items():
        CalendarEvent.objects.filter(title=title, project__isnull=True).update(project=projects[name])
    tz = timezone.get_current_timezone()
    for day, hour, title, name, who in EXTRA:
        if CalendarEvent.objects.filter(title=title).exists():
            continue
        at = timezone.make_aware(datetime.combine(datetime.fromisoformat(day).date(), time.fromisoformat(hour)), tz)
        event = CalendarEvent.objects.create(title=title, kind="meeting", starts_at=at, project=projects[name])
        event.participants.set(User.objects.filter(username__in=who))


class Migration(migrations.Migration):
    dependencies = [("projects", "0002_event_participants")]

    operations = [migrations.RunPython(link_demo_events, migrations.RunPython.noop)]
