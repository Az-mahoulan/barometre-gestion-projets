from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("health/", views.HealthView.as_view(), name="health"),
    path("countries/", views.CountriesView.as_view(), name="countries"),
    path("projects/", views.ProjectsView.as_view(), name="projects"),
    path("projects/<int:pk>/", views.ProjectDetailView.as_view(), name="project-detail"),
    path("my-tasks/", views.MyTasksView.as_view(), name="my-tasks"),
    path("calendar/", views.CalendarView.as_view(), name="calendar"),
]
