import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { FlameIcon, TargetIcon, MedalIcon, ZapIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Về chúng tôi · AIOtivation",
  description:
    "Đội ngũ 5 người xây AIOtivation — không gian học ảo giúp bạn giữ nhịp tập trung.",
};

// 👉 Sửa tên / vai trò / mô tả / link của từng thành viên ở đây.
const TEAM = [
  {
    name: "Nhất Đỗ Hồng",
    role: "Trưởng nhóm · Frontend",
    initial: "N",
    color: "#7a9e7e",
    bio: "Dẫn dắt nhóm và dựng giao diện mượt mà để mỗi phiên học thật liền mạch.",
    links: { github: "#", linkedin: "#", mail: "mailto:hongnhatat@gmail.com" },
  },
  {
    name: "Nguyễn Thị Cẩm Vân",
    role: "Frontend",
    initial: "V",
    color: "#b5764a",
    bio: "Biến ý tưởng thành giao diện gọn gàng, mượt mà và dễ dùng mỗi ngày.",
    links: { github: "#", linkedin: "#", mail: "#" },
  },
  {
    name: "Trương Trung Tín",
    role: "AI / ML",
    initial: "T",
    color: "#7a8ca8",
    bio: "Huấn luyện trợ lý hiểu thói quen học và giữ nhịp tập trung cho bạn.",
    links: { github: "#", linkedin: "#", mail: "#" },
  },
  {
    name: "Đinh Văn Anh Khôi",
    role: "Thiết kế UI/UX",
    initial: "K",
    color: "#c08552",
    bio: "Giữ cho trải nghiệm yên tĩnh, rõ ràng và đầy cảm hứng.",
    links: { github: "#", linkedin: "#", mail: "#" },
  },
  {
    name: "Lê Đức Tùng Dương",
    role: "Backend",
    initial: "D",
    color: "#6f9173",
    bio: "Dựng API, xác thực và hạ tầng vững vàng để mọi phiên học chạy mượt.",
    links: { github: "#", linkedin: "#", mail: "#" },
  },
];

const STATS = [
  { num: "5", label: "Thành viên" },
  { num: "12", label: "Track chuyên môn" },
  { num: "2.4K+", label: "Người học mỗi ngày" },
  { num: "68%", label: "Tăng giờ tập trung" },
];

const VALUES = [
  {
    Icon: TargetIcon,
    title: "Tập trung",
    text: "Mọi tính năng đều phục vụ một việc: giúp bạn vào guồng và ở lại đó.",
  },
  {
    Icon: FlameIcon,
    title: "Bền bỉ",
    text: "Tiến bộ đến từ thói quen nhỏ lặp lại — chúng tôi giúp bạn giữ lửa.",
  },
  {
    Icon: MedalIcon,
    title: "Cùng nhau",
    text: "Học một mình dễ bỏ cuộc. Có cộng đồng bên cạnh, bạn đi xa hơn.",
  },
  {
    Icon: ZapIcon,
    title: "Tinh gọn",
    text: "Không ồn ào, không xao nhãng — chỉ giữ lại điều thật sự cần thiết.",
  },
];

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function SocialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e6df] bg-[#f7f6f1] text-[#8a8a83] transition-colors hover:border-[#1b1b19] hover:bg-[#1b1b19] hover:text-[#f7f6f1]"
    >
      {children}
    </a>
  );
}

