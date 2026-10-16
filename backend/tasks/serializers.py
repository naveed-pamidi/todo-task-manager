from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'deadline', 'priority',
                  'status', 'created_at', 'is_overdue']
        read_only_fields = ['created_at']
        extra_kwargs = {
            'title': {'error_messages': {
                'blank': 'Task title cannot be empty.',
                'required': 'Task title is required.',
            }},
        }

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Task title cannot be empty.')
        return value