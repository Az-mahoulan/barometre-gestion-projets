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


def build_calendar(user, year: int, month: int, project: int | None = None) -> dict:
    """Calendrier d'un mois : grille du lundi précédant le 1er au dimanche suivant la fin du mois."""
    from calendar import monthrange
    from datetime import date, timedelta

    from .services import build_agenda

    today = today_date()
    first = date(year, month, 1)
    last = date(year, month, monthrange(year, month)[1])
    start = first - timedelta(days=first.weekday())
    end = last + timedelta(days=6 - last.weekday())
    projects = list(_visible_projects(user, None).prefetch_related("deliverables"))
    choices = [{"id": p.id, "name": p.name} for p in sorted(projects, key=lambda p: p.name)]
    if project:
        projects = [p for p in projects if p.id == project]
    days = build_agenda(user, projects, today, start, end, extended=True)
    people = {u for p in projects for u in [p.owner] + [t.assignee for t in p.tasks.all()] if u}
    return {
        "as_of": today,
        "year": year,
        "month": month,
        "projects": choices,
        "days": [{"date": d, "in_month": d.month == month, "is_today": d == today, "items": items} for d, items in days.items()],
        "avatars": _avatars(people),
    }


def build_team_screen(user, country: str | None = None) -> dict:
    """Écran « Équipes » : disponibilité et charge de chacun, avec ses projets (parmi ceux visibles) et ses échéances
    des 7 prochains jours."""
    from datetime import timedelta

    from .services import build_teams

    today = today_date()
    teams = build_teams(country, today)
    projects = list(_visible_projects(user, None))
    soon = today + timedelta(days=7)
    users = {u.id: u for u in User.objects.filter(id__in=[m["id"] for m in teams["members"]]).select_related("presence")}
    for m in teams["members"]:
        # Projets en cours seulement (les projets achevés ne comptent plus dans la charge).
        mine = [
            p for p in projects
            if p.status == Project.Status.ACTIVE and (p.owner_id == m["id"] or any(t.assignee_id == m["id"] for t in p.tasks.all()))
        ]
        m["projects"] = [{"id": p.id, "name": p.name, "owner": p.owner_id == m["id"]} for p in mine]
        m["due_soon"] = sum(
            1 for p in projects for t in p.tasks.all() if t.assignee_id == m["id"] and not t.is_complete and today <= t.due_date <= soon
        )
        pres = getattr(users.get(m["id"]), "presence", None)
        m["until"] = pres.until if pres else None
        m["role_label"] = users[m["id"]].get_role_display() if m["id"] in users else ""
    return {"as_of": today, **teams, "avatars": _avatars(users.values())}


def build_notifications(user) -> dict:
    """Écran « Notifications » : ce qui est à traiter maintenant (retards, échéances proches, approbations) et le fil
    des projets visibles, avec les éléments non lus depuis la dernière consultation et les relances qui visent la
    personne."""
    from .services import build_critical

    today = today_date()
    projects = list(_visible_projects(user, None))
    stats = {p.id: project_stats(p, today) for p in projects}
    critical = build_critical(user, projects, stats, today, limit=None)
    seen = user.notifications_seen_at
    logs = ActivityLog.objects.filter(project__in=[p.id for p in projects]).select_related("actor", "project")[:40]
    feed = []
    for e in logs:
        # Les relances sont enregistrées au journal sous la forme « X a relancé Y pour « tâche » ».
        for_me = " a relancé " in e.message and f" a relancé {user.display_name} " in e.message
        feed.append(
            {"id": e.id, "message": e.message, "actor_name": e.actor.display_name if e.actor else "",
             "actor_initials": e.actor.initials if e.actor else "", "project": {"id": e.project_id, "name": e.project.name},
             "created_at": e.created_at, "unread": seen is None or e.created_at > seen, "for_me": for_me,
             "mine": e.actor_id == user.id}
        )
    return {
        "as_of": today,
        "now": now_reference(),
        "to_handle": critical,
        "feed": feed,
        "unread": sum(1 for f in feed if f["unread"] and not f["mine"]),
        "avatars": _avatars({e.actor for e in logs if e.actor}),
    }


