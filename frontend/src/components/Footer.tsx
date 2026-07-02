import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Phòng học", href: "/rooms" },
      { label: "AI đồng hành", href: "/#ai" },
      { label: "Công việc", href: "/todos" },
    ],
  },
  {
    title: "Cộng đồng",
    links: [
      { label: "Bảng xếp hạng", href: "/#cong-dong" },
      { label: "Về chúng tôi", href: "/about" },
      { label: "Liên hệ", href: "/about" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Đăng nhập", href: "/login" },
      { label: "Đăng ký", href: "/register" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-[#e3e1da] bg-[#f7f6f1] text-[#1b1b19]"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-xs">
            <Logo size={32} />
            <p className="mt-4 text-sm font-light leading-relaxed text-[#6b6b66]">
              Phòng học ảo trong AIO. Vào phòng, bật camera, và để AI lặng lẽ
              giữ nhịp tập trung cho bạn.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a8a83]">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#6b6b66] transition-colors hover:text-[#1b1b19]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#e3e1da] pt-6 sm:flex-row">
          <p className="text-sm text-[#8a8a83]">
            © {year} AIOtivation · Study Motivation
          </p>
          <div className="flex items-center gap-6 text-sm text-[#8a8a83]">
            <a href="#" className="transition-colors hover:text-[#1b1b19]">
              Điều khoản
            </a>
            <a href="#" className="transition-colors hover:text-[#1b1b19]">
              Bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
