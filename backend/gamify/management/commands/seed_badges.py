from django.core.management.base import BaseCommand

from gamify.models import Badge


DEFAULT_BADGES = [
    {
        "code": "streak_3",
        "name": "3-Day Streak",
        "description": "Reach your daily goal for 3 days in a row.",
        "condition_type": Badge.CONDITION_STREAK_DAYS,
        "threshold": 3,
        "icon": "flame",
    },
    {
        "code": "streak_7",
        "name": "7-Day Streak",
        "description": "Reach your daily goal for 7 days in a row.",
        "condition_type": Badge.CONDITION_STREAK_DAYS,
        "threshold": 7,
        "icon": "flame",
    },
    {
        "code": "focus_100",
        "name": "100 Focus Minutes",
        "description": "Complete 100 total focus minutes.",
        "condition_type": Badge.CONDITION_TOTAL_FOCUS_MINUTES,
        "threshold": 100,
        "icon": "clock",
    },
    {
        "code": "focus_1000",
        "name": "1000 Focus Minutes",
        "description": "Complete 1000 total focus minutes.",
        "condition_type": Badge.CONDITION_TOTAL_FOCUS_MINUTES,
        "threshold": 1000,
        "icon": "clock",
    },
    {
        "code": "sessions_10",
        "name": "10 Study Sessions",
        "description": "Complete 10 study sessions.",
        "condition_type": Badge.CONDITION_TOTAL_SESSIONS,
        "threshold": 10,
        "icon": "check-circle",
    },
    {
        "code": "level_5",
        "name": "Level 5",
        "description": "Reach level 5.",
        "condition_type": Badge.CONDITION_LEVEL,
        "threshold": 5,
        "icon": "star",
    },
]


class Command(BaseCommand):
    help = "Seed default badge milestones."

    def handle(self, *args, **options):
        self.stdout.write("Seeding default badges...")

        for badge_data in DEFAULT_BADGES:
            badge, created = Badge.objects.update_or_create(
                code=badge_data["code"],
                defaults=badge_data,
            )
            action = "created" if created else "updated"
            self.stdout.write(self.style.SUCCESS(f"Badge '{badge.code}' {action}."))

        self.stdout.write(self.style.SUCCESS("Badges seeding finished."))
