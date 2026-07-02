import Link from "next/link";
import { Logo } from "@/components/Logo";

// Khung dùng chung cho các trang auth (login / register / forgot-password):
// cột trái thương hiệu (ẩn trên mobile) + cột phải chứa nội dung form.
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen bg-[#f7f6f1] text-[#1b1b19]"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* Cột trái: thương hiệu */}
      <aside className="authPanel relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#1b1b19] p-12 text-[#f7f6f1] lg:flex">
        <div
          aria-hidden
          className="authBlob pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#7a9e7e]/20 blur-3xl"
        />
        <div
          aria-hidden
          className="authBlob pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#b5764a]/20 blur-3xl"
          style={{ animationDelay: "-5s", animationDuration: "13s" }}
        />

        <Link href="/" className="authFadeUp relative" style={{ animationDelay: "0.1s" }}>
          <Logo size={32} tone="light" />
        </Link>

        <div
          className="authFadeUp relative max-w-md"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="text-4xl font-light leading-tight">
            Không gian yên tĩnh để{" "}
            <strong className="font-semibold">học cùng nhau</strong>.
          </h2>
          <p className="mt-5 text-[15px] font-light leading-relaxed text-[#f7f6f1]/70">
            Vào phòng, bật camera, và để AI lặng lẽ giữ nhịp tập trung cho bạn.
            Không ồn ào - chỉ có sự tập trung.
          </p>
        </div>

        <div
          className="authFadeUp relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f7f6f1]/80"
          style={{ animationDelay: "0.35s" }}
        >
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#7a9e7e]" />
          AI · còn 8 phút tới giờ nghỉ. Bạn đang làm tốt.
        </div>
      </aside>

      {/* Cột phải: nội dung */}
      <main className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo cho mobile */}
          <Link
            href="/"
            className="authFadeUp mb-10 inline-block lg:hidden"
            style={{ animationDelay: "0.05s" }}
          >
            <Logo size={32} />
          </Link>

          <h1
            className="authFadeUp text-3xl font-semibold tracking-tight"
            style={{ animationDelay: "0.08s" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="authFadeUp mt-2 text-[15px] text-[#6b6b66]"
              style={{ animationDelay: "0.15s" }}
            >
              {subtitle}
            </p>
          )}

          <div className="authFormWrap">{children}</div>

          {footer && (
            <div
              className="authFadeUp mt-8 text-center text-sm text-[#6b6b66]"
              style={{ animationDelay: "0.62s" }}
            >
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
