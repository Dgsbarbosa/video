# Generated by Django 4.2.6 on 2023-10-26 19:29

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("video_cutter_app", "0002_video_delete_videocut"),
    ]

    operations = [
        migrations.CreateModel(
            name="VideoCut",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("start_time", models.CharField(max_length=8)),
                ("end_time", models.CharField(max_length=8)),
                (
                    "video",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="video_cutter_app.video",
                    ),
                ),
            ],
        ),
    ]
