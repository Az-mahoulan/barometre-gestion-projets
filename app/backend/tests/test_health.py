"""Règles de calcul de l'état d'un projet."""

from datetime import date

import pytest
from django.db import IntegrityError, transaction

from apps.dashboard.services import project_stats
from apps.projects.models import Project, Task

TODAY = date(2026, 10, 14)
pytestmark = pytest.mark.django_db


def stats(project):
    project = Project.objects.prefetch_related("tasks", "milestones").get(pk=project.pk)
    return project_stats(project, TODAY)


def test_ok_when_nothing_is_overdue(boss, make_project, make_task):
    p = make_project(boss)
    make_task(p, date(2026, 11, 1), Task.Status.APPROVED)
    make_task(p, date(2026, 11, 5), Task.Status.DOING)
    assert stats(p)["health"] == "ok"


def test_late_when_milestone_is_overdue(boss, make_project, make_milestone):
    p = make_project(boss)
    make_milestone(p, date(2026, 10, 1), achieved=False)
    assert stats(p)["health"] == "late"


def test_achieved_overdue_milestone_is_fine(boss, make_project, make_milestone):
    p = make_project(boss)
    make_milestone(p, date(2026, 10, 1), achieved=True)
    assert stats(p)["health"] == "ok"


def test_late_with_two_overdue_tasks(boss, make_project, make_task):
    p = make_project(boss)
    make_task(p, date(2026, 10, 1))
    make_task(p, date(2026, 10, 2), Task.Status.DOING)
    assert stats(p)["health"] == "late"


def test_risk_with_one_overdue_task(boss, make_project, make_task):
    p = make_project(boss)
    make_task(p, date(2026, 10, 1))
    make_task(p, date(2026, 11, 1), Task.Status.APPROVED)
    assert stats(p)["health"] == "risk"


def test_task_in_review_is_not_overdue(boss, make_project, make_task):
    p = make_project(boss)
    make_task(p, date(2026, 10, 1), Task.Status.REVIEW)
    assert stats(p)["tasks_overdue"] == 0


def test_risk_when_progress_far_behind_schedule(boss, make_project, make_task):
    p = make_project(boss, start=date(2026, 9, 1), end=date(2026, 11, 1))  # ~ 2/3 du temps écoulé
    make_task(p, date(2026, 12, 1))
    make_task(p, date(2026, 12, 2))
    assert stats(p)["health"] == "risk"


def test_performance_hidden_at_project_start(boss, make_project, make_task):
    p = make_project(boss, start=date(2026, 10, 13), end=date(2026, 12, 31))
    make_task(p, date(2026, 12, 1))
    assert stats(p)["performance"] is None


def test_performance_is_progress_over_elapsed(boss, make_project, make_task):
    p = make_project(boss, start=date(2026, 9, 1), end=date(2026, 12, 1))
    make_task(p, date(2026, 12, 1), Task.Status.APPROVED)
    make_task(p, date(2026, 12, 1))
    s = stats(p)
    assert s["performance"] == round(0.5 / s["elapsed"] * 100)


def test_completed_project_has_no_alert(boss, make_project, make_milestone):
    p = make_project(boss, status=Project.Status.COMPLETED)
    make_milestone(p, date(2026, 10, 1), achieved=False)
    assert stats(p)["health"] == "completed"


def test_project_start_must_precede_end(boss, make_project):
    with pytest.raises(IntegrityError), transaction.atomic():
        make_project(boss, start=date(2026, 12, 1), end=date(2026, 9, 1))
