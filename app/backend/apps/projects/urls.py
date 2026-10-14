from django.urls import path

from . import views

urlpatterns = [
    path("tasks/", views.TaskListCreateView.as_view(), name="task-list"),
    path("tasks/<int:pk>/status/", views.TaskStatusView.as_view(), name="task-status"),
    path("tasks/<int:pk>/remind/", views.TaskRemindView.as_view(), name="task-remind"),
]
