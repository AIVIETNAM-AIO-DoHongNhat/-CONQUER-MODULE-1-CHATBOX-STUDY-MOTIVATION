"use client";

// Trang bảng xếp hạng tuần: bục podium cho top 3 + danh sách phần còn lại, làm
// nổi bật vị trí của chính user. Dữ liệu thật từ /leaderboard/weekly/.

import { useWeeklyLeaderboard } from "@/hooks/useLeaderboard";
import { useProfile } from "@/hooks/useProfile";
import { FlameIcon, MedalIcon } from "@/components/icons";
import Reveal from "@/components/Reveal";
import type { LeaderboardEntry, LeaderboardUser } from "@/lib/api";

// Tên hiển thị: ưu tiên họ tên, rồi username, cuối cùng phần trước @ của email.
function displayName(u: LeaderboardUser): string {
  return u.full_name?.trim() || u.username?.trim() || u.email.split("@")[0];
}

function initialOf(u: LeaderboardUser): string {
  const src = u.full_name?.trim() || u.username?.trim() || u.email.trim();
  return src ? src[0].toUpperCase() : "U";
}

// "90 phút" → "1h30"; dưới 60 phút giữ nguyên "X phút".
function formatMinutes(total: number): string {
  if (total < 60) return `${total} phút`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

// "2026-06-29" → "29/6".
function shortDate(value: string): string {
  const [, m, d] = value.split("-").map(Number);
  return `${d}/${m}`;
}

// Cấu hình màu theo thứ hạng (vàng / bạc / đồng, tông ấm của app).
const RANK = {
  1: {
    ring: "linear-gradient(135deg,#f6dca6 0%,#c4863c 100%)",
    pedestal: "linear-gradient(180deg,#f1d6a4 0%,#cf9a57 100%)",
    badge: "#b5764a",
    height: 96,
    avatar: 80,
  },
  2: {
    ring: "linear-gradient(135deg,#e6e1d8 0%,#a7a097 100%)",
    pedestal: "linear-gradient(180deg,#e8e4dc 0%,#bcb5a9 100%)",
    badge: "#8f8b83",
    height: 70,
    avatar: 62,
  },
  3: {
    ring: "linear-gradient(135deg,#edc8a0 0%,#bf8851 100%)",
    pedestal: "linear-gradient(180deg,#eccaa6 0%,#c89868 100%)",
    badge: "#b07d4e",
    height: 54,
    avatar: 62,
  },
} as const;

function CrownIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M3 7.5l4.2 3.3L12 4l4.8 6.8L21 7.5 19 18H5L3 7.5z" />
      <rect x="5" y="19" width="14" height="2.2" rx="1.1" />
    </svg>
  );
}

