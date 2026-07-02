// Bộ icon line (stroke) tối giản, kế thừa màu qua currentColor - hợp tông
// "Tĩnh lặng" của trang chủ, thay cho emoji. Dựa trên hình học của Lucide.

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function base(size: number, strokeWidth: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

// Track: Research - bình thí nghiệm
export function FlaskIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M9 3h6" />
      <path d="M10 3v6.5L4.6 18.1A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.9L14 9.5V3" />
      <path d="M7.7 14h8.6" />
    </svg>
  );
}

// Track: Product - tên lửa
export function RocketIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

// Track: NonTech - bảng màu
export function PaletteIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <circle cx="13.5" cy="6.5" r=".6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r=".6" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r=".6" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r=".6" fill="currentColor" stroke="none" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.43-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.66h2c3.05 0 5.55-2.5 5.55-5.56C22 6.01 17.5 2 12 2Z" />
    </svg>
  );
}

// Lửa - chuỗi học (streak)
export function FlameIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </svg>
  );
}

// Huy chương
export function MedalIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.5 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <path d="M8 7h8" />
      <circle cx="12" cy="17" r="5" />
      <path d="M12 18v-2h-.5" />
    </svg>
  );
}

// Tia chớp - năng lượng
export function ZapIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z" />
    </svg>
  );
}

// Bia ngắm - mục tiêu
export function TargetIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// Ổ khóa - huy hiệu chưa mở
export function LockIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Đồng hồ - tổng phút tập trung
export function ClockIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

// Dấu tích trong vòng tròn - hoàn thành phiên học
export function CheckCircleIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M21.8 10A10 10 0 1 1 17 3.34" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

// Ngôi sao - cấp độ
export function StarIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M11.5 2.6a.5.5 0 0 1 .9 0l2.4 4.9 5.4.8a.5.5 0 0 1 .3.9l-3.9 3.8.9 5.4a.5.5 0 0 1-.7.5L12 17l-4.8 2.5a.5.5 0 0 1-.7-.5l.9-5.4-3.9-3.8a.5.5 0 0 1 .3-.9l5.4-.8z" />
    </svg>
  );
}

// Cúp - huy hiệu mặc định / thành tích
export function TrophyIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className)}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
