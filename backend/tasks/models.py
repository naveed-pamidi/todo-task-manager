from django.db import models
from django.utils import timezone


class Task(models.Model):
    PRIORITY_CHOICES = [('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')]
    STATUS_CHOICES = [('Pending', 'Pending'), ('Completed', 'Completed')]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    deadline = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def is_overdue(self):
        return bool(self.deadline and self.status == 'Pending' and self.deadline < timezone.localdate())

    def __str__(self):
        return self.title