// Avatar đồng nhất: luôn dùng chữ cái đầu trên nền phẳng (bỏ qua profile_picture
// để cả bảng nhìn gọn, không màu mè).
function Avatar({ user, size = 40 }: { user: LeaderboardUser; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[#fbeede] font-semibold text-[#b5764a]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initialOf(user)}
    </span>
  );
}

// Một cột trên bục: avatar có viền gradient + huy hiệu thứ hạng, bên dưới là bệ.
function PodiumColumn({ entry, me }: { entry: LeaderboardEntry; me: boolean }) {
  const cfg = RANK[entry.rank as 1 | 2 | 3] ?? RANK[3];
  return (
    <div className="flex min-w-0 flex-col items-center">
      {entry.rank === 1 && (
        <span className="mb-1 text-[#d6a64f]">
          <CrownIcon size={26} />
        </span>
      )}
      <div className="relative">
        <span
          className="block rounded-full p-0.75"
          style={{ backgroundImage: cfg.ring }}
        >
          <span className="block rounded-full bg-white p-0.5">
            <Avatar user={entry.user} size={cfg.avatar} />
          </span>
        </span>
        <span
          className="absolute -bottom-1 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white"
          style={{ backgroundColor: cfg.badge }}
        >
          {entry.rank}
        </span>
      </div>

      <p className="mt-3 line-clamp-1 max-w-full text-center text-sm font-semibold text-[#1b1b19]">
        {displayName(entry.user)}
      </p>
      {me && (
        <span className="mt-0.5 rounded-full bg-[#fbeede] px-2 py-0.5 text-[10px] font-semibold text-[#b5764a]">
          Bạn
        </span>
      )}
      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#6b6b66]">
        <FlameIcon size={12} strokeWidth={2} className="text-[#b5764a]" />
        {formatMinutes(entry.total_minutes)}
      </p>

      <div
        className="mt-3 flex w-full items-start justify-center rounded-t-2xl pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        style={{ height: cfg.height, backgroundImage: cfg.pedestal }}
      >
        <span className="text-2xl font-bold text-white/80">{entry.rank}</span>
      </div>
    </div>
  );
}

// Một dòng trong danh sách (hạng 4+).
function ListRow({ entry, me }: { entry: LeaderboardEntry; me: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
        me ? "bg-[#fbeede] ring-1 ring-[#e7bd8e]" : "hover:bg-[#f7f6f1]"
      }`}
    >
      <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-[#9a978f]">
        {entry.rank}
      </span>
      <Avatar user={entry.user} size={42} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1b1b19]">
          {displayName(entry.user)}
          {me && (
            <span className="ml-1.5 text-xs font-medium text-[#b5764a]">
              (bạn)
            </span>
          )}
        </p>
        <p className="text-xs text-[#9a978f]">Cấp {entry.user.level}</p>
      </div>
      <span className="shrink-0 text-right text-sm font-bold tabular-nums text-[#1b1b19]">
        {formatMinutes(entry.total_minutes)}
      </span>
    </div>
  );
}

export default function LeaderboardPage() {
  const { data, isLoading, isError } = useWeeklyLeaderboard(10);
  const { data: profile } = useProfile();
  const meId = profile?.id;

  const top3 = data?.results.slice(0, 3) ?? [];
  const rest = data?.results.slice(3) ?? [];
  const meInTop = !!data?.current_user &&
    data.results.some((e) => e.user.id === data.current_user!.user.id);

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-10"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* Tiêu đề */}
      <Reveal>
      <div className="flex items-center gap-1.5 text-[#b5764a]">
        <MedalIcon size={16} strokeWidth={1.8} />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Tuần này
        </span>
        {data && (
          <span className="text-xs font-medium text-[#b9b6ad]">
            · {shortDate(data.week.start)}–{shortDate(data.week.end)}
          </span>
        )}
      </div>
      <h1 className="mt-1.5 text-[28px] font-bold tracking-tight text-[#1b1b19]">
        Bảng xếp hạng
      </h1>
      <p className="mt-1 text-sm text-[#6b6b66]">
        Ai tập trung học nhiều nhất tuần này? Thứ hạng tính theo tổng thời gian
        học.
      </p>
      </Reveal>

      <Reveal delay={100} className="mt-7 space-y-5">
        {isLoading && (
          <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 shadow-[0_18px_44px_-28px_rgba(27,27,25,0.25)]">
            <div className="mb-6 h-28 animate-pulse rounded-2xl bg-[#f3f1ea]" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-2xl bg-[#f3f1ea]"
                />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 text-sm text-[#9a978f]">
            Không tải được bảng xếp hạng. Thử lại sau nhé.
          </div>
        )}

        {data && data.results.length === 0 && (
          <div className="rounded-3xl border border-[#e8e6df] bg-white px-6 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fbeede] text-[#b5764a]">
              <FlameIcon size={26} strokeWidth={1.7} />
            </span>
            <p className="mt-4 text-sm font-medium text-[#1b1b19]">
              Tuần này chưa ai hoàn thành phiên học nào
            </p>
            <p className="mt-1 text-sm text-[#9a978f]">
              Bắt đầu một phiên để trở thành người dẫn đầu đầu tiên! 🔥
            </p>
          </div>
        )}

        {data && top3.length > 0 && (
          <>
            {/* Podium top 3 */}
            <div className="overflow-hidden rounded-3xl border border-[#ece4d6] bg-linear-to-b from-[#fdf5e9] to-white p-5 pt-7 shadow-[0_20px_48px_-28px_rgba(181,118,74,0.4)]">
              <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                {/* Thứ tự hiển thị: 2 - 1 - 3 để hạng nhất ở giữa */}
                {[top3[1], top3[0], top3[2]].map((entry, i) =>
                  entry ? (
                    <PodiumColumn
                      key={entry.user.id}
                      entry={entry}
                      me={entry.user.id === meId}
                    />
                  ) : (
                    <div key={`empty-${i}`} aria-hidden />
                  )
                )}
              </div>
            </div>

            {/* Danh sách hạng 4+ */}
            {rest.length > 0 && (
              <div className="rounded-3xl border border-[#e8e6df] bg-white p-2 shadow-[0_18px_44px_-30px_rgba(27,27,25,0.25)] sm:p-3">
                <div className="space-y-0.5">
                  {rest.map((entry) => (
                    <ListRow
                      key={entry.user.id}
                      entry={entry}
                      me={entry.user.id === meId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Thứ hạng bản thân khi nằm ngoài top hiển thị */}
            {data.current_user && !meInTop && (
              <div>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#9a978f]">
                  Vị trí của bạn
                </p>
                <div className="rounded-3xl border border-[#e7bd8e] bg-white p-2 shadow-[0_18px_44px_-30px_rgba(181,118,74,0.35)] sm:p-3">
                  <ListRow entry={data.current_user} me />
                </div>
              </div>
            )}
          </>
        )}
      </Reveal>
    </div>
  );
}
