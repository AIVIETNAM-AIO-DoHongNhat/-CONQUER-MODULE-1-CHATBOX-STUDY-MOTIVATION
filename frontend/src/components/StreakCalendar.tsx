"use client";

// Widget chuỗi học kiểu Duolingo: ngọn lửa + số streak hiện tại, kèm dải 7 ngày
// gần nhất. Ngày đã đạt mục tiêu → lửa sáng; có đặt mục tiêu nhưng chưa đạt →
// vòng mờ; không học → ô trống. Dữ liệu thật từ /daily-goals/history.

import { useStreakHistory } from "@/hooks/useDailyGoal";
import { FlameIcon } from "@/components/icons";
import type { DailyGoalHistoryDay } from "@/lib/api";

const WEEKDAY_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Parse "YYYY-MM-DD" theo local time (tránh lệch múi giờ của new Date(str)).
function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isToday(value: string): boolean {
  const d = parseLocalDate(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function DayCell({ day }: { day: DailyGoalHistoryDay }) {
  const date = parseLocalDate(day.date);
  const today = isToday(day.date);
  const studied = day.achieved_minutes > 0;
  const hasTarget = day.target_minutes > 0;

  // Có học (>0 phút) → sáng lửa (ngày này tính vào streak); đặt mục tiêu mà chưa
  // học → vòng đứt nét; còn lại → trống.
  const cellClass = studied
    ? "bg-[#fbeede] text-[#b5764a]"
    : hasTarget
      ? "border border-dashed border-[#e0c9a8] text-[#cdb196]"
      : "border border-[#ece9e1] text-[#d6d3ca]";

  const title = studied
    ? `${day.date}: ${day.achieved_minutes} phút${
        day.achieved ? " · đã đạt mục tiêu" : ""
      }`
    : hasTarget
      ? `${day.date}: chưa học (mục tiêu ${day.target_minutes} phút)`
      : `${day.date}: chưa học`;

  return (
    <div className="flex flex-col items-center gap-1.5" title={title}>
      <span className="text-[11px] font-medium text-[#9a978f]">
        {WEEKDAY_VI[date.getDay()]}
      </span>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${cellClass} ${
          today ? "ring-2 ring-[#b5764a] ring-offset-1 ring-offset-white" : ""
        }`}
      >
        {studied ? (
          <FlameIcon size={18} strokeWidth={1.8} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>
    </div>
  );
}

export default function StreakCalendar({ days = 7 }: { days?: number }) {
  // Lấy dư vài ngày để chắc chắn đủ dải tuần, rồi cắt lấy `days` ngày cuối.
  const { data, isLoading, isError } = useStreakHistory(Math.max(days, 7));

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-[#e8e6df] bg-white p-5">
        <div className="h-24 animate-pulse rounded-2xl bg-[#f3f1ea]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 text-sm text-[#9a978f]">
        Không tải được chuỗi học.
      </div>
    );
  }

  const week = data.days.slice(-days);

  return (
    <div className="rounded-3xl border border-[#e8e6df] bg-white p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fbeede] text-[#b5764a]">
          <FlameIcon size={28} strokeWidth={1.7} />
        </span>
        <div>
          <div className="text-[32px] font-light leading-none text-[#1b1b19]">
            {data.current_streak}{" "}
            <span className="text-base font-normal text-[#6b6b66]">ngày</span>
          </div>
          <div className="mt-1 text-sm text-[#8a8a83]">
            chuỗi học liên tục · dài nhất {data.longest_streak} ngày
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-between gap-1">
        {week.map((day) => (
          <DayCell key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}
