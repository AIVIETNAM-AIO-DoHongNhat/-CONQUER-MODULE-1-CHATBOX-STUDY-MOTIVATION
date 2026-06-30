"use client";

// Lịch chuỗi học kiểu GitHub contributions: cột = tuần, 7 hàng = thứ (T2→CN),
// mỗi ô tô đậm/nhạt theo mức độ học hôm đó. Dữ liệu thật từ /daily-goals/history.

import { useStreakHistory } from "@/hooks/useDailyGoal";
import { FlameIcon } from "@/components/icons";
import type { DailyGoalHistoryDay } from "@/lib/api";

// Nhãn hàng kiểu GitHub (Mon/Wed/Fri): tuần bắt đầu từ Thứ 2 ở trên. Chỉ ghi
// T2/T4/T6 cho gọn, các hàng khác để trống.
const ROW_LABELS = ["T2", "", "T4", "", "T6", "", ""];

// Thang màu ấm theo số phút học trong ngày (0 = không học → 4 = học nhiều),
// tông lửa của app. Học càng nhiều → màu càng đậm.
const LEVEL_COLORS = ["#efece4", "#f6e2c8", "#e7bd8e", "#cf9259", "#b5764a"];

// Ngưỡng phút cho từng mức (mức 0 = 0 phút). Học là tính, nhiều thì đậm hơn.
function levelOf(day: DailyGoalHistoryDay): number {
  const m = day.achieved_minutes;
  if (m <= 0) return 0;
  if (m < 20) return 1;
  if (m < 45) return 2;
  if (m < 90) return 3;
  return 4;
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Thứ trong tuần kiểu T2=0 ... CN=6 (JS getDay: CN=0).
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function titleOf(day: DailyGoalHistoryDay): string {
  if (day.achieved_minutes <= 0) return `${day.date}: chưa học`;
  const goalNote = day.achieved
    ? " · đã đạt mục tiêu"
    : day.target_minutes > 0
      ? ` / mục tiêu ${day.target_minutes}`
      : "";
  return `${day.date}: ${day.achieved_minutes} phút${goalNote}`;
}

// Lưới co giãn lấp đầy chiều ngang card: mỗi cột dùng flex-1, ô vuông theo
// aspect-square nên bề rộng ô = (rộng card − nhãn) / số tuần. GAP là khoảng cách
// giữa các ô, LABEL_W là bề rộng cột nhãn thứ; CELL chỉ còn dùng cho chú giải.
const CELL = 11; // px — kích thước ô ở chú giải chân
const GAP = 3; // px
const LABEL_W = 26; // px — bề rộng cột nhãn thứ

function Cell({ day }: { day: DailyGoalHistoryDay | null }) {
  if (!day) {
    return <span className="aspect-square w-full" aria-hidden />;
  }
  const date = parseLocalDate(day.date);
  const today = isToday(date);
  return (
    <span
      title={titleOf(day)}
      className="aspect-square w-full rounded-[3px]"
      style={{
        backgroundColor: LEVEL_COLORS[levelOf(day)],
        boxShadow: today ? "0 0 0 1.5px #b5764a" : "inset 0 0 0 1px rgba(27,27,25,0.04)",
      }}
    />
  );
}

export default function StreakGrid({ weeks = 53 }: { weeks?: number }) {
  // Backend giới hạn 365 ngày → cả năm gần nhất (~52–53 tuần như GitHub).
  const { data, isLoading, isError } = useStreakHistory(Math.min(weeks * 7, 365));

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-[#e8e6df] bg-white p-5">
        <div className="h-32 animate-pulse rounded-2xl bg-[#f3f1ea]" />
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

  // Xếp các ngày (cũ → mới) vào lưới: chèn ô trống đầu cho khớp hàng thứ, đệm
  // cuối cho đủ tuần, rồi cắt thành các cột 7 ô.
  const days = data.days;
  const lead = days.length ? mondayIndex(parseLocalDate(days[0].date)) : 0;
  const cells: (DailyGoalHistoryDay | null)[] = [
    ...Array<null>(lead).fill(null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const columns: (DailyGoalHistoryDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));

  // Nhãn tháng: hiện "ThN" tại cột đầu của mỗi tháng. Bỏ qua tuần lẻ đầu tiên và
  // giữ khoảng cách tối thiểu giữa 2 nhãn để chúng không đè lên nhau.
  let prevMonth = -1;
  let lastLabelCol = -10;
  const monthLabels = columns.map((col, ci) => {
    const first = col.find((c) => c !== null);
    if (!first) return "";
    if (ci === 0 && col.some((c) => c === null)) return ""; // tuần lẻ đầu
    const m = parseLocalDate(first.date).getMonth();
    if (m !== prevMonth && ci - lastLabelCol >= 2) {
      prevMonth = m;
      lastLabelCol = ci;
      return `Th${m + 1}`;
    }
    prevMonth = m;
    return "";
  });

  return (
    <div className="rounded-3xl border border-[#e8e6df] bg-white p-5">
      {/* Tiêu đề: ngọn lửa + streak */}
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

      {/* Lưới đóng góp — co giãn lấp đầy chiều ngang card */}
      <div className="mt-5">
        <div className="flex flex-col" style={{ gap: GAP }}>
          {/* Hàng nhãn tháng */}
          <div className="flex" style={{ gap: GAP, paddingLeft: LABEL_W + GAP }}>
            {monthLabels.map((label, i) => (
              <span
                key={i}
                className="min-w-0 flex-1 whitespace-nowrap text-[10px] text-[#9a978f]"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP }}>
            {/* Nhãn thứ trong tuần — flex-1 để căn theo chiều cao các ô */}
            <div
              className="flex flex-col"
              style={{ gap: GAP, width: LABEL_W }}
            >
              {ROW_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="flex flex-1 items-center text-[10px] text-[#9a978f]"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Các cột tuần — mỗi cột chia đều phần rộng còn lại */}
            <div className="flex flex-1" style={{ gap: GAP }}>
              {columns.map((col, ci) => (
                <div
                  key={ci}
                  className="flex min-w-0 flex-1 flex-col"
                  style={{ gap: GAP }}
                >
                  {col.map((cell, ri) => (
                    <Cell key={ri} day={cell} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chân: ghi chú trái · chú giải phải (kiểu GitHub) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9a978f]">
        <span>Mỗi ngày có học được tô màu — học càng nhiều, màu càng đậm.</span>
        <span className="flex items-center gap-1">
          <span>Ít</span>
          {LEVEL_COLORS.map((color) => (
            <span
              key={color}
              className="rounded-[3px]"
              style={{ width: CELL, height: CELL, backgroundColor: color }}
            />
          ))}
          <span>Nhiều</span>
        </span>
      </div>
    </div>
  );
}
