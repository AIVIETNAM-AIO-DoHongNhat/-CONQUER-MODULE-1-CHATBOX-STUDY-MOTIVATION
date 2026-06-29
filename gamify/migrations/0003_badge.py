from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gamify", "0002_repair_dailygoal_table"),
    ]

    operations = [
        migrations.CreateModel(
            name="Badge",
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.CharField(max_length=80, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("description", models.TextField(blank=True)),
                (
                    "condition_type",
                    models.CharField(
                        choices=[
                            ("streak_days", "Streak days"),
                            ("total_focus_minutes", "Total focus minutes"),
                            ("total_sessions", "Total sessions"),
                            ("xp", "XP"),
                            ("level", "Level"),
                        ],
                        max_length=40,
                    ),
                ),
                ("threshold", models.PositiveIntegerField()),
                ("icon", models.CharField(blank=True, max_length=120, null=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "Badge",
                "verbose_name_plural": "Badges",
                "ordering": ["condition_type", "threshold", "name"],
            },
        ),
    ]
