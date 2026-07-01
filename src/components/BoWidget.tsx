"use client";

// Nút nổi Bo — trò chuyện với linh vật từ mọi trang. Theo pattern TodoWidget:
// nút nổi mở/đóng popover, đóng khi click ra ngoài hoặc nhấn Esc. Đặt ở góc
// dưới-TRÁI để không đụng các nút nổi góc phải (TodoWidget, ScrollToTop).
//
// BoChat luôn được mount trong popover (chỉ ẩn/hiện bằng class) nên cuộc trò
// chuyện được giữ nguyên khi đóng/mở lại.

import { useEffect, useRef, useState } from "react";
import BoChat from "./BoChat";
import { BoMascot } from "./BoMascot";

function ChevronDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function BoWidget() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      className="pointer-events-none fixed bottom-6 left-6 z-40 flex flex-col items-start"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* Popover chat */}
      <div
        id="bo-popover"
        aria-hidden={!open}
        className={`mb-3 w-[min(23rem,calc(100vw-3rem))] origin-bottom-left transition duration-150 ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="h-[min(32rem,calc(100dvh-7rem))]">
          <BoChat onClose={() => setOpen(false)} />
        </div>
      </div>

      {/* Nút nổi */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="bo-popover"
        aria-label={open ? "Đóng cửa sổ chat với Bo" : "Trò chuyện với Bo"}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-[#ece4d6] bg-white text-[#6b6b66] shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#7a9e7e]/25"
      >
        {open ? <ChevronDownIcon /> : <BoMascot size={42} />}

        {/* Chấm "đang online" mời gọi khi đang đóng */}
        {!open && (
          <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#5f8a64]" />
        )}
      </button>
    </div>
  );
}