export default function AboutPage() {
  return (
    <div
      className="bg-[#f7f6f1] text-[#1b1b19]"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* Hero với khối gradient trang trí */}
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
        <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e0ddd3] bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#9a8a6a] backdrop-blur">
              <FlameIcon size={14} className="text-[#b5764a]" />
              Về chúng tôi
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-light leading-[1.08] tracking-tight sm:text-[56px]">
              5 con người, một niềm tin:
              <br />
              <strong className="font-semibold">học cùng nhau thì đi xa hơn</strong>.
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#5a5a55]">
              AIOtivation ra đời từ một trăn trở quen thuộc: học một mình rất dễ
              bỏ cuộc. Chúng tôi xây một không gian học ảo yên tĩnh — nơi bạn vào
              phòng, bật camera, và để AI lặng lẽ giữ nhịp tập trung cho bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[#1b1b19] px-6 py-3 text-sm font-medium text-[#f7f6f1] transition-transform hover:-translate-y-0.5"
              >
                Vào phòng học
              </Link>
              <Link
                href="/#ai"
                className="rounded-full border border-[#d8d5cc] px-6 py-3 text-sm font-medium text-[#1b1b19] transition-colors hover:bg-white"
              >
                Cách hoạt động →
              </Link>
            </div>
          </Reveal>

          {/* Dải số liệu - nằm trong hero, trên nền gradient */}
          <Reveal delay={140}>
            <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-[#e8e6df] bg-white/80 px-5 py-7 text-center shadow-[0_16px_40px_-24px_rgba(27,27,25,0.22)] backdrop-blur"
                >
                  <div className="text-3xl font-bold tracking-tight text-[#1b1b19]">
                    {s.num}
                  </div>
                  <div className="mt-1.5 text-xs font-medium text-[#6b6b66]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Sứ mệnh */}
        <section className="border-t border-[#e3e1da] py-20">
          <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <h2 className="text-3xl font-light leading-snug tracking-tight">
                Sứ mệnh của <strong className="font-semibold">chúng tôi</strong>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="space-y-4 text-[16px] leading-relaxed text-[#4a4843]">
                <p>
                  Chúng tôi tin rằng động lực không đến từ ý chí đơn độc, mà từ
                  môi trường đúng và những người đồng hành phù hợp. Vì thế mỗi
                  chi tiết trong AIOtivation đều hướng tới sự tập trung — không
                  ồn ào, không xao nhãng.
                </p>
                <p>
                  Là một nhóm 5 người với thế mạnh khác nhau — sản phẩm, kỹ
                  thuật, AI và thiết kế — chúng tôi cùng nhau biến những phiên
                  học cô đơn thành hành trình có cộng đồng, có nhịp điệu và có
                  niềm vui.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Đội ngũ */}
        <section className="border-t border-[#e3e1da] py-20">
          <Reveal>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a8a6a]">
              Đội ngũ
            </div>
            <h2 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">
              Những người <strong className="font-semibold">đứng sau</strong>
            </h2>
          </Reveal>

          <div className="mt-12 flex flex-wrap justify-center gap-5">
            {TEAM.map((m, i) => (
              <Reveal
                key={m.name}
                delay={(i % 3) * 90}
                className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              >
                <div className="group relative flex h-full flex-col items-center overflow-hidden rounded-3xl border border-[#e8e6df] bg-white px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgba(27,27,25,0.32)]">
                  {/* dải màu trên đầu thẻ, hiện khi hover */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}88)` }}
                  />
                  {/* avatar có ring */}
                  <span
                    className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-[#f7f6f1] ring-4 ring-white"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${m.color}, ${m.color}bb)`,
                      boxShadow: `0 12px 30px -12px ${m.color}`,
                    }}
                  >
                    {m.initial}
                  </span>

                  <h3 className="mt-5 text-lg font-semibold text-[#1b1b19]">
                    {m.name}
                  </h3>
                  <span
                    className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium"
                    style={{ backgroundColor: `${m.color}1f`, color: m.color }}
                  >
                    {m.role}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-[#6b6b66]">
                    {m.bio}
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <SocialLink href={m.links.github}>
                      <GithubIcon />
                    </SocialLink>
                    <SocialLink href={m.links.linkedin}>
                      <LinkedinIcon />
                    </SocialLink>
                    <SocialLink href={m.links.mail}>
                      <MailIcon />
                    </SocialLink>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Giá trị */}
        <section className="border-t border-[#e3e1da] py-20">
          <Reveal>
            <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
              Điều chúng tôi <strong className="font-semibold">trân trọng</strong>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <div className="h-full rounded-3xl border border-[#e8e6df] bg-white p-6 transition-shadow hover:shadow-[0_20px_50px_-26px_rgba(27,27,25,0.28)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7a9e7e]/[0.14] text-[#5f8a64]">
                    <v.Icon size={24} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#1b1b19]">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6b6b66]">
                    {v.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Reveal>
          <section className="relative mb-24 mt-4 overflow-hidden rounded-[28px] bg-[#1b1b19] px-8 py-16 text-center text-[#f7f6f1]">
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
              <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
                Cùng chúng tôi <strong className="font-semibold">giữ nhịp</strong>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#f7f6f1]/70">
                Vào phòng học đầu tiên của bạn — miễn phí, không cần thẻ, chỉ mất
                30 giây.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-block rounded-full bg-[#f7f6f1] px-7 py-3.5 text-sm font-medium text-[#1b1b19] transition-transform hover:-translate-y-0.5"
              >
                Vào phòng học →
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
