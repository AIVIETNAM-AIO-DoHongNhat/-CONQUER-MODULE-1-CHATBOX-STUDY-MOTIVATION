from datetime import datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from authentication.models import CustomUser
from gamify.models import Badge, DailyGoal, UserBadge
from gamify.services import recalculate_streak, unlock_badges_for_user
from rooms.models import Room
from session.models import Session


DEMO_PASSWORD = "Password123!"

DEMO_ROOMS = [
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

LEGACY_DEMO_ROOM_NAMES = [
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

DEMO_BADGES = [
    {
        "code": "streak_3",
        "name": "Chuỗi 3 ngày",
        "description": "Đạt mục tiêu học tập trong 3 ngày liên tiếp.",
        "condition_type": Badge.CONDITION_STREAK_DAYS,
        "threshold": 3,
        "icon": "flame",
        "is_active": True,
    },
    {
        "code": "streak_7",
        "name": "Chuỗi 7 ngày",
        "description": "Đạt mục tiêu học tập trong 7 ngày liên tiếp.",
        "condition_type": Badge.CONDITION_STREAK_DAYS,
        "threshold": 7,
        "icon": "flame",
        "is_active": True,
    },
    {
        "code": "focus_100",
        "name": "100 phút tập trung",
        "description": "Hoàn thành tổng cộng 100 phút học tập trung.",
        "condition_type": Badge.CONDITION_TOTAL_FOCUS_MINUTES,
        "threshold": 100,
        "icon": "clock",
        "is_active": True,
    },
    {
        "code": "focus_1000",
        "name": "1000 phút tập trung",
        "description": "Hoàn thành tổng cộng 1000 phút học tập trung.",
        "condition_type": Badge.CONDITION_TOTAL_FOCUS_MINUTES,
        "threshold": 1000,
        "icon": "clock",
        "is_active": True,
    },
    {
        "code": "sessions_10",
        "name": "10 phiên học",
        "description": "Hoàn thành 10 phiên học.",
        "condition_type": Badge.CONDITION_TOTAL_SESSIONS,
        "threshold": 10,
        "icon": "check-circle",
        "is_active": True,
    },
    {
        "code": "level_5",
        "name": "Cấp độ 5",
        "description": "Đạt cấp độ 5.",
        "condition_type": Badge.CONDITION_LEVEL,
        "threshold": 5,
        "icon": "star",
        "is_active": True,
    },
]

DEMO_USERS = [
    {
        "email": "an.demo@example.com",
        "username": "an_demo",
        "full_name": "An Nguyễn",
        "profile_picture": "https://api.dicebear.com/8.x/initials/svg?seed=An",
        "room": "Toán",
        "rooms": ["Toán", "Tự do"],
        "session_minutes": [45, 45, 45, 45, 45, 45, 45, 45, 45, 45],
        "goal_days": 7,
        "goal_target": 60,
        "goal_achieved": 75,
        "longest_streak_floor": 7,
    },
    {
        "email": "binh.demo@example.com",
        "username": "binh_demo",
        "full_name": "Bình Trần",
        "profile_picture": "https://api.dicebear.com/8.x/initials/svg?seed=Binh",
        "room": "Ngoại ngữ",
        "rooms": ["Ngoại ngữ", "Toán"],
        "session_minutes": [40, 40, 40, 40],
        "goal_days": 3,
        "goal_target": 45,
        "goal_achieved": 55,
        "longest_streak_floor": 3,
    },
    {
        "email": "chi.demo@example.com",
        "username": "chi_demo",
        "full_name": "Chi Lê",
        "profile_picture": "https://api.dicebear.com/8.x/initials/svg?seed=Chi",
        "room": "Tự do",
        "rooms": ["Tự do", "Ngoại ngữ"],
        "session_minutes": [45, 30],
        "goal_days": 1,
        "goal_target": 60,
        "goal_achieved": 45,
        "longest_streak_floor": 0,
    },
    {
        "email": "dung.demo@example.com",
        "username": "dung_demo",
        "full_name": "Dung Phạm",
        "profile_picture": "https://api.dicebear.com/8.x/initials/svg?seed=Dung",
        "room": "Toán",
        "rooms": ["Toán", "Tự do"],
        "session_minutes": [50, 50, 50, 35, 35],
        "goal_days": 5,
        "goal_target": 50,
        "goal_achieved": 55,
        "longest_streak_floor": 5,
    },
    {
        "email": "emily.demo@example.com",
        "username": "emily_demo",
        "full_name": "Emily Võ",
        "profile_picture": "https://api.dicebear.com/8.x/initials/svg?seed=Emily",
        "room": "Ngoại ngữ",
        "rooms": ["Ngoại ngữ", "Tự do"],
        "session_minutes": [35, 35, 30],
        "goal_days": 2,
        "goal_target": 30,
        "goal_achieved": 40,
        "longest_streak_floor": 2,
    },
    {
        "email": "khoa.demo@example.com",
        "username": "khoa_demo",
        "full_name": "Khoa Đỗ",
        "profile_picture": "https://api.dicebear.com/8.x/initials/svg?seed=Khoa",
        "room": "Ngoại ngữ",
        "rooms": ["Ngoại ngữ", "Toán", "Tự do"],
        "session_minutes": [60, 55, 50, 45, 45, 40, 40, 35, 35, 30, 30, 25],
        "goal_days": 7,
        "goal_target": 70,
        "goal_achieved": 80,
        "longest_streak_floor": 10,
    },
    {
        "email": "mai.demo@example.com",
        "username": "mai_demo",
        "full_name": "Mai Hoàng",
        "profile_picture": "https://api.dicebear.com/8.x/initials/svg?seed=Mai",
        "room": "Tự do",
        "rooms": ["Tự do", "Ngoại ngữ"],
        "session_minutes": [25],
        "goal_days": 1,
        "goal_target": 45,
        "goal_achieved": 20,
        "longest_streak_floor": 0,
    },
]


def safe_console_text(value):
    return value.encode("ascii", errors="backslashreplace").decode("ascii")


class Command(BaseCommand):
    help = "Seed demo users, sessions, goals, streaks, badges, and leaderboard data."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")
        self._seed_rooms()
        self._seed_badges()

        today = timezone.localdate()
        week_start = today - timedelta(days=today.weekday())

        for user_data in DEMO_USERS:
            user = self._upsert_user(user_data)
            self._reset_demo_user_data(user)
            self._create_sessions(user, user_data, week_start)
            self._create_daily_goals(user, user_data, today)
            self._sync_user_stats(user, user_data)
            unlocked_badges = unlock_badges_for_user(user)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Seeded {user.email}: xp={user.xp}, level={user.level}, "
                    f"streak={user.current_streak}, unlocked={len(unlocked_badges)} new badges."
                )
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeding finished."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Demo users password: {DEMO_PASSWORD}"
            )
        )

    def _seed_rooms(self):
        self.stdout.write("Seeding demo rooms...")
        Room.objects.filter(name__in=LEGACY_DEMO_ROOM_NAMES).delete()

        for room_data in DEMO_ROOMS:
            room, created = Room.objects.update_or_create(
                name=room_data["name"],
                defaults=room_data,
            )
            action = "created" if created else "updated"
            self.stdout.write(
                self.style.SUCCESS(f"Room '{safe_console_text(room.name)}' {action}.")
            )

    def _seed_badges(self):
        self.stdout.write("Seeding demo badges...")
        for badge_data in DEMO_BADGES:
            badge, created = Badge.objects.update_or_create(
                code=badge_data["code"],
                defaults=badge_data,
            )
            action = "created" if created else "updated"
            self.stdout.write(self.style.SUCCESS(f"Badge '{badge.code}' {action}."))

    def _upsert_user(self, user_data):
        user, created = CustomUser.objects.update_or_create(
            email=user_data["email"],
            defaults={
                "username": user_data["username"],
                "full_name": user_data["full_name"],
                "profile_picture": user_data["profile_picture"],
                "is_verified": True,
                "is_active": True,
            },
        )
        user.set_password(DEMO_PASSWORD)
        user.save(update_fields=["password"])
        return user

    def _reset_demo_user_data(self, user):
        Session.objects.filter(user=user).delete()
        DailyGoal.objects.filter(user=user).delete()
        UserBadge.objects.filter(user=user).delete()

        user.xp = 0
        user.level = 1
        user.current_streak = 0
        user.longest_streak = 0
        user.save(update_fields=["xp", "level", "current_streak", "longest_streak", "updated_at"])

    def _create_sessions(self, user, user_data, week_start):
        room_names = user_data.get("rooms", [user_data["room"]])
        rooms = [Room.objects.get(name=room_name) for room_name in room_names]
        for index, minutes in enumerate(user_data["session_minutes"]):
            session_date = week_start + timedelta(days=index % 7)
            started_at = timezone.make_aware(
                datetime.combine(session_date, time(hour=9 + (index % 4), minute=0))
            )
            ended_at = started_at + timedelta(minutes=minutes)
            Session.objects.create(
                user=user,
                room=rooms[index % len(rooms)],
                started_at=started_at,
                ended_at=ended_at,
                focus_minutes=minutes,
                status=Session.STATUS_COMPLETED,
            )

    def _create_daily_goals(self, user, user_data, today):
        for days_ago in range(user_data["goal_days"]):
            DailyGoal.objects.create(
                user=user,
                date=today - timedelta(days=days_ago),
                target_minutes=user_data["goal_target"],
                achieved_minutes=user_data["goal_achieved"],
            )

    def _sync_user_stats(self, user, user_data):
        total_minutes = (
            Session.objects.filter(
                user=user,
                status=Session.STATUS_COMPLETED,
                focus_minutes__isnull=False,
            )
            .values_list("focus_minutes", flat=True)
        )
        user.xp = sum(total_minutes)
        user.level = (user.xp // 100) + 1
        user.longest_streak = max(user.longest_streak, user_data["longest_streak_floor"])
        user.save(update_fields=["xp", "level", "longest_streak", "updated_at"])
        recalculate_streak(user, timezone.localdate())
