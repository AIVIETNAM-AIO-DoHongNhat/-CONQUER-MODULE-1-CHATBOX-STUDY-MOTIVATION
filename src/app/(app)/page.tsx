import Link from "next/link";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import ScrollToTop from "@/components/ScrollToTop";
import {
  FlaskIcon,
  RocketIcon,
  PaletteIcon,
  FlameIcon,
  MedalIcon,
  ZapIcon,
  TargetIcon,
  LockIcon,
} from "@/components/icons";
import styles from "./landing.module.css";

const MEMBERS = [
  {
    name: "Minh An",
    initial: "An",
    color: "#7a9e7e",
    bg: "#eef2ee",
    timer: "24:18",
    muted: false,
    status: "Đang tập trung",
    speaking: true,
  },
  {
    name: "Thu Hà",
    initial: "Hà",
    color: "#b5764a",
    bg: "#f2ece6",
    timer: "41:02",
    muted: true,
    status: "Đang tập trung",
    speaking: false,
  },
  {
    name: "Đức",
    initial: "Đ",
    color: "#7a8ca8",
    bg: "#ecedf1",
    timer: "08:47",
    muted: false,
    status: "Đang ghi chú",
    speaking: false,
  },
];

function MicIcon({ off = false }: { off?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M2 2l20 20" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </>
      ) : (
        <>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </>
      )}
    </svg>
  );
}

const STATS = [
  { value: 2.4, decimals: 1, suffix: "K+", label: "Đang học mỗi ngày" },
  { value: 68, decimals: 0, suffix: "%", label: "Tăng giờ tập trung" },
  { value: 12, decimals: 0, suffix: "", label: "Track học chuyên môn" },
];

// Dải chữ chạy ngang (marquee) - nhịp thở giữa stats và các section.
const MARQUEE = [
  "Deep Work",
  "Pomodoro",
  "Body Doubling",
  "Research",
  "Product",
  "NonTech",
  "Focus Streak",
  "Học cùng nhau",
];

// Ba bước bắt đầu - cho người mới hình dung ngay luồng sử dụng.
const STEPS = [
  {
    num: "1",
    title: "Chọn phòng theo track",
    text: "Vào phòng Research, Product hay NonTech - nơi mọi người đang tập trung vào cùng lĩnh vực với bạn.",
  },
  {
    num: "2",
    title: "Đặt hẹn giờ & bắt đầu",
    text: "Chọn thời lượng Pomodoro, bật camera nếu muốn, và để cả phòng cùng giữ nhịp tập trung cho bạn.",
  },
  {
    num: "3",
    title: "Nhận tổng kết & XP",
    text: "Kết thúc phiên, AI tổng kết mức tập trung - bạn nhận XP, giữ streak và leo bảng xếp hạng tuần.",
  },
];

const TRACKS = [
  {
    Icon: FlaskIcon,
    iconBg: "rgba(122,158,126,.14)",
    iconColor: "#5f8a64",
    title: "Research",
    text: "Đọc paper, viết note, đào sâu kiến thức cùng những người học nghiêm túc.",
    meta: "4 phòng đang mở · 18 người",
    metaColor: "#6f9173",
  },
  {
    Icon: RocketIcon,
    iconBg: "rgba(181,118,74,.14)",
    iconColor: "#a86a3f",
    title: "Product",
    text: "Build sản phẩm, học design & growth, review tiến độ theo từng buổi.",
    meta: "3 phòng đang mở · 11 người",
    metaColor: "#a86a3f",
  },
  {
    Icon: PaletteIcon,
    iconBg: "rgba(122,140,168,.14)",
    iconColor: "#6f86a8",
    title: "NonTech",
    text: "Marketing, vận hành, kỹ năng mềm - học cùng cộng đồng đa lĩnh vực.",
    meta: "5 phòng đang mở · 23 người",
    metaColor: "#6f86a8",
  },
];

