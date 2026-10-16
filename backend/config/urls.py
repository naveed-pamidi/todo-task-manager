from pathlib import Path

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.views.generic import TemplateView

FRONTEND_INDEX = (
    Path(__file__).resolve().parents[2] / "frontend" / "dist" / "index.html"
)


def home(request):
    return JsonResponse({'message': 'To-Do API is running', 'tasks_endpoint': '/api/tasks/'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path(
        '',
        TemplateView.as_view(template_name='index.html')
        if FRONTEND_INDEX.is_file()
        else home,
    ),
]
