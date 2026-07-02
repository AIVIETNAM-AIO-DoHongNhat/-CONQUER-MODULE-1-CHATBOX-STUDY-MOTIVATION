import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  TargetIcon,
  FlameIcon,
  ClockIcon,
  LockIcon,
  MedalIcon,
  ZapIcon,
  CheckCircleIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Quy định phòng học · AIOtivation",
  description:
    "Nội quy phòng học tập AIOtivation - giữ không gian yên tĩnh, tôn trọng và tập trung cho tất cả mọi người.",
};

// Sáu điều khoản cốt lõi - trình bày dạng "văn bản nội quy" với số điều lớn.
const RULES = [
  {
    Icon: MedalIcon,
    title: "Tôn trọng mọi người",
    text: "Cư xử lịch sự, không quấy rối hay làm phiền người khác. Mỗi người đến đây đều để học.",
    color: "#5f8a64",
    bg: "rgba(122,158,126,.14)",
  },
  {
    Icon: ZapIcon,
    title: "Giữ yên tĩnh",
    text: "Tắt mic khi không nói, hạn chế tiếng ồn nền để cả phòng cùng giữ được sự tập trung.",
    color: "#a86a3f",
    bg: "rgba(181,118,74,.14)",
  },
  {
    Icon: ClockIcon,
    title: "Đúng giờ, đủ phiên",
    text: "Vào phòng đúng lịch và hoàn thành phiên đã hẹn. Rời giữa chừng làm mất nhịp của bạn và cả nhóm.",
    color: "#6f86a8",
    bg: "rgba(122,140,168,.14)",
  },
  {
    Icon: TargetIcon,
    title: "Tập trung học tập",
    text: "Phòng học chỉ dành cho việc học. Tránh mở nội dung giải trí hay việc riêng gây xao nhãng.",
    color: "#5f8a64",
    bg: "rgba(122,158,126,.14)",
  },
  {
    Icon: LockIcon,
    title: "Bảo mật & riêng tư",
    text: "Không quay chụp, chia sẻ hình ảnh người khác khi chưa được phép. Tôn trọng quyền riêng tư của nhau.",
    color: "#a86a3f",
    bg: "rgba(181,118,74,.14)",
  },
  {
    Icon: FlameIcon,
    title: "Giữ lửa cùng nhau",
    text: "Cổ vũ, động viên bạn học. Một lời khích lệ nhỏ có thể giúp ai đó không bỏ cuộc hôm nay.",
    color: "#b5764a",
    bg: "rgba(181,118,74,.14)",
  },
];

const DO = [
  "Bật camera nếu có thể - hiệu ứng \"học cùng nhau\" giúp bạn tập trung hơn",
  "Đặt mục tiêu rõ ràng cho mỗi phiên trước khi bắt đầu",
  "Nghỉ ngắn đúng lúc để giữ sức bền suốt buổi học",
  "Dùng khung chat và trợ lý Bo để hỏi han, giữ động lực",
  "Nhấn \"Rời phòng\" để kết thúc phiên đúng cách",
];

const DONT = [
  "Nói chuyện lớn tiếng hoặc mở nhạc gây ồn khi chưa tắt mic",
  "Chia sẻ nội dung không phù hợp, quảng cáo hay spam trong chat",
  "Ghi hình, chụp màn hình người khác mà chưa xin phép",
  "Rời phòng đột ngột giữa phiên khiến mất thời gian đã học",
  "Dùng phòng học cho mục đích ngoài việc học tập",
];

const STEPS = [
  {
    num: "1",
    title: "Chọn phòng phù hợp",
    text: "Vào phòng theo track bạn đang học để gặp đúng người cùng lĩnh vực.",
  },
  {
    num: "2",
    title: "Đặt hẹn giờ & bắt đầu",
    text: "Chọn thời lượng Pomodoro, bật camera nếu muốn rồi vào guồng tập trung.",
  },
  {
    num: "3",
    title: "Kết thúc đúng cách",
    text: "Hết giờ, nhấn \"Rời phòng\" để lưu phiên, nhận XP và giữ streak.",
  },
];

// Mục lục nhanh - nhấn để nhảy tới từng phần của "văn bản".
const TOC = [
  { href: "#nguyen-tac", num: "01", label: "Sáu điều cốt lõi" },
  { href: "#nen-khong-nen", num: "02", label: "Nên · Không nên" },
  { href: "#quy-trinh", num: "03", label: "Một phiên chuẩn" },
];

