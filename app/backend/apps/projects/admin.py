from django.contrib import admin

from .models import (
    ActivityLog,
    CalendarEvent,
    Milestone,
    Project,
    ProjectActivity,
    Task,
)


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 0


class ActivityInline(admin.TabularInline):
    model = ProjectActivity
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "owner", "start_date", "end_date", "status")
    list_filter = ("status", "country")
    inlines = [ActivityInline, MilestoneInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "assignee", "status", "due_date")
    list_filter = ("status", "project")


admin.site.register(CalendarEvent)
admin.site.register(ActivityLog)
