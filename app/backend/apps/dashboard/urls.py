from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
    path("countries/", views.CountriesView.as_view(), name="countries"),
]
