"use client";

import { useEffect, useRef, useState } from "react";

export interface TimerProgress {
  // Số phút tập trung đã trôi (giới hạn ở thời lượng dự kiến).
  focusMinutes: number;
}

interface TimerProps {
  // Mốc thời gian thực (ms) khi phiên bắt đầu — thường là
  // Date.parse(session.started_at) từ backend. Timer suy ra thời gian còn lại
  // từ mốc này nên sống sót qua chuyển trang/refresh và vẫn tính đúng.
  epochMs: number;
  // Thời lượng học dự kiến (giây) do người dùng chọn — đếm ngược đơn.
  targetSeconds: number;
  // Bắn khi số phút focus đã trôi thay đổi (kể cả lần khôi phục đầu tiên).
  onProgress?: (info: TimerProgress) => void;
  // Bắn đúng một lần khi hết giờ đếm ngược → RoomShell hỏi "Học tiếp?".
  onFinished?: () => void;
}

function format(s: number) {
  const mm = Math.floor(Math.max(0, s) / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(Math.max(0, s) % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function Timer({ epochMs, targetSeconds, onProgress, onFinished }: TimerProps) {
  // Tạm dừng CỤC BỘ (chỉ trong lần xem này; không ảnh hưởng mốc backend, nên
  // khi chuyển trang rồi quay lại, thời gian vẫn tính theo thời gian thực).
  const [pausedAtElapsed, setPausedAtElapsed] = useState<number | null>(null);
  // Tổng số giây đã tạm dừng, trừ khỏi thời gian thực để elapsed nối tiếp đúng
  // chỗ sau mỗi lần Tiếp tục.
  const [pauseOffsetSec, setPauseOffsetSec] = useState(0);

  // "now" giữ trong state, chỉ cập nhật qua interval → render thuần, không gọi
  // Date.now() trong thân render. Timer là client-only (chỉ mount sau khi phiên
  // được giải quyết) nên lazy-init bằng Date.now() không gây lệch hydrate.
  const [now, setNow] = useState(() => Date.now());

  const elapsed =
    pausedAtElapsed !== null
      ? pausedAtElapsed
      : Math.max(0, (now - epochMs) / 1000 - pauseOffsetSec);
  const finished = elapsed >= targetSeconds;
  const secondsLeft = Math.max(0, Math.ceil(targetSeconds - elapsed));
  // Số phút focus, chặn trần ở thời lượng dự kiến (không vượt quá khi hết giờ).
  const focusMinutes = Math.floor(Math.min(elapsed, targetSeconds) / 60);

  useEffect(() => {
    if (pausedAtElapsed !== null || finished) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pausedAtElapsed, finished]);

  // Báo tiến độ số phút focus mỗi khi giá trị đổi (dùng cho hiển thị + số phút
  // gửi khi rời phòng).
  useEffect(() => {
    onProgress?.({ focusMinutes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMinutes]);

  // Bắn onFinished đúng một lần khi hết giờ. Dùng ref để không bắn lại mỗi tick,
  // và vẫn bắn được ngay cả khi khôi phục một phiên đã quá giờ dự kiến.
  const firedFinish = useRef(false);
  useEffect(() => {
    if (finished && !firedFinish.current) {
      firedFinish.current = true;
      onFinished?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const palette = finished
    ? { border: "#ecdfb8", bg: "#f7f1e0", text: "#8a6d2f", dot: "#c9a24a" }
    : { border: "#cfe0d2", bg: "#eef4ef", text: "#4f6b53", dot: "#5f8a64" };

  const paused = pausedAtElapsed !== null;

  function togglePause() {
    if (pausedAtElapsed !== null) {
      // Tiếp tục: tăng offset đúng bằng khoảng vừa tạm dừng để elapsed nối tiếp.
      setPauseOffsetSec((Date.now() - epochMs) / 1000 - pausedAtElapsed);
      setPausedAtElapsed(null);
    } else {
      setPausedAtElapsed(elapsed);
    }
  }

  return (
    <div className="inline-flex items-center gap-2 font-sans">
      <div
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
        style={{ borderColor: palette.border, backgroundColor: palette.bg, color: palette.text }}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${!paused && !finished ? "animate-pulse" : ""}`}
          style={{ backgroundColor: palette.dot }}
        />
        <span className="text-xs font-medium">{finished ? "Hết giờ" : "Tập trung"}</span>
        <span className="font-mono text-sm font-semibold tabular-nums tracking-tight">
          {format(secondsLeft)}
        </span>
      </div>

      {!finished && (
        <button
          type="button"
          onClick={togglePause}
          className="rounded-full border border-[#e8e6df] bg-white px-3 py-1.5 text-xs font-medium text-[#6b6b66] transition-colors hover:bg-[#f1f0ea]"
        >
          {paused ? "Tiếp tục" : "Tạm dừng"}
        </button>
      )}
    </div>
  );
}