const FEATURES = [
  {
    num: "01",
    title: "Gợi ý lộ trình & nhạc theo mood",
    text: "AI đề xuất lộ trình học phù hợp và playlist hợp tâm trạng để bạn vào guồng nhanh hơn.",
  },
  {
    num: "02",
    title: "Nhắc focus / break mỗi 30 phút",
    text: "Chu kỳ tập trung – nghỉ hợp lý, có tương tác để bạn không trôi khỏi mục tiêu buổi học.",
  },
  {
    num: "03",
    title: "Tóm tắt trạng thái tập trung",
    text: "Cuối buổi, AI tổng kết mức tập trung và cá nhân hóa gợi ý cho lần học tiếp theo.",
  },
];

const LEADERBOARD = [
  { rank: "1", name: "Thu Hà", initial: "Hà", color: "#b5764a", time: "14h" },
  { rank: "2", name: "Minh An", initial: "An", color: "#7a9e7e", time: "12h" },
  { rank: "3", name: "Đức", initial: "Đ", color: "#7a8ca8", time: "9h" },
  { rank: "4", name: "Bạn", initial: "B", color: "#b0aea6", time: "7h" },
];

const BADGES = [
  { Icon: MedalIcon, label: "Huy chương vàng", earned: true },
  { Icon: ZapIcon, label: "Bứt tốc", earned: true },
  { Icon: TargetIcon, label: "Đúng mục tiêu", earned: true },
  { Icon: LockIcon, label: "Chưa mở", earned: false },
  { Icon: LockIcon, label: "Chưa mở", earned: false },
  { Icon: LockIcon, label: "Chưa mở", earned: false },
];