// Con dấu tròn xoay chậm - điểm nhấn "văn bản được đóng dấu" của hero.
function RulesSeal() {
  return (
    <div className="relative h-44 w-44 sm:h-52 sm:w-52">
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full motion-safe:animate-[spin_32s_linear_infinite]"
        aria-hidden
      >
        <defs>
          <path
            id="rules-seal-circle"
            d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"
          />
        </defs>
        <text
          fill="#9a8a6a"
          fontSize="13"
          fontWeight="600"
          letterSpacing="3.2"
          style={{ textTransform: "uppercase" }}
        >
          <textPath href="#rules-seal-circle">
            Nội quy phòng học · AIOtivation · Yên tĩnh · Tập trung ·
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-6 rounded-full border border-dashed border-[#c9c2ae]" />
      <div className="absolute inset-10 flex items-center justify-center rounded-full border border-[#e0ddd3] bg-white/80 backdrop-blur">
        <CheckCircleIcon size={40} className="text-[#5f8a64]" />
      </div>
    </div>
  );
}

export default function RulesPage() {
  return (
    <div
      className="bg-[#f7f6f1] text-[#1b1b19]"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* Hero - dàn như trang bìa một văn bản: tiêu đề lớn, con dấu, mục lục */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(122,158,126,.45), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(181,118,74,.4), transparent 70%)" }}
        />
        {/* Chữ mờ khổ lớn chạy dọc mép phải - texture kiểu poster */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-10 hidden select-none text-[120px] font-semibold leading-none tracking-tight text-transparent lg:block"
          style={{ WebkitTextStroke: "1px #e3dfd2", writingMode: "vertical-rl" }}
        >
          NỘI QUY
        </span>

        <div className="relative mx-auto max-w-5xl px-5 pb-14 pt-16 sm:px-8 sm:pt-24">
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-center md:justify-between">
            <Reveal className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e0ddd3] bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a8a6a] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5f8a64]" />
                Văn bản nội quy · phiên bản 1.0
              </span>
              <h1 className="mt-6 text-4xl font-light leading-[1.08] tracking-tight sm:text-[56px]">
                Vài lời hứa nhỏ,
                <br />
                <strong className="font-semibold">một không gian yên tĩnh</strong>.
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#5a5a55]">
                Nội quy không phải để ràng buộc - đó là cách chúng ta giữ sự tập
                trung cho nhau. Đọc một lượt, mất chưa đến hai phút.
              </p>

              {/* Mục lục dạng pill - nhấn mạnh cảm giác "văn bản có điều khoản" */}
              <nav className="mt-8 flex flex-wrap gap-3" aria-label="Mục lục nội quy">
                {TOC.map((t) => (
                  <a
                    key={t.href}
                    href={t.href}
                    className="group inline-flex items-center gap-2.5 rounded-full border border-[#d8d5cc] bg-white/60 py-2 pl-2 pr-4 text-sm font-medium backdrop-blur transition-colors hover:border-[#1b1b19] hover:bg-white"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b1b19] text-[11px] font-semibold text-[#f7f6f1]">
                      {t.num}
                    </span>
                    {t.label}
                    <span className="text-[#9a8a6a] transition-transform group-hover:translate-y-0.5">↓</span>
                  </a>
                ))}
              </nav>
            </Reveal>

            <Reveal delay={150} className="shrink-0 self-center md:self-auto">
              <RulesSeal />
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* 01 · Sáu điều cốt lõi - danh sách "điều khoản" với số lớn dạng viền */}
        <section id="nguyen-tac" className="scroll-mt-24 pt-6">
          <Reveal>
            <div className="flex items-end justify-between gap-4 border-b border-[#1b1b19] pb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f8a64]">
                  Phần 01 · Nguyên tắc cốt lõi
                </div>
                <h2 className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">
                  Sáu điều <strong className="font-semibold">nên nhớ</strong>
                </h2>
              </div>
              <div className="hidden text-sm text-[#9a8a6a] sm:block">
                Điều 1 → Điều 6
              </div>
            </div>
          </Reveal>

          <div>
            {RULES.map((r, i) => (
              <Reveal key={r.title} delay={i * 70}>
                <div className="group relative grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-2 border-b border-[#e3e0d6] py-7 transition-colors sm:grid-cols-[110px_1fr_auto] sm:items-center sm:gap-x-8">
                  {/* Nền quét ngang khi hover - thay cho shadow card */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 -inset-x-4 origin-left scale-x-0 rounded-2xl transition-transform duration-300 ease-out group-hover:scale-x-100"
                    style={{ background: r.bg }}
                  />

                  {/* Số điều: viền rỗng, đổ đầy màu khi hover */}
                  <span className="relative row-span-2 select-none text-5xl font-semibold leading-none tracking-tight sm:row-span-1 sm:text-6xl">
                    <span
                      className="text-transparent"
                      style={{ WebkitTextStroke: "1.4px #c9c5b6" }}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ color: r.color }}
                    >
                      0{i + 1}
                    </span>
                  </span>

                  <div className="relative">
                    <h3 className="text-lg font-semibold text-[#1b1b19] sm:text-xl">
                      {r.title}
                    </h3>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#6b6b66]">
                      {r.text}
                    </p>
                  </div>

                  <span
                    className="relative hidden h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:flex"
                    style={{ background: r.bg, color: r.color }}
                  >
                    <r.Icon size={22} />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 02 · Nên / Không nên - một khối chia đôi như hai cột sổ tay */}
        <section id="nen-khong-nen" className="scroll-mt-24 mt-20">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f8a64]">
              Phần 02 · Tóm gọn trong hai cột
            </div>
            <h2 className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">
              Nên làm gì, <strong className="font-semibold">tránh điều gì</strong>
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-8 overflow-hidden rounded-[28px] border border-[#e3e0d6] bg-white md:grid md:grid-cols-2">
              {/* Cột Nên */}
              <div className="relative p-7 sm:p-9 md:border-r md:border-dashed md:border-[#e3e0d6]">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "#7a9e7e" }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e0ecdf] text-[#4a6b50]">
                      <CheckCircleIcon size={22} />
                    </span>
                    <h3 className="text-lg font-semibold text-[#3f5c44]">Nên làm</h3>
                  </div>
                  <span className="rounded-full bg-[#eef4ee] px-3 py-1 text-xs font-semibold text-[#5f8a64]">
                    {DO.length} điều
                  </span>
                </div>
                <ul className="mt-6 space-y-4">
                  {DO.map((item, i) => (
                    <li key={item} className="flex gap-3.5 text-sm leading-relaxed">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eef4ee] text-[11px] font-bold text-[#5f8a64]">
                        {i + 1}
                      </span>
                      <span className="text-[#4a5b4c]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cột Không nên */}
              <div className="relative border-t border-dashed border-[#e3e0d6] p-7 sm:p-9 md:border-t-0">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "#b5764a" }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0dcd4] text-[#a8503a]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </span>
                    <h3 className="text-lg font-semibold text-[#8c4331]">Không nên</h3>
                  </div>
                  <span className="rounded-full bg-[#f7ece6] px-3 py-1 text-xs font-semibold text-[#a8503a]">
                    {DONT.length} điều
                  </span>
                </div>
                <ul className="mt-6 space-y-4">
                  {DONT.map((item, i) => (
                    <li key={item} className="flex gap-3.5 text-sm leading-relaxed">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f7ece6] text-[11px] font-bold text-[#a8503a]">
                        {i + 1}
                      </span>
                      <span className="text-[#7a5b50]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 03 · Một phiên chuẩn - timeline ngang có đường nối */}
        <section id="quy-trinh" className="scroll-mt-24 mt-20">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f8a64]">
              Phần 03 · Một phiên học chuẩn
            </div>
            <h2 className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">
              Ba bước <strong className="font-semibold">gọn gàng</strong>
            </h2>
          </Reveal>

          <div className="relative mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {/* Đường nối đứt nét chạy qua tâm các nút số */}
            <span
              aria-hidden
              className="absolute left-[16.66%] right-[16.66%] top-[22px] hidden border-t-2 border-dashed border-[#d8d3c4] sm:block"
            />
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 130}>
                <div className="relative flex flex-col items-start sm:items-center sm:text-center">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#1b1b19] text-lg font-semibold text-[#f7f6f1] ring-8 ring-[#f7f6f1]">
                    {s.num}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[#1b1b19]">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6b6b66]">
                    {s.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Lời cam kết - kết trang như ký vào bản nội quy */}
        <Reveal>
          <section className="relative mb-24 mt-24 overflow-hidden rounded-[28px] bg-[#1b1b19] px-8 py-16 text-center text-[#f7f6f1]">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(122,158,126,.55), transparent 70%)" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(181,118,74,.5), transparent 70%)" }}
            />
            <div className="relative">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f7f6f1]/50">
                Lời cam kết nhỏ
              </div>
              <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">
                &ldquo;Tôi vào phòng để học,
                <br />
                và giữ sự yên tĩnh <strong className="font-semibold">cho cả những người khác</strong>.&rdquo;
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#f7f6f1]/70">
                Chỉ cần vậy thôi. Còn lại, cứ để không gian và mọi người xung
                quanh giữ nhịp tập trung cho bạn.
              </p>
              <Link
                href="/rooms"
                className="mt-8 inline-block rounded-full bg-[#f7f6f1] px-7 py-3.5 text-sm font-medium text-[#1b1b19] transition-transform hover:-translate-y-0.5"
              >
                Tôi đã hiểu - vào phòng học →
              </Link>
              <div className="mt-8 text-sm italic text-[#f7f6f1]/40">
                - Cộng đồng AIOtivation -
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
