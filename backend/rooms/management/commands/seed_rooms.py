from django.core.management.base import BaseCommand

from rooms.models import Room


DEFAULT_ROOMS = [
    {
        "name": "Toán",
        "category": "Môn học",
        "description": "Phòng học Toán cho luyện bài tập và ôn thi.",
        "max_users": 20,
        "is_active": True,
    },
    {
        "name": "Ngoại ngữ",
        "category": "Ngôn ngữ",
        "description": "Phòng học Ngoại ngữ cho từ vựng, đọc hiểu và giao tiếp.",
        "max_users": 20,
        "is_active": True,
    },
    {
        "name": "Tự do",
        "category": "Mở",
        "description": "Phòng học tự do cho mọi chủ đề.",
        "max_users": 30,
        "is_active": True,
    },
]

LEGACY_ROOM_NAMES = [
    "Research",
    "Product",
    "Freedom",
    "Toan",
    "Ngoai ngu",
    "Tu do",
    "Math Lab",
    "Language Corner",
    "Phong Toan nang cao",
    "Goc ngon ngu",
    "Phòng Toán nâng cao",
    "Góc ngôn ngữ",
]


def safe_console_text(value):
    return value.encode("ascii", errors="backslashreplace").decode("ascii")


class Command(BaseCommand):
    help = "Seed 3 default Vietnamese rooms: Toán, Ngoại ngữ, and Tự do."

    def handle(self, *args, **options):
        self.stdout.write("Seeding default rooms...")
        Room.objects.filter(name__in=LEGACY_ROOM_NAMES).delete()

        for room_data in DEFAULT_ROOMS:
            room, created = Room.objects.update_or_create(
                name=room_data["name"],
                defaults=room_data,
            )
            action = "created" if created else "updated"
            self.stdout.write(
                self.style.SUCCESS(f"Room '{safe_console_text(room.name)}' {action}.")
            )

        self.stdout.write(self.style.SUCCESS("Rooms seeding finished."))
