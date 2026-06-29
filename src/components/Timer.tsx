"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";

export interface TimerResult {
  completedFocus: number;
  focusSeconds: number;
  breakSeconds: number;
}

interface TimerProps {
  focusSeconds?: number;
  breakSeconds?: number;
  cycles?: number | undefined;
  autoStart?: boolean;
  onSessionEnd?: (result: TimerResult) => void;
}

export default function Timer({
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
  const [finished, setFinished] = useState(false);
  const tickRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const toast = useToast();

  const handlePhaseEnd = useCallback(() => {
    if (mode === "focus") {
      const nextCompleted = completedFocus + 1;
      setCompletedFocus(nextCompleted);

      if (cycles !== undefined && nextCompleted >= cycles) {
        setRunning(false);
        setFinished(true);
        toast.success("Phiên hoàn tất", `Hoàn thành ${nextCompleted} chu kỳ.`);
        onSessionEnd?.({ completedFocus: nextCompleted, focusSeconds, breakSeconds });
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
  }, [mode, completedFocus, cycles, focusSeconds, breakSeconds, onSessionEnd, toast]);

  useEffect(() => {
    if (running) {
      tickRef.current = window.setInterval(
        () => setSeconds((current) => {
          if (current > 1) return current - 1;
          if (!transitioningRef.current) {
            transitioningRef.current = true;
            window.setTimeout(() => {
              handlePhaseEnd();
              transitioningRef.current = false;
            }, 0);
          }
          return 0;
        }),
        1000,
      );
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [running, handlePhaseEnd]);

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
            onClick={() => {
              if (!finished) setRunning(true);
            }}
            disabled={finished}
            className="rounded-md bg-[#eef4ef] px-2 py-1 text-sm"
          >
            {finished ? "Đã hoàn tất" : "Bắt đầu"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setMode("focus");
            setSeconds(focusSeconds);
            setRunning(false);
            setCompletedFocus(0);
            setFinished(false);
          }}
          className="rounded-md bg-[#f8ece6] px-2 py-1 text-sm"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
}




