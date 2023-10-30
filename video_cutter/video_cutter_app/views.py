# views.py
#coding:latin-1
from django.conf import settings


from django.shortcuts import render,redirect
from .models import Video, VideoCut
from django.http import FileResponse
from django.http import JsonResponse
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip
from moviepy.editor import VideoFileClip
import json
import tempfile
import os

import tempfile
import shutil

def home(request):
    if request.method == 'POST' and 'video' in request.FILES:
        video = Video.objects.create(video_file=request.FILES['video'])
    else:
        video = Video.objects.first()

    context = {'video': video}
    return render(request, 'video_cutter_app/home.html', context)



def process_video(request):
    # Limpar o banco de dados no início da função
    
    if request.method == 'POST':
        Video.objects.all().delete()
        VideoCut.objects.all().delete()
    
        video_file = request.FILES.get('video')
        cuts_json = request.POST.get('cuts')
        
        if cuts_json is not None:
            cuts = json.loads(cuts_json)
            video_clip = VideoFileClip(video_file.temporary_file_path())
            video_duration = video_clip.duration
            video_clip.close()

            cut_objects = []
            video = None  # Inicialize o objeto Video

            limpar_pasta_videos()
            try:
                video = Video.objects.create(video_file=video_file)  # Crie e salve o objeto Video
            except Exception as e:
                return redirect('home')  # Redirecionar de volta para a página inicial em caso de erro

            for idx, cut in enumerate(cuts, start=1):
                start_time = convert_to_seconds(cut['start'])
                end_time = convert_to_seconds(cut['end'])
    
                start_time = max(0, start_time)
                end_time = min(video_duration, end_time)

                if start_time >= video_duration or end_time >= video_duration:
                    invalid_cut = VideoCut(video_path='Intervalo inválido', start_time=cut['start'], end_time=cut['end'],video=video)
                    invalid_cut.save()
                    cut_objects.append(invalid_cut)
                else:
                    temp_filename = f'temp_cut_{idx}.mp4'
                    temp_filepath = os.path.join(settings.MEDIA_ROOT, 'videos', temp_filename)

                    ffmpeg_extract_subclip(video_file.temporary_file_path(), start_time, end_time, targetname=temp_filepath)
                    
                    try:
                        cut_obj = VideoCut(
                            video_path=f"videos/{temp_filename}",
                            start_time=cut['start'],
                            end_time=cut['end'],
                            video=video  # Use o objeto Video criado
                        )
                        cut_obj.save()
                        cut_objects.append(cut_obj)
                    except Exception as e:
                        return redirect('home')

            # Redirecionar para a página "results" após o processamento
            return JsonResponse({'message': 'Operação concluída com sucesso'})

def results(request):
    # Adicione a lógica para recuperar os cortes processados aqui
    
    # C:\Users\guinh\Desktop\video\video_cutter\media\videos\corte2.mp4
    
    video_original = Video.objects.last()
    cuts = VideoCut.objects.filter(video=video_original) 
    
    
    
    context = {
        'video': video_original,
        'cuts': cuts,
    }
    return render(request, 'video_cutter_app/results.html', context)

def limpar_pasta_videos():
    pasta_videos = os.path.join(settings.MEDIA_ROOT, 'videos')
    
    # Verifique se a pasta de vídeos existe
    if os.path.exists(pasta_videos):
        # Liste todos os arquivos na pasta
        
        arquivos = os.listdir(pasta_videos)
        
        # Exclua cada arquivo na pasta
        for arquivo in arquivos:
            caminho_arquivo = os.path.join(pasta_videos, arquivo)
            os.remove(caminho_arquivo)
    else:
        # Se a pasta não existir, crie-a
        os.makedirs(pasta_videos, exist_ok=True)
        
        
        
def convert_to_seconds(string):
    partes = string.split(":")
    horas, minutos, segundos = 0, 0, 0
    if len(partes) == 3:
        horas, minutos, segundos = map(int, partes)
        total_seconds = horas * 3600 + minutos * 60 + segundos
        
    elif len(partes) == 2:
        minutos, segundos = map(int,partes)
        total_seconds = minutos * 60 + segundos
    else:
        # print("Formato de tempo inválido. Use HH:MM:SS.")
        return None
    
    # print(f"{horas} horas, {minutos} minutos, {segundos} segundos")
    # print("total_seconds", total_seconds)
    return total_seconds
                
                            