"use client";

// Tiến độ Daily Goal hiển thị trên header. Chưa đặt mục tiêu → nút "Đặt mục
// tiêu" dẫn tới /todos (nơi có form DailyGoal). Đã đặt → vòng tiến độ nhỏ +
// số phút đã học / mục tiêu. Bấm vào đều mở /todos.

import Link from "next/link";
import { useDailyGoal } from "@/hooks/useDailyGoal";

function TargetIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function MiniRing({ percent, reached }: { percent: number; reached: boolean }) {
  const R = 9;
  const CIRC = 2 * Math.PI * R;
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" className="-rotate-90 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r={R} fill="none" stroke="#e3e0d7" strokeWidth={2.6} />
      <circle
        cx="12"
        cy="12"
        r={R}
        fill="none"
        stroke={reached ? "#5f8a64" : "#7a9e7e"}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC * (1 - percent / 100)}
        className="transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}

export default function HeaderDailyGoal({
  full = false,
  onNavigate,
}: {
  /** true = chiếm hết chiều ngang (dùng trong menu mobile). */
  full?: boolean;
  onNavigate?: () => void;
}) {
  const { data, isLoading } = useDailyGoal();

  // Chưa có dữ liệu → không chiếm chỗ (tránh nhảy layout header).
  if (isLoading || !data) return null;

  const target = data.target_minutes ?? 0;
  const achieved = data.achieved_minutes ?? 0;

  // Chưa đặt mục tiêu → nút setup.
  if (target === 0) {
    return (
      <Link
        href="/todos"
        onClick={onNavigate}
        className={`flex items-center gap-1.5 rounded-full border border-dashed border-[#cdcabf] px-3 py-1.5 text-sm font-medium text-[#6b6b66] transition-colors hover:border-[#7a9e7e] hover:text-[#4f6b53] ${
          full ? "w-full justify-center" : ""
        }`}
      >
        <TargetIcon />
        Đặt mục tiêu
      </Link>
    );
  }

  const percent = Math.min(100, Math.round((achieved / target) * 100));
  const reached = achieved >= target;

  return (
    <Link
      href="/todos"
      onClick={onNavigate}
      title={`Mục tiêu hôm nay: ${achieved}/${target} phút (${percent}%)`}
      aria-label={`Mục tiêu hôm nay: đã học ${achieved} trên ${target} phút, ${percent}%`}
      className={`flex items-center gap-2 rounded-full border border-[#e8e6df] bg-white/70 px-2.5 py-1 transition-colors hover:border-[#7a9e7e]/50 hover:bg-white ${
        full ? "w-full justify-between" : ""
      }`}
    >
      <span className="flex items-center gap-2">
        <MiniRing percent={percent} reached={reached} />
        <span className="text-sm font-medium tabular-nums text-[#1b1b19]">
          {achieved}
          <span className="text-[#9a988f]">/{target}′</span>
        </span>
      </span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
          reached ? "bg-[#e3f0e4] text-[#3d7a44]" : "bg-[#eef4ef] text-[#4f6b53]"
        }`}
      >
        {reached ? "✓" : `${percent}%`}
      </span>
    </Link>
  );
}