def build_report(user, *, country: str | None = None, period: str = "year") -> dict:
    """Écran « Rapports » : chiffres clés de la période, synthèse par projet et par pays, évolution mensuelle."""
    from .services import build_kpis, build_trend, period_range

    today = today_date()
    p_start, p_end = period_range(period, today)
    base = list(_visible_projects(user, country).prefetch_related("deliverables"))
    stats = {p.id: project_stats(p, today) for p in base}
    in_period = [p for p in base if p.end_date >= p_start and p.start_date < p_end]
    rows = build_projects_overview(in_period, stats)
    for r in rows:
        r["tasks_overdue"] = stats[r["id"]]["tasks_overdue"]
    by_country: dict[str, dict] = {}
    for p in in_period:
        c = by_country.setdefault(p.country.name, {"country": p.country.name, "projects": 0, "active": 0, "late": 0, "risk": 0,
                                                   "completed": 0, "tasks_total": 0, "tasks_complete": 0, "tasks_overdue": 0})
        s = stats[p.id]
        c["projects"] += 1
        c["active"] += p.status == Project.Status.ACTIVE
        c["late"] += s["health"] == "late"
        c["risk"] += s["health"] == "risk"
        c["completed"] += s["health"] == "completed"
        c["tasks_total"] += s["tasks_total"]
        c["tasks_complete"] += s["tasks_complete"]
        c["tasks_overdue"] += s["tasks_overdue"]
    for c in by_country.values():
        c["progress"] = c["tasks_complete"] / c["tasks_total"] if c["tasks_total"] else 0.0
    return {
        "as_of": today,
        "period": {"key": period, "start": p_start, "end": p_end},
        "kpis": build_kpis(in_period, stats, p_start, p_end),
        "projects": rows,
        "by_country": sorted(by_country.values(), key=lambda c: -c["projects"]),
        "trend": build_trend([p for p in base if p.status == Project.Status.ACTIVE], today),
    }


REPORT_COLUMNS = [
    ("Projet", "name"), ("Pays", "country"), ("Responsable", "owner"), ("Début", "start"), ("Fin prévue", "end"),
    ("État", "health_label"), ("Avancement (%)", "progress_pct"), ("Performance (%)", "performance"),
    ("Jalons atteints", "milestones"), ("Livrables remis", "deliverables"), ("Tâches terminées", "tasks"),
    ("Tâches en retard", "tasks_overdue"), ("Prochain jalon", "next"),
]
HEALTH_LABEL = {"ok": "Dans les temps", "risk": "À surveiller", "late": "En retard", "completed": "Achevé"}


def report_csv(report: dict) -> str:
    """Synthèse par projet au format CSV (séparateur « ; », lisible directement par Excel en français)."""
    import csv
    import io

    out = io.StringIO()
    writer = csv.writer(out, delimiter=";")
    writer.writerow([label for label, _ in REPORT_COLUMNS])
    for r in report["projects"]:
        nm = r["next_milestone"]
        values = {
            **r,
            "health_label": HEALTH_LABEL[r["health"]],
            "progress_pct": round(r["progress"] * 100),
            "performance": "" if r["performance"] is None else r["performance"],
            "milestones": f"{r['milestones_achieved']}/{r['milestones_total']}",
            "deliverables": f"{r['deliverables_done']}/{r['deliverables_total']}",
            "tasks": f"{r['tasks_complete']}/{r['tasks_total']}",
            "next": f"{nm['name']} ({nm['date']})" if nm else "",
        }
        writer.writerow([values[key] for _, key in REPORT_COLUMNS])
    return "﻿" + out.getvalue()  # BOM : Excel reconnaît l'UTF-8 (accents)
