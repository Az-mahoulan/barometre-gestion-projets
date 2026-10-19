"""Écrans « Projets » : liste des projets visibles et détail d'un projet (lecture)."""

from __future__ import annotations

from apps.accounts.models import User
from apps.projects.access import can_manage_project, can_update_task_status
from apps.projects.models import ActivityLog, Project

from .services import (
    _milestones_payload,
    _visible_projects,
    build_projects_overview,
    is_overdue,
    now_reference,
    project_stats,
    today_date,
)


def _avatars(users) -> dict:
    return {u.display_name: u.avatar for u in users if u is not None and u.avatar}


def build_projects_list(user, *, country: str | None = None, status: str | None = None, q: str = "") -> dict:
    """Une ligne par projet visible (même forme que la vue d'ensemble du tableau de bord), filtrable."""
    today = today_date()
    projects = list(_visible_projects(user, country))
    if status:
        projects = [p for p in projects if p.status == status]
    if q:
        projects = [p for p in projects if q.lower() in p.name.lower()]
    stats = {p.id: project_stats(p, today) for p in projects}
    people = {p.owner for p in projects} | {t.assignee for p in projects for t in p.tasks.all() if t.assignee}
    return {
        "as_of": today,
        "now": now_reference(),
        "projects": build_projects_overview(projects, stats),
        "avatars": _avatars(people),
    }


def _person(u):
    return {"name": u.display_name, "initials": u.initials} if u else None


def build_project_detail(user, project_id: int) -> dict | None:
    """Tout ce qu'il faut pour l'écran d'un projet : en-tête, tâches par statut, jalons, activités, livrables, équipe."""
    today = today_date()
    p = _visible_projects(user, None).filter(pk=project_id).prefetch_related("deliverables").first()
    if p is None:
        return None
    s = project_stats(p, today)
    row = build_projects_overview([p], {p.id: s})[0]
    tasks = list(p.tasks.all())
    activities = list(p.activities.all())
    act_name = {a.id: a.name for a in activities}
    milestones = _milestones_payload(p, today)
    ms_name = {m["id"]: m["name"] for m in milestones}

    task_rows = [
        {
            "id": t.id, "title": t.title, "status": t.status, "status_label": t.get_status_display(),
            "due": t.due_date, "overdue": is_overdue(t, today), "priority": t.priority,
            "assignee": _person(t.assignee), "activity": act_name.get(t.activity_id, ""),
            "can_edit": can_update_task_status(user, t),
        }
        for t in sorted(tasks, key=lambda t: (t.due_date, t.id))
    ]
    activity_rows = []
    for a in activities:
        ts = [t for t in tasks if t.activity_id == a.id]
        done = sum(1 for t in ts if t.is_complete)
        activity_rows.append(
            {"id": a.id, "name": a.name, "start": a.start_date, "end": a.end_date, "milestone": ms_name.get(a.milestone_id, ""),
             "tasks_total": len(ts), "tasks_complete": done, "progress": done / len(ts) if ts else 0.0}
        )
    logs = ActivityLog.objects.filter(project=p).select_related("actor")[:10]
    people = [p.owner] + [t.assignee for t in tasks]
    team = []
    for u in dict.fromkeys(x for x in people if x is not None):
        mine = [t for t in tasks if t.assignee_id == u.id]
        team.append(
            {**_person(u), "job_title": u.job_title, "is_owner": u.id == p.owner_id,
             "open_tasks": sum(1 for t in mine if not t.is_complete), "overdue_tasks": sum(1 for t in mine if is_overdue(t, today))}
        )
    return {
        "as_of": today,
        "now": now_reference(),
        "project": {**row, "description": p.description, "status_label": p.get_status_display()},
        "can_manage": can_manage_project(user, p),
        "statuses": [{"key": k, "label": label} for k, label in p.tasks.model.Status.choices],
        "tasks": task_rows,
        "milestones": milestones,
        "activities": activity_rows,
        "deliverables": [
            {"id": d.id, "name": d.name, "due": d.due_date, "delivered_on": d.delivered_on,
             "late": d.delivered_on is None and d.due_date < today}
            for d in p.deliverables.all()
        ],
        "key_dates": [{"label": k.label, "date": k.date} for k in p.key_dates.all()],
        "team": team,
        "log": [
            {"id": e.id, "message": e.message, "actor_name": e.actor.display_name if e.actor else "",
             "actor_initials": e.actor.initials if e.actor else "", "created_at": e.created_at}
            for e in logs
        ],
        "avatars": _avatars(people),
    }


def build_my_tasks(user, scope: str = "mine") -> dict:
    """Écran « Mes tâches » : les tâches de la personne (« mine ») ou, pour un responsable ou un administrateur,
    celles des projets qu'il gère (« projects »). Le classement (en retard, aujourd'hui, semaine, plus tard) se fait
    dans l'interface à partir de l'échéance."""
    from apps.projects.models import Task

    today = today_date()
    projects = _visible_projects(user, None)
    qs = Task.objects.filter(project__in=projects).select_related("project", "assignee", "activity")
    can_see_projects = user.role in (User.Role.ADMIN, User.Role.RESPONSABLE)
    if scope == "projects" and can_see_projects:
        qs = qs.filter(project__in=[p for p in projects if can_manage_project(user, p)])
    else:
        scope = "mine"
        qs = qs.filter(assignee=user)
    tasks = list(qs.order_by("due_date", "id"))
    return {
        "as_of": today,
        "now": now_reference(),
        "scope": scope,
        "can_see_projects": can_see_projects,
        "mine_count": Task.objects.filter(project__in=projects, assignee=user).count(),
        "statuses": [{"key": k, "label": label} for k, label in Task.Status.choices],
        "tasks": [
            {
                "id": t.id, "title": t.title, "status": t.status, "status_label": t.get_status_display(),
                "due": t.due_date, "overdue": is_overdue(t, today), "priority": t.priority,
                "complete": t.is_complete, "assignee": _person(t.assignee),
                "activity": t.activity.name if t.activity else "",
                "project": {"id": t.project_id, "name": t.project.name},
                "can_edit": can_update_task_status(user, t),
                "can_approve": can_manage_project(user, t.project),
            }
            for t in tasks
        ],
        "avatars": _avatars({t.assignee for t in tasks if t.assignee}),
    }
