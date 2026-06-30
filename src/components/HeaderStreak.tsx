"use client";

// Pill chuỗi học trên header (cạnh HeaderDailyGoal): ngọn lửa + số ngày streak.
// Desktop: hover hiện popover dải 7 ngày gần nhất. Mobile (full): pill + dải
// ngày xếp dọc. Bấm vào dẫn tới /profile (nơi có lịch chuỗi đầy đủ).

import Link from "next/link";
import { useStreakHistory } from "@/hooks/useDailyGoal";
import { FlameIcon } from "@/components/icons";
import { DayCell } from "@/components/StreakCalendar";

export default function HeaderStreak({
  full = false,
  onNavigate,
}: {
  /** true = chiếm hết chiều ngang (dùng trong menu mobile). */
  full?: boolean;
  onNavigate?: () => void;
}) {
  const { data, isLoading } = useStreakHistory(7);

  // Chưa có dữ liệu → không chiếm chỗ (tránh nhảy layout header).
  if (isLoading || !data) return null;

  const streak = data.current_streak;
  const active = streak > 0;
  const week = data.days.slice(-7);

  const pill = (
    <Link
      href="/profile"
      onClick={onNavigate}
      title={`Chuỗi học: ${streak} ngày${
        data.longest_streak ? ` · dài nhất ${data.longest_streak}` : ""
      }`}
      aria-label={`Chuỗi học liên tục ${streak} ngày`}
      className={`flex items-center gap-1.5 rounded-full border border-[#e8e6df] bg-white/70 px-2.5 py-1 transition-colors hover:border-[#b5764a]/50 hover:bg-white ${
        full ? "w-full justify-center" : ""
      }`}
    >
      <FlameIcon
        size={16}
        strokeWidth={1.8}
        className={active ? "text-[#b5764a]" : "text-[#c9c6bd]"}
      />
      <span className="text-sm font-medium tabular-nums text-[#1b1b19]">
        {streak}
      </span>
    </Link>
  );

  // Mobile: pill + dải ngày xếp dọc trong menu.
  if (full) {
    return (
      <div className="w-full">
        {pill}
        <div className="mt-2 flex justify-between gap-1">
          {week.map((day) => (
            <DayCell key={day.date} day={day} />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: pill + popover hiện khi hover.
  return (
    <div className="group relative">
      {pill}
      <div className="invisible absolute right-0 top-full z-50 mt-2 translate-y-1 rounded-2xl border border-[#e8e6df] bg-white p-3 opacity-0 shadow-[0_18px_44px_-20px_rgba(27,27,25,0.3)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <p className="mb-2 whitespace-nowrap px-0.5 text-xs font-medium text-[#8a8a83]">
          7 ngày gần đây
        </p>
        <div className="flex gap-1.5">
          {week.map((day) => (
            <DayCell key={day.date} day={day} />
          ))}
        </div>
      </div>
    </div>
  );
}
