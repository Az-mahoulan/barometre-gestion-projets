from django.urls import path

from . import admin_views, views

urlpatterns = [
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("health/", views.HealthView.as_view(), name="health"),
    path("countries/", views.CountriesView.as_view(), name="countries"),
    path("projects/", views.ProjectsView.as_view(), name="projects"),
    path("projects/<int:pk>/", views.ProjectDetailView.as_view(), name="project-detail"),
    path("my-tasks/", views.MyTasksView.as_view(), name="my-tasks"),
    path("calendar/", views.CalendarView.as_view(), name="calendar"),
    path("teams/", views.TeamsView.as_view(), name="teams"),
    path("notifications/", views.NotificationsView.as_view(), name="notifications"),
    path("reports/", views.ReportView.as_view(), name="reports"),
    path("notifications/seen/", views.NotificationsSeenView.as_view(), name="notifications-seen"),
    path("admin/overview/", admin_views.AdminOverviewView.as_view(), name="admin-overview"),
    path("admin/users/", admin_views.AdminUsersView.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/", admin_views.AdminUserView.as_view(), name="admin-user"),
    path("admin/users/<int:pk>/password/", admin_views.AdminUserPasswordView.as_view(), name="admin-user-password"),
    path("admin/projects/", admin_views.AdminProjectsView.as_view(), name="admin-projects"),
    path("admin/projects/<int:pk>/", admin_views.AdminProjectView.as_view(), name="admin-project"),
    path("admin/countries/", admin_views.AdminCountriesView.as_view(), name="admin-countries"),
]
