from datetime import timedelta

from django.db.models import Sum

from gamify.models import Badge, DailyGoal, UserBadge
from session.models import Session


def is_goal_achieved(goal):
    return goal.target_minutes > 0 and goal.achieved_minutes >= goal.target_minutes


def has_study_activity(goal):
    # Một ngày được tính vào streak nếu có học, dù chỉ 1 phút (không cần đạt mục tiêu).
    return goal is not None and goal.achieved_minutes > 0


def recalculate_streak(user, today):
    # Chuỗi = số ngày học liên tiếp (mỗi ngày chỉ cần có học > 0 phút). Hôm nay
    # đang diễn ra: nếu chưa học hôm nay thì vẫn tính chuỗi tính tới hôm qua
    # (today chưa làm đứt chuỗi).
    today_goal = DailyGoal.objects.filter(user=user, date=today).first()
    current_date = today if has_study_activity(today_goal) else today - timedelta(days=1)

    current_streak = 0
    while True:
        goal = DailyGoal.objects.filter(user=user, date=current_date).first()

        if not has_study_activity(goal):
            break

        current_streak += 1
        current_date -= timedelta(days=1)

    user.current_streak = current_streak
    user.longest_streak = max(user.longest_streak, current_streak)
    user.save(update_fields=["current_streak", "longest_streak", "updated_at"])

    return {
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
    }


def get_user_badge_progress(user):
    completed_sessions = Session.objects.filter(
        user=user,
        status=Session.STATUS_COMPLETED,
        focus_minutes__isnull=False,
    )

    total_focus_minutes = completed_sessions.aggregate(
        total=Sum("focus_minutes")
    )["total"] or 0

    total_sessions = completed_sessions.count()

    return {
        Badge.CONDITION_STREAK_DAYS: user.current_streak,
        Badge.CONDITION_TOTAL_FOCUS_MINUTES: total_focus_minutes,
        Badge.CONDITION_TOTAL_SESSIONS: total_sessions,
        Badge.CONDITION_XP: user.xp,
        Badge.CONDITION_LEVEL: user.level,
    }


def unlock_badges_for_user(user):
    progress = get_user_badge_progress(user)

    unlocked_badges = []

    badges = Badge.objects.filter(is_active=True)

    for badge in badges:
        value = progress.get(badge.condition_type, 0)

        if value < badge.threshold:
            continue

        _, created = UserBadge.objects.get_or_create(
            user=user,
            badge=badge,
        )

        if created:
            unlocked_badges.append(badge)

    return unlocked_badges
