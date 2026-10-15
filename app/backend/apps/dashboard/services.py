"""Calculs du tableau de bord.

Règles (à valider avec le Baromètre) :
- une tâche est « avancée » dès qu'elle est faite, en revue ou approuvée ;
- un projet est « en retard » s'il a un jalon dépassé non atteint ou au moins 2 tâches en retard ;
  « à surveiller » s'il a 1 tâche en retard ou un avancement inférieur de plus de 15 points au temps écoulé ;
- performance = avancement réel ÷ avancement attendu à ce jour (indisponible au tout début du projet
  ou tant qu'aucune tâche n'est planifiée).
"""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime, time, timedelta

from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone

from apps.accounts.models import User
from apps.projects.access import can_manage_project, visible_projects
from apps.projects.models import ActivityLog, CalendarEvent, Project, Task

MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
SEVERITY_RANK = {"late": 0, "risk": 1, "info": 2}
DUE_SOON_DAYS = 3


def today_date() -> date:
    return settings.APP_DEMO_TODAY or timezone.localdate()


def now_reference() -> datetime:
    """Horloge de référence : en démonstration, 14 h le jour fixé ; sinon l'instant présent."""
    if settings.APP_DEMO_TODAY:
        return timezone.make_aware(datetime.combine(settings.APP_DEMO_TODAY, time(14, 0)))
    return timezone.now()


