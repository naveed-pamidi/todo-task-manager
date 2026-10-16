from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def home(request):
    return JsonResponse({'message': 'To-Do API is running', 'tasks_endpoint': '/api/tasks/'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path('', home),
]
