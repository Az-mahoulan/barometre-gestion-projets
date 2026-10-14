from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Country, Presence, User


@admin.register(User)
class AppUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Baromètre", {"fields": ("role", "job_title", "country")}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("Baromètre", {"fields": ("role", "job_title", "country")}),)
    list_display = ("username", "get_full_name", "role", "country", "is_active")
    list_filter = ("role", "country", "is_active")


admin.site.register(Country)
admin.site.register(Presence)
