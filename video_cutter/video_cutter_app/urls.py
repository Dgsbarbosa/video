from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('process_video', views.process_video, name="process_video"),
    path('results/', views.results, name="results"),
    path('download_all_cuts/', views.download_all_cuts, name='download_all_cuts'),
    
]
