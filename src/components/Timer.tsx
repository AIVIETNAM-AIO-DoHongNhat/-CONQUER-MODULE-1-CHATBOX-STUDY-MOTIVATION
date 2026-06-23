"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";
import { sendSessionResult } from "@/lib/api";

interface TimerProps {
  sessionId?: string | number;
  focusSeconds?: number;
  breakSeconds?: number;
  cycles?: number | undefined;
  autoStart?: boolean;
  onSessionEnd?: (result: unknown) => void;
}

export default function Timer({
  sessionId,
  focusSeconds = 30 * 60,
  breakSeconds = 5 * 60,
  cycles,
  autoStart = true,
  onSessionEnd,
}: TimerProps) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [seconds, setSeconds] = useState(focusSeconds);
  const [running, setRunning] = useState(autoStart);
  const [completedFocus, setCompletedFocus] = useState(0);
  const tickRef = useRef<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (running) {
      tickRef.current = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [running]);

  useEffect(() => {
    if (seconds > 0) return;
    if (!running) return;

    if (mode === "focus") {
      const nextCompleted = completedFocus + 1;
      setCompletedFocus(nextCompleted);

      if (cycles !== undefined && nextCompleted >= cycles) {
        setRunning(false);
        toast.success("Phiên hoàn tất", `Hoàn thành ${nextCompleted} chu kỳ.`);
        if (sessionId) {
          const payload = {
            duration_seconds: focusSeconds * nextCompleted,
            focus_periods: nextCompleted,
            summary: "Hoàn tất session",
          } as const;
          sendSessionResult(sessionId, payload)
            .then((res) => onSessionEnd?.(res))
            .catch((err) => onSessionEnd?.(err));
        } else {
          onSessionEnd?.({ completedFocus: nextCompleted });
        }
        return;
      }

      setMode("break");
      setSeconds(breakSeconds);
      toast.info("Chuyển sang giờ nghỉ", "Hãy thư giãn một lát.");
      return;
    }

    setMode("focus");
    setSeconds(focusSeconds);
    toast.info("Quay lại tập trung", "Bắt đầu chu kỳ tập tiếp theo.");
  }, [seconds, running, mode, completedFocus, cycles, sessionId, focusSeconds, breakSeconds, onSessionEnd, toast]);

  useEffect(() => {
    if (!running) {
      setSeconds(mode === "focus" ? focusSeconds : breakSeconds);
    }
  }, [focusSeconds, breakSeconds, mode, running]);

  function format(s: number) {
    const mm = Math.floor(Math.max(0, s) / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(Math.max(0, s) % 60)
      .toString()
      .padStart(2, "0");
    return `${mm}:${ss}`;
  }

  return (
    <div className="inline-flex items-center gap-3 font-sans">
      <div className="text-sm font-medium">
        <span className="capitalize">{mode}</span> · {format(seconds)}
      </div>
      <div className="flex gap-2">
        {running ? (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="rounded-md bg-[#f1f0ea] px-2 py-1 text-sm"
          >
            Tạm dừng
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="rounded-md bg-[#eef4ef] px-2 py-1 text-sm"
          >
            Bắt đầu
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setMode("focus");
            setSeconds(focusSeconds);
            setRunning(false);
            setCompletedFocus(0);
          }}
          className="rounded-md bg-[#f8ece6] px-2 py-1 text-sm"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
}




