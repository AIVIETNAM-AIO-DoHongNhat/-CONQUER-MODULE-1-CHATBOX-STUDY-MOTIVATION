"use client";

// Bo — linh vật "giữ lửa" của AIOtivation: thân tròn gradient sage→terracotta
// (đồng bộ với LogoMark), ngọn lửa nhỏ trên đầu là motif thương hiệu. `thinking`
// đổi biểu cảm sang đang suy nghĩ (mắt nhìn lên) khi Bo đang soạn câu trả lời.

import { useId } from "react";

type BoMascotProps = {
  size?: number;
  thinking?: boolean;
  className?: string;
};

export function BoMascot({ size = 40, thinking = false, className }: BoMascotProps) {
  // id gradient riêng cho mỗi lần render để nhiều Bo trên cùng trang không đụng nhau.
  const gradId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="8" y1="10" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7a9e7e" />
          <stop offset="1" stopColor="#b5764a" />
        </linearGradient>
      </defs>

      {/* Thân tròn */}
      <circle cx="24" cy="27" r="16" fill={`url(#${gradId})`} />

      {/* Ngọn lửa trên đầu — motif "giữ lửa" */}
      <path
        d="M24 3.5c1.8 2.6 3.4 3.8 3.4 6.3a3.4 3.4 0 0 1-6.8 0c0-1.1.5-2 1.2-2.8C23 10.4 23.6 8.2 24 3.5Z"
        fill="#f6c89a"
      />

      {/* Má ửng nhẹ */}
      <circle cx="15" cy="30.5" r="2.4" fill="#ffffff" opacity="0.16" />
      <circle cx="33" cy="30.5" r="2.4" fill="#ffffff" opacity="0.16" />

      {thinking ? (
        <>
          {/* Mắt nhìn lên (cung cong) + miệng mím nhẹ */}
          <path d="M15.5 26q3-3 6 0M26.5 26q3-3 6 0" stroke="#fdf6ec" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 32.5q2 1.4 4 0" stroke="#fdf6ec" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Mắt tròn + con ngươi + miệng cười */}
          <circle cx="18.5" cy="26" r="3" fill="#fdf6ec" />
          <circle cx="29.5" cy="26" r="3" fill="#fdf6ec" />
          <circle cx="19.3" cy="26.6" r="1.5" fill="#3a322c" />
          <circle cx="30.3" cy="26.6" r="1.5" fill="#3a322c" />
          <path d="M20 32q4 3 8 0" stroke="#fdf6ec" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
