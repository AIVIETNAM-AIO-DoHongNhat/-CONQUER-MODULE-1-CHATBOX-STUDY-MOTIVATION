"use client";

// Bộ sưu tập huy hiệu: lưới các badge - đã mở thì sáng (tông lửa của app), chưa
// mở thì mờ + ổ khóa nhỏ, di chuột vào xem điều kiện cần đạt. Dữ liệu thật từ
// /badges/ (mỗi badge kèm cờ is_unlocked / unlocked_at theo user hiện tại).

import { useBadges } from "@/hooks/useBadges";
import {
  CheckCircleIcon,
  ClockIcon,
  FlameIcon,
  LockIcon,
  StarIcon,
  TrophyIcon,
} from "@/components/icons";
import type { UserBadge } from "@/lib/api";

// Tên icon do backend lưu (seed_badges) → icon line tương ứng, mặc định là cúp.
function renderIcon(name: string | null | undefined) {
  switch (name) {
    case "flame":
      return <FlameIcon size={26} strokeWidth={1.7} />;
    case "clock":
      return <ClockIcon size={26} strokeWidth={1.7} />;
    case "check-circle":
      return <CheckCircleIcon size={26} strokeWidth={1.7} />;
    case "star":
      return <StarIcon size={26} strokeWidth={1.7} />;
    default:
      return <TrophyIcon size={26} strokeWidth={1.7} />;
  }
}

// Câu mô tả điều kiện mở khóa, suy ra từ condition_type + threshold để hiển thị
// trong tooltip của huy hiệu chưa mở.
function conditionText(badge: UserBadge): string {
  const n = badge.threshold;
  switch (badge.condition_type) {
    case "streak_days":
      return `Giữ chuỗi học ${n} ngày liên tiếp`;
    case "total_focus_minutes":
      return `Tích lũy ${n} phút tập trung`;
    case "total_sessions":
      return `Hoàn thành ${n} phiên học`;
    case "xp":
      return `Đạt ${n} điểm kinh nghiệm`;
    case "level":
      return `Đạt cấp độ ${n}`;
    default:
      return badge.description || "Hoàn thành điều kiện để mở khóa";
  }
}

// "2026-06-30T..." → "30/6/2026".
function formatUnlocked(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(d);
}

function BadgeCell({ badge }: { badge: UserBadge }) {
  const unlocked = badge.is_unlocked;
  const date = formatUnlocked(badge.unlocked_at);

  // Tooltip: đã mở → mô tả + ngày mở; chưa mở → điều kiện cần đạt.
  const tip = unlocked
    ? `${badge.description || badge.name}${date ? ` · Mở khóa ${date}` : ""}`
    : `Chưa mở · ${conditionText(badge)}`;

  return (
    <div
      title={tip}
      className={`flex flex-col items-center rounded-2xl border px-2 py-4 text-center transition-colors ${
        unlocked
          ? "border-[#ece4d6] bg-[#fdf7ee]"
          : "border-[#ebe9e2] bg-[#faf9f5]"
      }`}
    >
      <span className="relative">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            unlocked ? "bg-[#fbeede] text-[#b5764a]" : "bg-[#eceae3] text-[#b7b4ab]"
          }`}
        >
          {renderIcon(badge.icon)}
        </span>
        {!unlocked && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#9a978f] shadow-[0_2px_6px_-2px_rgba(27,27,25,0.3)] ring-1 ring-[#ebe9e2]">
            <LockIcon size={13} strokeWidth={2} />
          </span>
        )}
      </span>

      <p
        className={`mt-3 line-clamp-2 text-[13px] font-semibold leading-tight ${
          unlocked ? "text-[#1b1b19]" : "text-[#a8a59d]"
        }`}
      >
        {badge.name}
      </p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#a8a59d]">
        {unlocked ? (date ? `Mở khóa ${date}` : "Đã mở khóa") : conditionText(badge)}
      </p>
    </div>
  );
}

export default function BadgeGrid() {
  const { data, isLoading, isError } = useBadges();

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-[#e8e6df] bg-white p-5">
        <div className="mb-5 h-6 w-40 animate-pulse rounded-lg bg-[#f3f1ea]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-[#f3f1ea]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 text-sm text-[#9a978f]">
        Không tải được huy hiệu. Thử lại sau nhé.
      </div>
    );
  }

  const unlockedCount = data.filter((b) => b.is_unlocked).length;

  return (
    <div className="rounded-3xl border border-[#e8e6df] bg-white p-5">
      {/* Tiêu đề: cúp + tên + tiến độ sưu tập */}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fbeede] text-[#b5764a]">
          <TrophyIcon size={24} strokeWidth={1.7} />
        </span>
        <div>
          <h3 className="text-base font-semibold text-[#1b1b19]">Huy hiệu</h3>
          <p className="text-sm text-[#8a8a83]">
            Đã mở {unlockedCount}/{data.length} huy hiệu
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[#faf9f5] px-4 py-8 text-center text-sm text-[#9a978f]">
          Chưa có huy hiệu nào. Quay lại sau nhé!
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {data.map((badge) => (
            <BadgeCell key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
}
