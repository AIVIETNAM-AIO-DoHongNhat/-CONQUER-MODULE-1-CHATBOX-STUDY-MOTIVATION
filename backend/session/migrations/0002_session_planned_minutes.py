from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("session", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="session",
            name="planned_minutes",
            field=models.PositiveIntegerField(default=30),
        ),
    ]
