"use client";

import { useState } from "react";
import { readApiError } from "@/lib/api";
import { useDailyGoal, useSetDailyGoal } from "@/hooks/useDailyGoal";
import { useToast } from "./Toast";

const PRESETS = [30, 60, 90, 120];

function TargetIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h${rest.toString().padStart(2, "0")}` : `${h} giờ`;
}

export default function DailyGoal({ className = "" }: { className?: string }) {
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useDailyGoal();
  const setGoal = useSetDailyGoal();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const target = data?.target_minutes ?? 0;
  const achieved = data?.achieved_minutes ?? 0;
  const percent = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const reached = target > 0 && achieved >= target;

  function startEdit() {
    setDraft(target > 0 ? String(target) : "");
    setEditing(true);
  }

  function save(minutes: number) {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Mục tiêu chưa hợp lệ", "Nhập số phút lớn hơn 0.");
      return;
    }
    setEditing(false);
    setGoal.mutate(Math.round(minutes), {
      onError: (err) => toast.error("Không lưu được mục tiêu", readApiError(err)),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(parseInt(draft, 10));
  }

  return (
    <div className={`rounded-3xl border border-[#e8e6df] bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b19]">
          <TargetIcon className="text-[#5f8a64]" />
          Mục tiêu hôm nay
        </h2>
        {!isLoading && !isError && target > 0 && !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded-lg px-2 py-1 text-xs font-medium text-[#4f6b53] transition hover:bg-[#eef4ef]"
          >
            Đổi
          </button>
        )}
      </div>

      {/* Trạng thái tải / lỗi */}
      {isLoading && (
        <div className="mt-4 space-y-3" aria-hidden>
          <div className="h-5 w-32 animate-pulse rounded bg-[#f1f0ea]" />
          <div className="h-2.5 animate-pulse rounded-full bg-[#f1f0ea]" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          <p>{readApiError(error, "Không tải được mục tiêu hôm nay.")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Form đặt/đổi mục tiêu */}
          {(editing || target === 0) && (
            <form onSubmit={handleSubmit} className="mt-4">
              <label htmlFor="goal-input" className="text-sm text-[#6b6b66]">
                Bạn muốn học bao nhiêu phút hôm nay?
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="goal-input"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="vd: 90"
                  className="min-w-0 flex-1 rounded-xl border border-[#e0ddd3] bg-[#fbfaf6] px-3 py-2 text-sm text-[#1b1b19] outline-none transition-colors placeholder:text-[#b0aea6] focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/15"
                />
                <button
                  type="submit"
                  disabled={setGoal.isPending}
                  className="shrink-0 rounded-xl bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lưu
                </button>
                {editing && target > 0 && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-[#6b6b66] transition hover:bg-[#f1f0ea]"
                  >
                    Hủy
                  </button>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => save(m)}
                    className="rounded-full border border-[#e0ddd3] bg-[#fbfaf6] px-3 py-1 text-xs font-medium text-[#4f6b53] transition hover:border-[#7a9e7e] hover:bg-[#eef4ef]"
                  >
                    {formatMinutes(m)}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* Tiến độ đạt được */}
          {target > 0 && !editing && (
            <div className="mt-4">
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tabular-nums text-[#1b1b19]">
                    {achieved}
                  </span>
                  <span className="text-sm text-[#6b6b66]">/ {formatMinutes(target)}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    reached ? "bg-[#e3f0e4] text-[#3d7a44]" : "bg-[#eef4ef] text-[#4f6b53]"
                  }`}
                >
                  {reached ? "Đã đạt 🎉" : `${percent}%`}
                </span>
              </div>
              <div
                className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-[#eef0ea]"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Tiến độ mục tiêu ${percent}%`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                    reached ? "bg-[#5f8a64]" : "bg-[#7a9e7e]"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#8a8a84]">
                {reached
                  ? "Tuyệt vời! Bạn đã hoàn thành mục tiêu hôm nay."
                  : `Còn ${formatMinutes(Math.max(0, target - achieved))} nữa là đạt mục tiêu.`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