const QUOTES = [
  {
    text: "Vào phòng có người học cùng, mình tập trung hẳn - bỏ được thói quen lướt điện thoại lúc học.",
    name: "Minh An",
    role: "AIO Learner",
    initial: "An",
    color: "#7a9e7e",
  },
  {
    text: "AI nhắc nghỉ đúng lúc nên mình không bị kiệt sức. Streak 27 ngày rồi và vẫn đang giữ!",
    name: "Thu Hà",
    role: "Research track",
    initial: "Hà",
    color: "#b5764a",
  },
  {
    text: "Bảng xếp hạng tạo động lực nhẹ nhàng mà hiệu quả. Mình học đều đặn hơn hẳn trước đây.",
    name: "Đức",
    role: "Product track",
    initial: "Đ",
    color: "#7a8ca8",
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Hero */}
        <section className={styles.hero}>
          <span className={`${styles.heroBlob} ${styles.heroBlobA}`} aria-hidden />
          <span className={`${styles.heroBlob} ${styles.heroBlobB}`} aria-hidden />
          <Reveal>
            <div className={styles.eyebrow}>Phòng học ảo trong AIO</div>
            <h1 className={styles.title}>
              Không gian yên tĩnh để
              <br />
              <strong>học cùng nhau</strong>.
            </h1>
            <p className={styles.lead}>
              Vào phòng, bật camera, và để AI lặng lẽ giữ nhịp tập trung cho bạn.
              Không ồn ào - chỉ có sự tập trung.
            </p>
            <div className={styles.heroActions}>
              <Link href="/rooms" className={styles.btnPrimary}>
                Vào phòng học
              </Link>
              <a href="#ai" className={styles.btnGhost}>
                Cách hoạt động →
              </a>
            </div>
            <div className={styles.trustRow}>
              <span className={styles.trustAvatars}>
                {MEMBERS.map((m) => (
                  <span key={m.name} style={{ background: m.color }}>
                    {m.initial}
                  </span>
                ))}
                <span style={{ background: "#9a8a6a" }}>2K</span>
              </span>
              <span className={styles.trustText}>
                Cùng 2.400+ người đang giữ nhịp học mỗi ngày
              </span>
            </div>
          </Reveal>

          {/* Room card */}
          <Reveal delay={120}>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <div className={styles.cardRoom}>Phòng Research</div>
                  <div className={styles.cardRoomSub}>
                    Phiên chiều · tập trung sâu
                  </div>
                </div>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} />
                  Đang học · 3
                </span>
              </div>

              <div className={styles.avatarGrid}>
                {MEMBERS.map((m) => (
                  <div
                    key={m.name}
                    className={`${styles.avatar} ${
                      m.speaking ? styles.avatarSpeaking : ""
                    }`}
                    style={{ background: m.bg }}
                  >
                    <span className={styles.avatarTimer}>
                      <i />
                      {m.timer}
                    </span>
                    <span
                      className={`${styles.avatarMic} ${
                        m.muted ? styles.avatarMicOff : ""
                      }`}
                    >
                      <MicIcon off={m.muted} />
                    </span>
                    <span
                      className={styles.avatarFace}
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
                      }}
                    >
                      {m.initial}
                    </span>
                    <div className={styles.avatarFoot}>
                      <span className={styles.avatarName}>{m.name}</span>
                      <span className={styles.avatarStatus}>
                        <i style={{ background: m.color }} />
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.aiBar}>
                <span className={styles.dot} />
                <span className={styles.aiText}>
                  <strong>AI</strong> · còn 8 phút tới giờ nghỉ. Bạn đang làm tốt.
                </span>
                <span className={styles.aiWave} aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Stats */}
        <Reveal>
          <div className={styles.stats}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.stat}>
                <div className={styles.statNum}>
                  <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} />
                </div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Marquee - dải từ khóa chạy ngang */}
        <div className={styles.marquee} aria-hidden>
          <div className={styles.marqueeTrack}>
            {[0, 1].map((group) => (
              <div key={group} className={styles.marqueeGroup}>
                {MARQUEE.map((word) => (
                  <span key={word} className={styles.marqueeItem}>
                    <i />
                    {word}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <section id="phong-hoc" className={styles.section}>
          <Reveal>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.kicker}>Phòng học theo track</div>
                <h2 className={styles.sectionTitle}>
                  Chọn phòng, <strong>gặp đúng người</strong>
                </h2>
              </div>
              <Link href="/rooms" className={styles.sectionLink}>
                Xem tất cả phòng →
              </Link>
            </div>
          </Reveal>
          <div className={styles.trackGrid}>
            {TRACKS.map((t, i) => (
              <Reveal key={t.title} delay={i * 100} className={styles.revealFill}>
                <div className={styles.trackCard}>
                  <div
                    className={styles.trackIcon}
                    style={{ background: t.iconBg, color: t.iconColor }}
                  >
                    <t.Icon size={26} />
                  </div>
                  <h3 className={styles.trackTitle}>{t.title}</h3>
                  <p className={styles.trackText}>{t.text}</p>
                  <div
                    className={styles.trackMeta}
                    style={{ color: t.metaColor }}
                  >
                    <span
                      className={styles.trackMetaDot}
                      style={{ background: t.metaColor }}
                    />
                    {t.meta}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className={`${styles.section} ${styles.sectionBordered}`}>
          <Reveal>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.kicker}>Bắt đầu trong 30 giây</div>
                <h2 className={styles.sectionTitle}>
                  Ba bước để <strong>vào guồng tập trung</strong>
                </h2>
              </div>
            </div>
          </Reveal>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 120} className={styles.revealFill}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>{s.num}</div>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* AI */}
        <section id="ai" className={`${styles.section} ${styles.sectionBordered}`}>
          <Reveal>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.kicker}>AI đồng hành</div>
                <h2 className={styles.sectionTitle}>
                  Một trợ lý <strong>hiểu thói quen học</strong> của bạn
                </h2>
              </div>
            </div>
          </Reveal>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.num} delay={i * 100}>
                <div>
                  <div className={styles.featureNum}>{f.num}</div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureText}>{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Gamification */}
        <section
          id="cong-dong"
          className={`${styles.section} ${styles.sectionBordered}`}
        >
          <Reveal>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.kicker}>Động lực bền bỉ</div>
                <h2 className={styles.sectionTitle}>
                  Giữ lửa mỗi ngày
                  <FlameIcon size={34} className={styles.titleFlame} />
                </h2>
              </div>
            </div>
          </Reveal>
          <div className={styles.gamifyGrid}>
            {/* Streak */}
            <Reveal>
              <div className={styles.panel}>
                <div className={styles.streakHead}>
                  <span className={styles.streakIcon}>
                    <FlameIcon size={26} strokeWidth={1.7} />
                  </span>
                  <div>
                    <div className={styles.streakNum}>27 ngày</div>
                    <div className={styles.streakLabel}>chuỗi học liên tục</div>
                  </div>
                </div>
                <div className={styles.streakBars}>
                  <span className={`${styles.bar} ${styles.barFull}`} />
                  <span className={`${styles.bar} ${styles.barFull}`} />
                  <span className={`${styles.bar} ${styles.barFull}`} />
                  <span className={`${styles.bar} ${styles.barFull}`} />
                  <span className={`${styles.bar} ${styles.barFull}`} />
                  <span className={`${styles.bar} ${styles.barPartial}`} />
                  <span className={styles.bar} />
                </div>
                <div className={styles.streakGoal}>
                  Mục tiêu hôm nay: <strong>90 phút</strong> · đã xong 64 phút
                </div>
              </div>
            </Reveal>

            {/* Leaderboard */}
            <Reveal delay={100}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Bảng xếp hạng tuần</div>
                {LEADERBOARD.map((p) => (
                  <div
                    key={p.name}
                    className={styles.lbRow}
                    style={p.name === "Bạn" ? { opacity: 0.7 } : undefined}
                  >
                    <span className={styles.lbRank}>{p.rank}</span>
                    <span
                      className={styles.lbAvatar}
                      style={{ background: p.color }}
                    >
                      {p.initial}
                    </span>
                    <span className={styles.lbName}>{p.name}</span>
                    <span className={styles.lbTime}>{p.time}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Badges */}
            <Reveal delay={200}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Huy hiệu</div>
                <div className={styles.badgeGrid}>
                  {BADGES.map((b, i) => (
                    <div
                      key={i}
                      title={b.label}
                      className={`${styles.badge} ${
                        b.earned ? styles.badgeEarned : styles.badgeLocked
                      }`}
                    >
                      <b.Icon size={22} />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Testimonials */}
        <section className={`${styles.section} ${styles.sectionBordered}`}>
          <Reveal>
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.kicker}>Cộng đồng nói gì</div>
                <h2 className={styles.sectionTitle}>
                  Học một mình dễ bỏ cuộc. <strong>Cùng nhau thì khác.</strong>
                </h2>
              </div>
            </div>
          </Reveal>
          <div className={styles.quoteGrid}>
            {QUOTES.map((q, i) => (
              <Reveal key={q.name} delay={i * 100} className={styles.revealFill}>
                <div className={styles.quoteCard}>
                  <p className={styles.quoteText}>“{q.text}”</p>
                  <div className={styles.quoteAuthor}>
                    <span
                      className={styles.quoteAvatar}
                      style={{ background: q.color }}
                    >
                      {q.initial}
                    </span>
                    <div>
                      <div className={styles.quoteName}>{q.name}</div>
                      <div className={styles.quoteRole}>{q.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <Reveal>
          <section className={styles.finalCta}>
            <span className={`${styles.ctaGlow} ${styles.ctaGlowA}`} aria-hidden />
            <span className={`${styles.ctaGlow} ${styles.ctaGlowB}`} aria-hidden />
            <h2>
              Bắt đầu phiên học <strong>đầu tiên</strong>
            </h2>
            <p>Miễn phí. Không cần thẻ. Vào phòng trong 30 giây.</p>
            <Link href="/login" className={`${styles.btnPrimary} ${styles.btnLight}`}>
              Vào phòng học →
            </Link>
          </section>
        </Reveal>
      </div>

      <ScrollToTop />
    </div>
  );
}
