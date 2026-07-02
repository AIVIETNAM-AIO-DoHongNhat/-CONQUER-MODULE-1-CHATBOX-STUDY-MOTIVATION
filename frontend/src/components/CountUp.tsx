"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  /** Giá trị đích của con số. */
  value: number;
  /** Số chữ số thập phân khi hiển thị (vd 2.4 → decimals=1). */
  decimals?: number;
  /** Hậu tố dán liền sau số (vd "K+", "%"). */
  suffix?: string;
  /** Thời gian chạy (ms). */
  duration?: number;
};

/**
 * Con số đếm dần từ 0 lên giá trị đích khi cuộn tới (IntersectionObserver),
 * ease-out để về đích mượt. Tôn trọng prefers-reduced-motion: hiện thẳng số cuối.
 */
export default function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1400,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(value * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
