from django.urls import path

from . import entry_views, views

urlpatterns = [
    path("tasks/", views.TaskListCreateView.as_view(), name="task-list"),
    path("tasks/<int:pk>/status/", views.TaskStatusView.as_view(), name="task-status"),
    path("tasks/<int:pk>/remind/", views.TaskRemindView.as_view(), name="task-remind"),
    path("projects/<int:pk>/milestones/", entry_views.MilestoneCreateView.as_view(), name="milestone-create"),
    path("milestones/<int:pk>/", entry_views.MilestoneView.as_view(), name="milestone"),
    path("projects/<int:pk>/deliverables/", entry_views.DeliverableCreateView.as_view(), name="deliverable-create"),
    path("deliverables/<int:pk>/", entry_views.DeliverableView.as_view(), name="deliverable"),
]
