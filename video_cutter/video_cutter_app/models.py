from django.db import models

# Create your models here.
class VideoCut(models.Model):
    video = models.ForeignKey('Video', on_delete=models.CASCADE)
    start_time = models.CharField(max_length=8)  # HH:MM:SS
    end_time = models.CharField(max_length=8)  # HH:MM:SS
    video_path = video_path = models.FileField(upload_to='videos/')  # Caminho para o arquivo de vídeo no sistema de arquivos
    
class Video(models.Model):
    video_file = models.FileField(upload_to='videos/')


# class VideoCut(models.Model):

#     start_time = models.CharField(max_length=8)
#     end_time = models.CharField(max_length=8)