"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";

export interface TimerResult {
  completedFocus: number;
  focusSeconds: number;
  breakSeconds: number;
}

export interface TimerProgress {
  completedFocus: number;
  focusMinutes: number;
}

type Mode = "focus" | "break";

interface TimerProps {
  // Mốc thời gian thực (ms) khi lịch focus/break bắt đầu — thường là
  // Date.parse(session.started_at) từ backend. Timer suy ra pha hiện tại từ mốc
  // này nên sống sót qua chuyển trang/refresh và vẫn tính đúng thời gian đã trôi.
  epochMs: number;
  focusSeconds?: number;
  breakSeconds?: number;
  cycles?: number | undefined;
  // Bắn khi số chu kỳ focus hoàn tất thay đổi (kể cả lần khôi phục đầu tiên).
  onProgress?: (info: TimerProgress) => void;
  // Bắn khi hoàn tất toàn bộ chu kỳ.
  onSessionEnd?: (result: TimerResult) => void;
}

interface Phase {
  mode: Mode;
  secondsLeft: number;
  completedFocus: number;
  finished: boolean;
}

// Suy ra pha hiện tại thuần từ số giây đã trôi kể từ epoch. Không giữ state nội
// bộ → khôi phục ở bất kỳ thời điểm nào cũng ra cùng kết quả.
function deriveState(
  elapsedSeconds: number,
  config: { focusSeconds: number; breakSeconds: number; cycles: number | undefined }
): Phase {
  let t = Math.max(0, elapsedSeconds);
  let completedFocus = 0;
  for (;;) {
    if (t < config.focusSeconds) {
      return {
        mode: "focus",
        secondsLeft: Math.ceil(config.focusSeconds - t),
        completedFocus,
        finished: false,
      };
    }
    t -= config.focusSeconds;
    completedFocus += 1;
    if (config.cycles !== undefined && completedFocus >= config.cycles) {
      return { mode: "focus", secondsLeft: 0, completedFocus, finished: true };
    }
    if (t < config.breakSeconds) {
      return {
        mode: "break",
        secondsLeft: Math.ceil(config.breakSeconds - t),
        completedFocus,
        finished: false,
      };
    }
    t -= config.breakSeconds;
  }
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

export default function Timer({
  epochMs,
  focusSeconds = 30 * 60,
  breakSeconds = 5 * 60,
  cycles,
  onProgress,
  onSessionEnd,
}: TimerProps) {
  const toast = useToast();

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
  const phase = deriveState(elapsed, { focusSeconds, breakSeconds, cycles });

  useEffect(() => {
    if (pausedAtElapsed !== null || phase.finished) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pausedAtElapsed, phase.finished]);

  const focusMinutesPerCycle = Math.max(1, Math.round(focusSeconds / 60));

  // Phát tín hiệu chuyển pha / tiến độ. Lần chạy đầu chỉ set baseline (báo tiến
  // độ, không toast) để tránh bắn toast/onSessionEnd hồi tố cho thời gian đã
  // trôi khi khôi phục phiên.
  const prev = useRef<Phase | null>(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = phase;

    const focusMinutes = phase.completedFocus * focusMinutesPerCycle;

    if (before === null) {
      onProgress?.({ completedFocus: phase.completedFocus, focusMinutes });
      // Khôi phục đúng lúc phiên đã chạy hết toàn bộ chu kỳ (vd hoàn tất khi user
      // đang ở trang khác) → vẫn phải kết thúc để lưu kết quả, chỉ bỏ qua các
      // toast chuyển pha hồi tố.
      if (phase.finished) {
        onSessionEnd?.({ completedFocus: phase.completedFocus, focusSeconds, breakSeconds });
      }
      return;
    }

    if (
      phase.completedFocus !== before.completedFocus ||
      phase.finished !== before.finished
    ) {
      onProgress?.({ completedFocus: phase.completedFocus, focusMinutes });
    }

    if (phase.finished && !before.finished) {
      toast.success("Phiên hoàn tất", `Hoàn thành ${phase.completedFocus} chu kỳ.`);
      onSessionEnd?.({ completedFocus: phase.completedFocus, focusSeconds, breakSeconds });
    } else if (phase.mode === "break" && before.mode === "focus") {
      toast.info("Chuyển sang giờ nghỉ", "Hãy thư giãn một lát.");
    } else if (phase.mode === "focus" && before.mode === "break") {
      toast.info("Quay lại tập trung", "Bắt đầu chu kỳ tập tiếp theo.");
    }
    // Chỉ phụ thuộc các trường đánh dấu chuyển pha; secondsLeft nhảy mỗi giây
    // không nằm trong deps nên effect không chạy lại mỗi tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.mode, phase.completedFocus, phase.finished]);

  const isFocus = phase.mode === "focus";
  // Cùng bảng màu với badge trạng thái trong RoomShell: xanh cho tập trung,
  // vàng đất cho giờ nghỉ.
  const palette = isFocus
    ? { border: "#cfe0d2", bg: "#eef4ef", text: "#4f6b53", dot: "#5f8a64" }
    : { border: "#ecdfb8", bg: "#f7f1e0", text: "#8a6d2f", dot: "#c9a24a" };

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
          className={`h-1.5 w-1.5 rounded-full ${!paused && !phase.finished ? "animate-pulse" : ""}`}
          style={{ backgroundColor: palette.dot }}
        />
        <span className="text-xs font-medium">
          {phase.finished ? "Hoàn tất" : isFocus ? "Tập trung" : "Giải lao"}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums tracking-tight">
          {format(phase.secondsLeft)}
        </span>
        {cycles !== undefined && (
          <span className="text-[11px] font-medium opacity-70">
            {Math.min(phase.completedFocus + (phase.finished ? 0 : 1), cycles)}/{cycles}
          </span>
        )}
      </div>

      {!phase.finished && (
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
