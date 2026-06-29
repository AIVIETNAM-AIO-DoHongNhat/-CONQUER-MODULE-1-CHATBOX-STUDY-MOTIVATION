"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Timer, { type TimerResult } from "./Timer";
import { useToast } from "./Toast";
import { endSession, readApiError, startSession } from "@/lib/api";

interface RoomShellProps {
  sessionId?: string | number;
}

export default function RoomShell({ sessionId }: RoomShellProps) {
  const toast = useToast();
  const router = useRouter();
  const [sessionState, setSessionState] = useState<"starting" | "active" | "ending" | "ended" | "error">("starting");
  const startRequested = useRef(false);
  const endRequested = useRef(false);

  useEffect(() => {
    if (startRequested.current) return;
    startRequested.current = true;

    startSession()
      .then(() => {
        setSessionState("active");
        toast.success("Phiên đã bắt đầu", "Timer focus 30 phút đang chạy.");
      })
      .catch((error: unknown) => {
        setSessionState("error");
        toast.error("Không thể bắt đầu phiên", readApiError(error));
      });
  }, [toast]);

  const finishSession = useCallback(
    async (result?: TimerResult) => {
      if (endRequested.current || sessionState !== "active") return;
      endRequested.current = true;
      setSessionState("ending");

      try {
        await endSession();
        toast.success(
          "Đã lưu kết quả phiên",
          result ? `Hoàn thành ${result.completedFocus} chu kỳ focus.` : "Phiên học đã kết thúc.",
        );
        setSessionState("ended");
      } catch (error) {
        endRequested.current = false;
        setSessionState("active");
        toast.error("Không thể kết thúc phiên", readApiError(error));
        throw error;
      }
    },
    [sessionState, toast],
  );

  const handleLeave = useCallback(async () => {
    try {
      await finishSession();
      router.push("/rooms");
    } catch {
      // Giữ user trong phòng để có thể thử kết thúc phiên lại.
    }
  }, [finishSession, router]);

  return (
    <div className="min-h-[70vh] grid grid-cols-3 gap-6 px-4 py-6">
      <main className="col-span-2 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Phòng học #{sessionId} · Phiên trực tiếp</h2>
          <div className="flex items-center gap-3">
            {sessionState === "starting" && <span className="text-sm text-gray-500">Đang bắt đầu phiên...</span>}
            {sessionState === "error" && <span className="text-sm text-red-600">Phiên chưa thể bắt đầu</span>}
            {sessionState === "ended" && <span className="text-sm font-medium text-[#527057]">Phiên đã hoàn tất</span>}
            {(sessionState === "active" || sessionState === "ending") && (
              <Timer
                focusSeconds={30 * 60}
                breakSeconds={5 * 60}
                cycles={4}
                autoStart
                onSessionEnd={(result) => void finishSession(result)}
              />
            )}
            <button
              type="button"
              onClick={() => void handleLeave()}
              disabled={sessionState === "starting" || sessionState === "ending"}
              className="rounded-md bg-[#f1f0ea] px-3 py-1 text-sm"
            >
              {sessionState === "ending" ? "Đang lưu..." : "Rời phòng"}
            </button>
          </div>
        </div>

        <div className="h-[56vh] w-full rounded-md bg-[#f7f6f1] flex items-center justify-center text-gray-500">
          Scene (video / canvas / shared area)
        </div>

        <div className="mt-4 flex gap-3">
          <button className="rounded-md bg-[#eef4ef] px-3 py-1 text-sm">Bật camera</button>
          <button className="rounded-md bg-[#f8ece6] px-3 py-1 text-sm">Tắt mic</button>
          <button className="rounded-md bg-white border px-3 py-1 text-sm">Chia sẻ màn hình</button>
        </div>
      </main>

      <aside className="col-span-1 rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Thành viên</h3>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#7a9e7e] flex items-center justify-center text-white">A</div>
                <div>
                  <div className="text-sm font-medium">Minh An</div>
                  <div className="text-xs text-gray-500">Đang tập trung</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">24:18</div>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#b5764a] flex items-center justify-center text-white">H</div>
                <div>
                  <div className="text-sm font-medium">Thu Hà</div>
                  <div className="text-xs text-gray-500">Đang tập trung</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">41:02</div>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Ghi chú nhanh</h3>
          <textarea className="mt-2 w-full rounded-md border p-2 text-sm" rows={6} placeholder="Ghi chú buổi học..." />
        </div>
      </aside>
    </div>
  );
}
