"use client";

import { useEffect, useRef, useState } from "react";
import TodoList from "./TodoList";
import { useTodos } from "@/hooks/useTodos";

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 7 2 2 4-4M3 17l2 2 4-4" />
      <path d="M13 6h8M13 12h8M13 18h8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function TodoWidget() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useTodos();
  const todos = data?.results ?? [];
  const total = todos.length;
  const done = todos.filter((t) => t.is_done).length;
  const remaining = total - done;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && remaining === 0;

  // Vòng tiến độ quanh nút (SVG 64×64, tâm 32). r=30 để vòng nằm sát mép nút.
  const R = 30;
  const CIRC = 2 * Math.PI * R;

  // Đóng khi click ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* Popover */}
      <div
        id="todo-popover"
        aria-hidden={!open}
        className={`mb-3 w-80 max-w-[calc(100vw-3rem)] origin-bottom-right transition duration-150 ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-95 opacity-0"
        }`}
      >
        <TodoList scrollList className="shadow-2xl" />
      </div>

      {/* Nút nổi */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="todo-popover"
        aria-label={
          open
            ? "Đóng danh sách công việc"
            : total > 0
              ? `Mở danh sách công việc - ${done}/${total} việc xong (${percent}%)`
              : "Mở danh sách công việc"
        }
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[#7a9e7e] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#6b8d6f] focus:outline-none focus:ring-4 focus:ring-[#7a9e7e]/25"
      >
        {/* Vòng tiến độ quanh nút (ẩn khi popover mở) */}
        {!open && total > 0 && (
          <svg
            className="pointer-events-none absolute -inset-1 -rotate-90"
            viewBox="0 0 64 64"
            aria-hidden
          >
            <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={3} />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - percent / 100)}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
        )}

        {open ? <CloseIcon /> : <ListIcon />}

        {/* Badge: số việc còn lại, hoặc dấu tick khi đã xong hết */}
        {!open && remaining > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#b5764a] px-1 text-[11px] font-semibold leading-none text-white">
            {remaining}
          </span>
        )}
        {!open && allDone && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#5f8a64] text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}
