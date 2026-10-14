from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source="assignee.display_name", read_only=True, default=None)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "project", "project_name", "activity", "title", "assignee", "assignee_name",
            "status", "priority", "due_date",
        ]
        read_only_fields = ["id", "project_name", "assignee_name"]

    def validate(self, attrs):
        activity = attrs.get("activity")
        project = attrs.get("project") or (self.instance.project if self.instance else None)
        if activity and project and activity.project_id != project.id:
            raise serializers.ValidationError({"activity": "Cette activité n'appartient pas à ce projet."})
        return attrs


class TaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.Status.choices)
