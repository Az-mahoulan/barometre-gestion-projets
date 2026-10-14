"""Droits d'accès par rôle et API."""

from datetime import date

import pytest
from django.core.management import call_command

from apps.projects.models import Task

pytestmark = pytest.mark.django_db


def test_dashboard_requires_login(client_for):
    from rest_framework.test import APIClient

    assert APIClient().get("/api/v1/dashboard/").status_code in (401, 403)


def test_admin_sees_every_project(admin, project, make_project, other_boss, client_for):
    make_project(other_boss, name="Projet d'un autre")
    data = client_for(admin).get("/api/v1/dashboard/").json()
    assert {p["name"] for p in data["projects"]} == {"Projet test", "Projet d'un autre"}
    assert data["scope"] == "all"


def test_responsable_sees_only_own_projects(boss, project, make_project, other_boss, client_for):
    make_project(other_boss, name="Projet d'un autre")
    data = client_for(boss).get("/api/v1/dashboard/").json()
    assert [p["name"] for p in data["projects"]] == ["Projet test"]


def test_membre_sees_only_projects_with_own_tasks(worker, stranger, project, client_for):
    assert len(client_for(worker).get("/api/v1/dashboard/").json()["projects"]) == 1
    assert client_for(stranger).get("/api/v1/dashboard/").json()["projects"] == []


def test_unknown_country_is_rejected(admin, client_for):
    assert client_for(admin).get("/api/v1/dashboard/?country=ZZ").status_code == 400


def test_invalid_period_is_rejected(admin, client_for):
    assert client_for(admin).get("/api/v1/dashboard/?period=decade").status_code == 400


def test_membre_cannot_create_task(worker, project, client_for):
    r = client_for(worker).post("/api/v1/tasks/", {"project": project.id, "title": "X", "due_date": "2026-11-01"}, format="json")
    assert r.status_code == 403


def test_responsable_cannot_create_task_in_foreign_project(other_boss, project, client_for):
    # Le projet n'est pas dans son périmètre : la création est refusée.
    r = client_for(other_boss).post("/api/v1/tasks/", {"project": project.id, "title": "X", "due_date": "2026-11-01"}, format="json")
    assert r.status_code in (400, 403)


def test_responsable_creates_task_in_own_project(boss, project, client_for):
    r = client_for(boss).post("/api/v1/tasks/", {"project": project.id, "title": "Nouvelle", "due_date": "2026-11-01"}, format="json")
    assert r.status_code == 201
    assert Task.objects.filter(title="Nouvelle").exists()


def test_membre_updates_own_task_only(worker, stranger, project, client_for):
    task = Task.objects.get(assignee=worker)
    assert client_for(worker).post(f"/api/v1/tasks/{task.id}/status/", {"status": "doing"}, format="json").status_code == 200
    assert client_for(stranger).post(f"/api/v1/tasks/{task.id}/status/", {"status": "doing"}, format="json").status_code == 404


def test_membre_cannot_approve(worker, project, client_for):
    task = Task.objects.get(assignee=worker)
    r = client_for(worker).post(f"/api/v1/tasks/{task.id}/status/", {"status": "approved"}, format="json")
    assert r.status_code == 403


def test_responsable_can_approve(boss, project, client_for):
    task = Task.objects.get(project=project)
    r = client_for(boss).post(f"/api/v1/tasks/{task.id}/status/", {"status": "approved"}, format="json")
    assert r.status_code == 200 and r.json()["status"] == "approved"


def test_invalid_status_is_rejected(boss, project, client_for):
    task = Task.objects.get(project=project)
    assert client_for(boss).post(f"/api/v1/tasks/{task.id}/status/", {"status": "nimporte"}, format="json").status_code == 400


def test_status_change_is_logged(boss, project, client_for):
    task = Task.objects.get(project=project)
    client_for(boss).post(f"/api/v1/tasks/{task.id}/status/", {"status": "doing"}, format="json")
    activity = client_for(boss).get("/api/v1/dashboard/").json()["recent_activity"]
    assert activity and "en cours" in activity[0]["message"]


def test_membre_cannot_remind(worker, project, client_for):
    task = Task.objects.get(assignee=worker)
    assert client_for(worker).post(f"/api/v1/tasks/{task.id}/remind/").status_code == 403


def test_activity_must_belong_to_project(boss, project, make_project, client_for):
    other = make_project(boss, name="Autre projet")
    foreign_activity = other.activities.create(name="A", start_date=date(2026, 9, 1), end_date=date(2026, 9, 30))
    r = client_for(boss).post(
        "/api/v1/tasks/", {"project": project.id, "activity": foreign_activity.id, "title": "X", "due_date": "2026-11-01"}, format="json"
    )
    assert r.status_code == 400


def test_login_rejects_bad_credentials(admin):
    from rest_framework.test import APIClient

    assert APIClient().post("/api/v1/auth/login/", {"username": "admin", "password": "mauvais"}, format="json").status_code == 400


def test_login_then_me(admin):
    from rest_framework.test import APIClient

    c = APIClient()
    assert c.post("/api/v1/auth/login/", {"username": "admin", "password": "x-Test-Passw0rd"}, format="json").status_code == 200
    assert c.get("/api/v1/auth/me/").json()["role"] == "admin"


def test_seeded_demo_matches_mockup(admin, client_for, settings):
    from apps.accounts.models import User

    User.objects.all().delete()
    call_command("seed_demo", reset=True, stdout=open("/dev/null", "w"))
    settings.APP_DEMO_TODAY = date(2026, 10, 14)
    data = client_for(User.objects.get(username="admin")).get("/api/v1/dashboard/").json()
    k = data["kpis"]
    assert (k["active_projects"], k["late_projects"], k["completed_projects"], k["milestones_pct"]) == (6, 2, 2, 50)
    assert data["task_progress"]["total"] == 50
    assert data["critical_actions"]["total"] == 11


def test_admin_account_is_not_listed_as_team_member(admin, worker, client_for):
    names = [m["name"] for m in client_for(admin).get("/api/v1/dashboard/").json()["teams"]["members"]]
    assert "admin" not in names and "worker" in names


def test_health_is_public_and_checks_database():
    from rest_framework.test import APIClient

    r = APIClient().get("/api/v1/health/")
    assert r.status_code == 200 and r.json() == {"status": "ok"}


def test_seed_if_empty_does_not_touch_existing_data(project):
    from django.core.management import call_command

    before = Task.objects.count()
    call_command("seed_demo", if_empty=True, stdout=open("/dev/null", "w"))
    assert Task.objects.count() == before


def test_superuser_is_application_admin(db):
    from apps.accounts.models import User

    u = User.objects.create_superuser(username="root", password="x-Test-Passw0rd")
    assert u.role == User.Role.ADMIN


def test_task_progress_can_be_limited_to_one_project(admin, boss, project, make_project, client_for):
    other = make_project(boss, name="Autre projet")
    Task.objects.create(project=other, title="T", due_date=date(2026, 11, 1))
    full = client_for(admin).get("/api/v1/dashboard/").json()
    only = client_for(admin).get(f"/api/v1/dashboard/?tasks_project={other.id}").json()
    assert only["task_progress"]["total"] == 1
    assert full["task_progress"]["total"] > 1
    # Les indicateurs du haut de page ne dépendent pas de ce filtre.
    assert only["kpis"] == full["kpis"]
