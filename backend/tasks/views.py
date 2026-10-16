from django.utils import timezone
from rest_framework import viewsets

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """
    GET    /api/tasks/        list  (?status=Pending|Completed &search=... &priority=High &overdue=true)
    POST   /api/tasks/        create
    GET    /api/tasks/<id>/   retrieve
    PUT    /api/tasks/<id>/   full update
    PATCH  /api/tasks/<id>/   partial update (e.g. change status)
    DELETE /api/tasks/<id>/   delete
    """
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.all()
        p = self.request.query_params
        if p.get('status') in ('Pending', 'Completed'):
            qs = qs.filter(status=p['status'])
        if p.get('priority') in ('Low', 'Medium', 'High'):
            qs = qs.filter(priority=p['priority'])
        if p.get('search'):
            qs = qs.filter(title__icontains=p['search'])
        if p.get('overdue') == 'true':
            qs = qs.filter(status='Pending', deadline__lt=timezone.localdate())
        return qs
