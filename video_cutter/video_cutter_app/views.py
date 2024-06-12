# views.py
#coding:latin-1
from io import BytesIO
from django.conf import settings
from pytube import YouTube

from django.shortcuts import render,redirect
from .models import Video, VideoCut
from django.http import FileResponse
from django.http import JsonResponse
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip
from moviepy.editor import VideoFileClip
import json
import zipfile
import os
from django.http import HttpResponse

from django.core.files.storage import default_storage

def download_youtube_video(url, download_path):
    new_filename = "video_original"
    try:
        yt = YouTube(url)
        stream = yt.streams.get_highest_resolution()
        downloaded_file_path = stream.download(output_path=download_path)
        
        if new_filename:
            # Obtenha a extens�o do arquivo original
            original_extension = os.path.splitext(downloaded_file_path)[1]
            new_file_path = os.path.join(download_path, new_filename + original_extension)
            
            # Renomeie o arquivo
            os.rename(downloaded_file_path, new_file_path)
            return new_file_path
        else:
            return downloaded_file_path
    except Exception as e:
        return f"Erro ao baixar o video: {e}"
    
    
def home(request):
    limpar_pasta_videos()
    
    video = None  # Inicializa a vari�vel video
    
    if request.method == 'POST':
        if 'video' in request.FILES:
            video = Video.objects.create(video_file=request.FILES['video'])
            
        elif 'youtube_url' in request.POST:
            youtube_url = request.POST['youtube_url']
            download_path = os.path.join(settings.MEDIA_ROOT, 'videos')
            os.makedirs(download_path, exist_ok=True)
            download_result = download_youtube_video(youtube_url, download_path)
            
          
            if not download_result.startswith("Erro"):
                video = Video.objects.create(video_file=os.path.join('videos', download_result))
            else:
                return JsonResponse({'error': download_result})
    

    context = {'video': video}
    return render(request, 'video_cutter_app/home.html', context)



def process_video(request):    
    
    
    if request.method == 'POST':
        
        # Limpar o banco de dados no in�cio da fun��o
        Video.objects.all().delete()
        VideoCut.objects.all().delete()
        # Crie a pasta tempor�ria
        limpar_pasta_videos()
    
        video_file = request.FILES.get('video')
      
        
        cuts_json = request.POST.get('cuts')
        
        if cuts_json is not None:
            
            temp_file = default_storage.save(os.path.join('videos', video_file.name), video_file)
            temp_file_path_origin = os.path.join(settings.MEDIA_ROOT, temp_file)
            
            cuts = json.loads(cuts_json)
            video_clip = VideoFileClip(temp_file_path_origin)
            video_duration = video_clip.duration
            video_clip.close()

            cut_objects = []
            video = None  # Inicialize o objeto Video

            
            # Crie a pasta tempor�ria            
            
            try:
                video = Video.objects.create(video_file=temp_file_path_origin)  # Crie e salve o objeto Video
                
            except Exception as e:
                return JsonResponse({'error': e})  
            for idx, cut in enumerate(cuts, start=1):
            
                
                start_time = convert_to_seconds(cut['start'])
                end_time = convert_to_seconds(cut['end'])

                
                start_time = max(0, start_time)
                end_time = min(video_duration, end_time)

                if start_time >= video_duration or end_time >= video_duration:
                    invalid_cut = VideoCut(video_path='Intervalo invalido', start_time=cut['start'], end_time=cut['end'],video=video)
                    invalid_cut.save()
                    cut_objects.append(invalid_cut)
                else:
                    temp_filename = f'temp_cut_{idx}.mp4'
                    temp_filepath = os.path.join(settings.MEDIA_ROOT, 'videos', temp_filename)

                    ffmpeg_extract_subclip(temp_file_path_origin, start_time, end_time, targetname=temp_filepath)
         
                    
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

            # Redirecionar para a p�gina "results" ap�s o processamento
            return JsonResponse({'message': 'Ok'})

def results(request):
    # Adicione a l�gica para recuperar os cortes processados aqui
    
    
    video_original = Video.objects.last()
    cuts = VideoCut.objects.filter(video=video_original) 
    
    
    
    context = {
        'video': video_original,
        'cuts': cuts,
    }
    return render(request, 'video_cutter_app/results.html', context)


# faz um dowload em zip de todos os corte
def download_all_cuts(request):
    pasta_videos = os.path.join(settings.MEDIA_ROOT, 'videos')
    arquivos = os.listdir(pasta_videos)

    # Crie um objeto de buffer para armazenar o arquivo zip
    buffer = BytesIO()

    # Crie um arquivo zip
    with zipfile.ZipFile(buffer, 'w') as zip_file:
        # Adicione cada arquivo de vídeo à pasta zip
        for arquivo in arquivos:
            if arquivo.startswith('temp'):
                caminho_arquivo = os.path.join(pasta_videos, arquivo)
                zip_file.write(caminho_arquivo, os.path.basename(caminho_arquivo))

    # Configure a resposta HTTP com o conteúdo do arquivo zip
    response = HttpResponse(buffer.getvalue(), content_type='application/zip')
    response['Content-Disposition'] = 'attachment; filename="cortes.zip"'

    return response


def limpar_pasta_videos():
    
    pasta_videos = os.path.join(settings.MEDIA_ROOT, 'videos')
    # Verifique se a pasta de v�deos existe
    if os.path.exists(pasta_videos) :
        # Liste todos os arquivos na pasta
        
        arquivos = os.listdir(pasta_videos)
        
        for arquivo in arquivos:
            caminho_arquivo = os.path.join(pasta_videos, arquivo)
            os.remove(caminho_arquivo)
        
        
    else:
        # Se a pasta n�o existir, crie-a
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
        # print("Formato de tempo inv�lido. Use HH:MM:SS.")
        return None
    
    # print(f"{horas} horas, {minutos} minutos, {segundos} segundos")
    # print("total_seconds", total_seconds)
    return total_seconds
                
                            