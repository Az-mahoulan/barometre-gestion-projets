"""Périmètre et droits d'accès, par rôle.

- Administrateur : tous les projets, toutes les actions.
- Responsable : les projets dont il est responsable.
- Membre : les projets où une tâche lui est assignée ; il ne modifie que ses propres tâches.
"""

from django.db.models import Q, QuerySet

from .models import Project, Task


def visible_projects(user) -> QuerySet[Project]:
    qs = Project.objects.all()
    if user.role == user.Role.ADMIN:
        return qs
    if user.role == user.Role.RESPONSABLE:
        return qs.filter(owner=user)
    return qs.filter(Q(tasks__assignee=user)).distinct()


def can_manage_project(user, project: Project) -> bool:
    return user.role == user.Role.ADMIN or (user.role == user.Role.RESPONSABLE and project.owner_id == user.id)


def can_update_task_status(user, task: Task) -> bool:
    if can_manage_project(user, task.project):
        return True
    return user.role == user.Role.MEMBRE and task.assignee_id == user.id
