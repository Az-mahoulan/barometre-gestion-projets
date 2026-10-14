from datetime import date

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Country, User
from apps.projects.models import Milestone, Project, ProjectActivity, Task

TODAY = date(2026, 10, 14)


@pytest.fixture(autouse=True)
def fixed_today(settings):
    settings.APP_DEMO_TODAY = TODAY
    settings.ALLOWED_HOSTS = ["testserver", "localhost"]


@pytest.fixture
def country(db):
    return Country.objects.create(code="BJ", name="Bénin")


@pytest.fixture
def make_user(db, country):
    def _make(username, role=User.Role.MEMBRE):
        return User.objects.create_user(username=username, password="x-Test-Passw0rd", role=role, country=country)

    return _make


@pytest.fixture
def admin(make_user):
    return make_user("admin", User.Role.ADMIN)


@pytest.fixture
def boss(make_user):
    return make_user("boss", User.Role.RESPONSABLE)


@pytest.fixture
def other_boss(make_user):
    return make_user("other_boss", User.Role.RESPONSABLE)


@pytest.fixture
def worker(make_user):
    return make_user("worker", User.Role.MEMBRE)


@pytest.fixture
def stranger(make_user):
    return make_user("stranger", User.Role.MEMBRE)


@pytest.fixture
def make_project(country):
    def _make(owner, name="Projet test", start=date(2026, 9, 1), end=date(2026, 12, 1), **kw):
        return Project.objects.create(name=name, country=country, owner=owner, start_date=start, end_date=end, **kw)

    return _make


@pytest.fixture
def project(boss, make_project, worker):
    p = make_project(boss)
    act = ProjectActivity.objects.create(project=p, name="Activité 1", start_date=date(2026, 9, 1), end_date=date(2026, 10, 30))
    Task.objects.create(project=p, activity=act, title="Tâche de worker", assignee=worker, due_date=date(2026, 10, 20))
    return p


@pytest.fixture
def make_task():
    def _make(project, due, status=Task.Status.TODO, assignee=None, title="Tâche"):
        return Task.objects.create(project=project, title=title, due_date=due, status=status, assignee=assignee)

    return _make


@pytest.fixture
def make_milestone():
    def _make(project, due, achieved=False):
        return Milestone.objects.create(project=project, name="Jalon", due_date=due, achieved_on=due if achieved else None)

    return _make


@pytest.fixture
def client_for():
    def _client(user):
        c = APIClient()
        c.force_authenticate(user)
        return c

    return _client
