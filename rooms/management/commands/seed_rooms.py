from django.core.management.base import BaseCommand
from rooms.models import Room

class Command(BaseCommand):
    help = "Seed 3 default rooms: Research, Product, and Freedom"

    def handle(self, *args, **options):
        room_names = ["Research", "Product", "Freedom"]
        self.stdout.write("Seeding default rooms...")
        for name in room_names:
            room, created = Room.objects.get_or_create(
                name=name,
                defaults={"description": f"This is the {name} study room."}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Room '{name}' created successfully."))
            else:
                self.stdout.write(f"Room '{name}' already exists.")
        self.stdout.write(self.style.SUCCESS("Rooms seeding finished."))
