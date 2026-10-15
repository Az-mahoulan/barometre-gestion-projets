from django.db import migrations

# Rattachements de démonstration plus justes que la règle par dates : (projet, activité) -> jalon.
LINKS = {
    ("Refonte du site web", "Développement"): "Version bêta",
    ("Rapport annuel 2026", "Rédaction"): "Premier jet",
    ("Tableau de bord partenaires", "Prototype"): "Prototype",
}


def adjust_demo(apps, schema_editor):
    """Démonstration (données fictives) : la tâche « Rapport d'audit » repasse « en cours » et trois activités
    sont rattachées à leur vrai jalon, pour des avancements réalistes. Seulement si les éléments de démonstration
    existent ; sans effet sur une base réelle."""
    Task = apps.get_model("projects", "Task")
    Task.objects.filter(
        project__name="Audit qualité des données", title="Rapport d’audit", status="review", assignee__username="romuald"
    ).update(status="doing")
    Activity = apps.get_model("projects", "ProjectActivity")
    Milestone = apps.get_model("projects", "Milestone")
    for (project, activity), milestone in LINKS.items():
        m = Milestone.objects.filter(project__name=project, name=milestone).first()
        if m:
            Activity.objects.filter(project__name=project, name=activity).update(milestone=m)


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0008_activity_milestone"),
    ]

    operations = [
        migrations.RunPython(adjust_demo, migrations.RunPython.noop),
    ]