def add_months(d: date, n: int) -> date:
    index = d.year * 12 + (d.month - 1) + n
    return date(index // 12, index % 12 + 1, 1)


def period_range(period: str, today: date) -> tuple[date, date]:
    if period == "month":
        start = date(today.year, today.month, 1)
        return start, add_months(start, 1)
    if period == "quarter":
        start = date(today.year, 3 * ((today.month - 1) // 3) + 1, 1)
        return start, add_months(start, 3)
    return date(today.year, 1, 1), date(today.year + 1, 1, 1)


def is_overdue(task: Task, today: date) -> bool:
    return not task.is_complete and task.due_date < today


def project_stats(project: Project, today: date) -> dict:
    tasks = list(project.tasks.all())
    milestones = list(project.milestones.all())
    total = len(tasks)
    complete = sum(1 for t in tasks if t.is_complete)
    overdue = sum(1 for t in tasks if is_overdue(t, today))
    progress = complete / total if total else 0.0
    span = (project.end_date - project.start_date).days
    elapsed = min(1.0, max(0.0, (today - project.start_date).days / span)) if span else 1.0
    overdue_milestones = [m for m in milestones if not m.is_achieved and m.due_date < today]

    if project.status != Project.Status.ACTIVE:
        health = "completed"
    elif overdue_milestones or overdue >= 2:
        health = "late"
    elif overdue >= 1 or (total and progress < elapsed - 0.15):
        health = "risk"
    else:
        health = "ok"

    performance = None
    if project.status == Project.Status.ACTIVE and total and elapsed >= 0.1:
        performance = round(progress / elapsed * 100)

    next_milestone = next((m for m in milestones if not m.is_achieved), None)
    return {
        "tasks_total": total,
        "tasks_complete": complete,
        "tasks_overdue": overdue,
        "progress": progress,
        "elapsed": elapsed,
        "health": health,
        "performance": performance,
        "milestones_total": len(milestones),
        "milestones_achieved": sum(1 for m in milestones if m.is_achieved),
        "overdue_milestones": overdue_milestones,
        "next_milestone": next_milestone,
    }


def _next_milestone_payload(milestone, today: date):
    if milestone is None:
        return None
    return {"name": milestone.name, "date": milestone.due_date, "overdue": milestone.due_date < today}


def _visible_projects(user, country: str | None):
    qs = (
        visible_projects(user)
        .select_related("country", "owner")
        .prefetch_related("tasks__assignee", "milestones", "activities")
    )
    if country:
        qs = qs.filter(country__code=country)
    return qs


def _scope_tasks(user, projects) -> list[Task]:
    tasks = [t for p in projects for t in p.tasks.all()]
    if user.role == User.Role.MEMBRE:
        tasks = [t for t in tasks if t.assignee_id == user.id]
    return tasks


def build_kpis(projects, stats, period_start: date, period_end: date) -> dict:
    active = [p for p in projects if p.status == Project.Status.ACTIVE]
    milestones = [m for p in projects for m in p.milestones.all() if period_start <= m.due_date < period_end]
    achieved = sum(1 for m in milestones if m.is_achieved)
    late = [p for p in active if stats[p.id]["health"] == "late"]
    return {
        "active_projects": len(active),
        "at_risk_projects": sum(1 for p in active if stats[p.id]["health"] == "risk"),
        "late_projects": len(late),
        "late_milestones": sum(len(stats[p.id]["overdue_milestones"]) for p in late),
        "completed_projects": sum(1 for p in projects if p.status == Project.Status.COMPLETED),
        "milestones_total": len(milestones),
        "milestones_achieved": achieved,
        "milestones_pct": round(achieved / len(milestones) * 100) if milestones else 0,
    }


def build_gantt(projects, stats, today: date) -> list[dict]:
    rows = []
    for p in sorted(projects, key=lambda p: (p.status != Project.Status.ACTIVE, p.start_date, p.name)):
        s = stats[p.id]
        activities = []
        for a in p.activities.all():
            ts = [t for t in p.tasks.all() if t.activity_id == a.id]
            done = sum(1 for t in ts if t.is_complete)
            activities.append(
                {
                    "id": a.id, "name": a.name, "start": a.start_date, "end": a.end_date,
                    "tasks_total": len(ts), "tasks_complete": done,
                    "progress": done / len(ts) if ts else 0.0,
                }
            )
        rows.append(
            {
                "id": p.id, "name": p.name, "status": p.status, "health": s["health"],
                "start": p.start_date, "end": p.end_date, "progress": s["progress"],
                "next_milestone": _next_milestone_payload(s["next_milestone"], today),
                "milestones": [
                    {"name": m.name, "date": m.due_date, "achieved": m.is_achieved,
                     "overdue": not m.is_achieved and m.due_date < today}
                    for m in p.milestones.all()
                ],
                "activities": activities,
            }
        )
    return rows


def _people(users) -> list[dict]:
    """Personnes à afficher sur un élément de l'agenda (sans doublon, utilisateurs supprimés ignorés)."""
    seen, out = set(), []
    for u in users:
        if u is not None and u.id not in seen:
            seen.add(u.id)
            out.append({"initials": u.initials, "name": u.display_name})
    return out


def build_week(user, projects, today: date, offset: int) -> dict:
    """Agenda de la semaine : réunions (bleu) et échéances (orange, rouge si dépassées) avec les personnes concernées."""
    monday = today - timedelta(days=today.weekday()) + timedelta(weeks=offset)
    sunday = monday + timedelta(days=6)
    visible_ids = {p.id for p in projects}
    tz = timezone.get_current_timezone()
    start_dt = timezone.make_aware(datetime.combine(monday, time.min), tz)
    end_dt = timezone.make_aware(datetime.combine(sunday + timedelta(days=1), time.min), tz)
    events = CalendarEvent.objects.filter(starts_at__gte=start_dt, starts_at__lt=end_dt).prefetch_related("participants")
    days = {monday + timedelta(days=i): [] for i in range(7)}
    in_week = lambda d: monday <= d <= sunday

    for e in events:
        if e.project_id and e.project_id not in visible_ids:
            continue
        local = timezone.localtime(e.starts_at, tz)
        days[local.date()].append(
            {"kind": "event", "title": e.title, "subtitle": e.get_kind_display(), "time": local.strftime("%H:%M"),
             "people": _people(e.participants.all())}
        )
    scope_tasks = _scope_tasks(user, projects)
    for p in projects:
        if in_week(p.end_date):
            done = p.status != Project.Status.ACTIVE
            days[p.end_date].append(
                {"kind": "project", "title": p.name, "subtitle": "Fin prévue", "done": done,
                 "late": not done and p.end_date < today, "people": _people([p.owner])}
            )
        for a in p.activities.all():
            if in_week(a.end_date):
                ts = [t for t in p.tasks.all() if t.activity_id == a.id]
                done = bool(ts) and all(t.is_complete for t in ts)
                days[a.end_date].append(
                    {"kind": "activity", "title": a.name, "subtitle": p.name, "done": done,
                     "late": not done and a.end_date < today, "people": _people(t.assignee for t in ts)}
                )
        for m in p.milestones.all():
            if in_week(m.due_date):
                days[m.due_date].append(
                    {"kind": "milestone", "title": m.name, "subtitle": p.name, "done": m.is_achieved,
                     "late": not m.is_achieved and m.due_date < today, "people": _people([p.owner])}
                )
    for t in scope_tasks:
        if in_week(t.due_date):
            days[t.due_date].append(
                {"kind": "task", "title": t.title, "subtitle": f"{p_name(projects, t.project_id)}",
                 "done": t.is_complete, "late": is_overdue(t, today), "task_id": t.id, "people": _people([t.assignee])}
            )
    return {
        "start": monday, "end": sunday, "offset": offset,
        "days": [{"date": d, "is_today": d == today, "items": items} for d, items in days.items()],
    }


def p_name(projects, project_id: int) -> str:
    return next((p.name for p in projects if p.id == project_id), "")


def build_trend(projects, today: date) -> list[dict]:
    first = add_months(date(today.year, today.month, 1), -3)
    out = []
    for i in range(6):
        m_start = add_months(first, i)
        m_end = add_months(m_start, 1)
        ms = [m for p in projects for m in p.milestones.all() if m_start <= m.due_date < m_end]
        achieved = sum(1 for m in ms if m.is_achieved)
        if m_end <= today:
            state = "past"
        elif m_start <= today:
            state = "current"
        else:
            state = "future"
        out.append(
            {
                "month": m_start.strftime("%Y-%m"), "label": MONTHS_FR[m_start.month - 1], "state": state,
                "total": len(ms), "achieved": achieved if state != "future" else 0,
                "pct": round(achieved / len(ms) * 100) if ms and state != "future" else None,
            }
        )
    return out


def build_task_progress(tasks) -> dict:
    counts = Counter(t.status for t in tasks)
    total = len(tasks)
    return {
        "total": total,
        "overdue": 0,  # renseigné par l'appelant
        "statuses": [
            {"key": key, "label": label, "count": counts.get(key, 0),
             "pct": round(counts.get(key, 0) / total * 100) if total else 0}
            for key, label in Task.Status.choices
        ],
    }


def build_critical(user, projects, stats, today: date) -> dict:
    items: list[dict] = []
    active = [p for p in projects if p.status == Project.Status.ACTIVE]
    if user.role != User.Role.MEMBRE:
        for p in active:
            for m in stats[p.id]["overdue_milestones"]:
                items.append(
                    {"severity": "late", "kind": "milestone_overdue", "title": f"Jalon « {m.name} » dépassé",
                     "subtitle": f"{p.name} · {(today - m.due_date).days} jours de retard",
                     "action": "reschedule", "project_id": p.id, "days": (today - m.due_date).days}
                )
    for t in _scope_tasks(user, active):
        who = t.assignee.display_name if t.assignee else "Non assignée"
        if is_overdue(t, today):
            days = (today - t.due_date).days
            items.append(
                {"severity": "late", "kind": "task_overdue", "title": t.title,
                 "subtitle": f"{t.project.name} · {who} · {days} jours de retard",
                 "action": "remind" if can_manage_project(user, t.project) else None, "task_id": t.id, "days": days}
            )
        elif not t.is_complete and 0 <= (t.due_date - today).days <= DUE_SOON_DAYS:
            left = (t.due_date - today).days
            items.append(
                {"severity": "risk", "kind": "task_due_soon", "title": t.title,
                 "subtitle": f"{t.project.name} · {who} · échéance " + ("aujourd'hui" if left == 0 else "demain" if left == 1 else f"dans {left} jours"),
                 "action": "remind" if can_manage_project(user, t.project) else None, "task_id": t.id, "days": -left}
            )
        elif t.status == Task.Status.REVIEW and can_manage_project(user, t.project):
            items.append(
                {"severity": "info", "kind": "review_pending", "title": t.title,
                 "subtitle": f"{t.project.name} · en revue, à approuver", "action": "approve", "task_id": t.id, "days": 0}
            )
    items.sort(key=lambda i: (SEVERITY_RANK[i["severity"]], -i["days"]))
    return {"total": len(items), "items": items[:8]}


def build_activity(projects) -> list[dict]:
    logs = ActivityLog.objects.filter(project__in=[p.id for p in projects]).select_related("actor", "project")[:6]
    return [
        {"id": entry.id, "message": entry.message, "actor_initials": entry.actor.initials if entry.actor else "",
         "project": entry.project.name, "created_at": entry.created_at}
        for entry in logs
    ]


def build_projects_overview(projects, stats) -> list[dict]:
    rows = []
    for p in sorted(projects, key=lambda p: (p.status != Project.Status.ACTIVE, p.start_date, p.name)):
        s = stats[p.id]
        rows.append(
            {
                "id": p.id, "name": p.name, "country": p.country.name, "owner": p.owner.display_name,
                "owner_initials": p.owner.initials, "start": p.start_date, "end": p.end_date, "status": p.status,
                "health": s["health"], "progress": s["progress"], "tasks_complete": s["tasks_complete"],
                "tasks_total": s["tasks_total"], "activities": len(p.activities.all()),
                "milestones_achieved": s["milestones_achieved"], "milestones_total": s["milestones_total"],
                "performance": s["performance"],
                "next_milestone": _next_milestone_payload(s["next_milestone"], today_date()),
            }
        )
    return rows


def build_teams(country: str | None, today: date) -> dict:
    # Les comptes d'administration ne sont pas des membres d'équipe.
    users = User.objects.filter(is_active=True, is_superuser=False).exclude(role=User.Role.ADMIN).select_related("presence", "country")
    if country:
        users = users.filter(country__code=country)
    load = {
        row["assignee"]: row
        for row in Task.objects.exclude(status__in=Task.COMPLETE)
        .values("assignee")
        .annotate(open=Count("id"), overdue=Count("id", filter=Q(due_date__lt=today)))
    }
    members = []
    for u in users.order_by("last_name", "first_name"):
        pres = getattr(u, "presence", None)
        counts = load.get(u.id, {"open": 0, "overdue": 0})
        members.append(
            {
                "id": u.id, "name": u.display_name, "initials": u.initials, "job_title": u.job_title,
                "country": u.country.name if u.country else "",
                "status": pres.status if pres else "available",
                "status_label": pres.get_status_display() if pres else "Disponible",
                "reason": pres.reason if pres else "",
                "place": pres.place if pres else "office",
                "place_label": (pres.get_place_display() if pres else "Au bureau")
                + (f" · {pres.place_detail}" if pres and pres.place_detail else ""),
                "open_tasks": counts["open"], "overdue_tasks": counts["overdue"],
            }
        )
    return {"available": sum(1 for m in members if m["status"] == "available"), "total": len(members), "members": members}


def build_dashboard(user, *, country: str | None = None, period: str = "year", week: int = 0,
                    trend_project: int | None = None, tasks_project: int | None = None,
                    today: date | None = None) -> dict:
    today = today or today_date()
    p_start, p_end = period_range(period, today)
    base = list(_visible_projects(user, country))
    stats_all = {p.id: project_stats(p, today) for p in base}
    in_period = [p for p in base if p.end_date >= p_start and p.start_date < p_end]

    trend_base = [p for p in base if trend_project is None or p.id == trend_project]
    scope_tasks = _scope_tasks(user, in_period)
    # La progression des tâches peut être limitée à un projet ; les indicateurs restent globaux.
    progress_tasks = [t for t in scope_tasks if tasks_project is None or t.project_id == tasks_project]
    progress = build_task_progress(progress_tasks)
    progress["overdue"] = sum(1 for t in progress_tasks if is_overdue(t, today))
    progress["in_review"] = sum(1 for t in progress_tasks if t.status == Task.Status.REVIEW)
    kpis = build_kpis(in_period, stats_all, p_start, p_end)
    kpis["overdue_tasks"] = sum(1 for t in scope_tasks if is_overdue(t, today))

    return {
        "as_of": today,
        "now": now_reference(),
        "user": {"name": user.display_name, "role": user.role, "role_label": user.get_role_display()},
        "scope": {"admin": "all", "responsable": "owned", "membre": "assigned"}[user.role],
        "filters": {"country": country, "period": period},
        "kpis": kpis,
        "gantt": build_gantt(in_period, stats_all, today),
        "week": build_week(user, in_period, today, week),
        "trend": build_trend(trend_base, today),
        "task_progress": progress,
        "critical_actions": build_critical(user, in_period, stats_all, today),
        "recent_activity": build_activity(in_period),
        "projects": build_projects_overview(in_period, stats_all),
        "teams": build_teams(country, today),
    }
