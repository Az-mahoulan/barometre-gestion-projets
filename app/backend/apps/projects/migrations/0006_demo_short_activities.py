from datetime import date

from django.db import migrations

# Démonstration (données fictives) : quelques activités courtes, commençant à des jours différents, pour la vue
# « Activités de la semaine ». Seulement si les projets de démonstration existent ; sans effet sur une base réelle.
DEMO = [
    ("Rapport annuel 2026", "Relecture du chapitre 1", date(2026, 10, 12), date(2026, 10, 14)),
    ("Enquête nationale T4", "Formation des superviseurs", date(2026, 10, 13), date(2026, 10, 15)),
    ("Refonte du site web", "Tests utilisateurs", date(2026, 10, 15), date(2026, 10, 20)),
    ("Tableau de bord partenaires", "Maquette des indicateurs", date(2026, 10, 16), date(2026, 10, 21)),
    ("Formation des enquêteurs", "Répétition générale", date(2026, 10, 19), date(2026, 10, 22)),
]


def add_demo_activities(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    ProjectActivity = apps.get_model("projects", "ProjectActivity")
    projects = {p.name: p for p in Project.objects.filter(name__in=[d[0] for d in DEMO])}
    if len(projects) < len(DEMO):
        return
    for name, title, start, end in DEMO:
        ProjectActivity.objects.get_or_create(project=projects[name], name=title, defaults={"start_date": start, "end_date": end})


class Migration(migrations.Migration):
    dependencies = [("projects", "0005_milestone_dependencies")]

    operations = [migrations.RunPython(add_demo_activities, migrations.RunPython.noop)]
