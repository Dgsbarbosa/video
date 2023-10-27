from django import forms
from .models import VideoCut

class VideoCutForm(forms.ModelForm):
    class Meta:
        model = VideoCut
        fields = ['video', 'start_time', 'end_time']
