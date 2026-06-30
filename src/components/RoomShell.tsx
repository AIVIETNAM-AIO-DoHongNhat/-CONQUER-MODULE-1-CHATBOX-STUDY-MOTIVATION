"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Timer, { type TimerResult, type TimerProgress } from "./Timer";
import TodoWidget from "./TodoWidget";
import { useToast } from "./Toast";
import { useRoom } from "@/hooks/useRooms";
import { ApiError, endSession, getActiveSession, readApiError, startSession } from "@/lib/api";

interface RoomShellProps {
  sessionId?: string | number;
}

type SessionState = "starting" | "active" | "ending" | "ended" | "error";

// Backend trả 400 kèm thông báo khi user đã có phiên đang chạy. Nhận diện qua
// nội dung message để phân biệt với các lỗi 400 khác (vd phòng đầy).
function hasActiveSessionConflict(error: ApiError): boolean {
  if (error.status !== 400) return false;
  return readApiError(error).toLowerCase().includes("active study session");
}

// Dữ liệu thành viên tạm (mock) — dùng chung cho cả scene và sidebar.
const MEMBERS = [
  { name: "Minh An", initial: "A", color: "#7a9e7e", status: "Đang tập trung", elapsed: "24:18" },
  { name: "Thu Hà", initial: "H", color: "#b5764a", status: "Đang tập trung", elapsed: "41:02" },
];

/* ── Icon dock (inline, kế thừa currentColor) ─────────────────────────── */
type IconProps = { size?: number; className?: string };
const svg = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

function CameraIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="m23 7-7 5 7 5V7z" />
      <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
    </svg>
  );
}
function MicIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
function SlashIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
function LeaveIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}
function MaximizeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
function MinimizeIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function UsersIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
    </svg>
  );
}
function NoteIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  );
}

/* ── Một ô video tham gia (placeholder camera-off / live cho chính mình) ── */
function SceneTile({
  name,
  initial,
  color,
  self = false,
  camOff = true,
  micOff = false,
  videoRef,
}: {
  name: string;
  initial: string;
  color: string;
  self?: boolean;
  camOff?: boolean;
  micOff?: boolean;
  videoRef?: React.Ref<HTMLVideoElement>;
}) {
  const showVideo = self && !camOff;
  return (
    <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-[#e8e6df] bg-[#f1f0ea]">
      {showVideo ? (
        // Gương ảnh chính mình (-scale-x) như chuẩn các app gọi video.
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
      ) : (
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {initial}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/35 to-transparent px-3 py-2">
        <span className="text-xs font-medium text-white drop-shadow">
          {name}
          {self && " (Bạn)"}
        </span>
        <span className="flex items-center gap-1">
          {self && micOff && (
            <span className="relative rounded-full bg-white/85 p-1 text-[#b45454]">
              <MicIcon size={13} />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <SlashIcon size={18} />
              </span>
            </span>
          )}
          {!showVideo && (
            <span className="rounded-full bg-white/85 p-1 text-[#6b6b66]">
              <CameraIcon size={13} />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

const STATUS: Record<SessionState, { label: string; dot: string; cls: string }> = {
  starting: { label: "Đang bắt đầu…", dot: "#c9a24a", cls: "border-[#ecdfb8] bg-[#f7f1e0] text-[#8a6d2f]" },
  active: { label: "Đang diễn ra", dot: "#5f8a64", cls: "border-[#cfe0d2] bg-[#eef4ef] text-[#4f6b53]" },
  ending: { label: "Đang lưu…", dot: "#c9a24a", cls: "border-[#ecdfb8] bg-[#f7f1e0] text-[#8a6d2f]" },
  ended: { label: "Đã hoàn tất", dot: "#5f8a64", cls: "border-[#cfe0d2] bg-[#eef4ef] text-[#4f6b53]" },
  error: { label: "Chưa thể bắt đầu", dot: "#b45454", cls: "border-red-200 bg-red-50 text-red-600" },
};

export default function RoomShell({ sessionId }: RoomShellProps) {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: room } = useRoom(sessionId);
  const [sessionState, setSessionState] = useState<SessionState>("starting");
  const [camOff, setCamOff] = useState(true);
  const [micOff, setMicOff] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(0);
  // Stream cam/mic thực của chính mình + ref tới scene để bật toàn màn hình.
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  // Mốc thời gian thực khi lịch focus/break bắt đầu (= session.started_at). Timer
  // suy ra pha từ mốc này nên khôi phục đúng chỗ sau khi chuyển trang/refresh.
  const [epochMs, setEpochMs] = useState<number | null>(null);
  const startRequested = useRef(false);
  const endRequested = useRef(false);
  // Số phút focus do Timer báo về (giá trị tuyệt đối theo số chu kỳ đã xong);
  // dùng ref để finishSession/handleLeave luôn đọc được giá trị mới nhất.
  const focusMinutesRef = useRef(0);

  useEffect(() => {
    if (startRequested.current) return;
    if (sessionId === undefined) return;
    startRequested.current = true;

    (async () => {
      try {
        // Ưu tiên khôi phục phiên đang chạy để không restart từ đầu. Mốc lấy từ
        // started_at của backend → Timer tính đúng thời gian đã trôi.
        const active = await getActiveSession();
        if (active) {
          setEpochMs(Date.parse(active.started_at));
          setSessionState("active");
          if (active.room !== Number(sessionId)) {
            toast.info("Tiếp tục phiên đang mở", "Bạn đang có một phiên học khác đang chạy.");
          }
          return;
        }
      } catch {
        // Lỗi khi hỏi phiên hiện tại (không phải 404) → bỏ qua, thử bắt đầu mới.
      }

      try {
        const session = await startSession(sessionId);
        setEpochMs(Date.parse(session.started_at));
        setSessionState("active");
        toast.success("Phiên đã bắt đầu", "Timer focus 30 phút đang chạy.");
      } catch (error) {
        // Race hiếm gặp: phiên vừa được tạo giữa lúc hỏi active và start. Coi như
        // tiếp tục, lấy thời điểm hiện tại làm mốc tạm.
        if (error instanceof ApiError && hasActiveSessionConflict(error)) {
          setEpochMs(Date.now());
          setSessionState("active");
          toast.info("Tiếp tục phiên đang mở", "Bạn đã có một phiên học đang chạy.");
          return;
        }
        setSessionState("error");
        toast.error("Không thể bắt đầu phiên", readApiError(error));
      }
    })();
  }, [toast, sessionId]);

  // Timer báo tiến độ (số chu kỳ đã xong → số phút focus). Giá trị tuyệt đối nên
  // gán thẳng, đúng cả khi khôi phục phiên (Timer báo baseline lúc mount).
  const handleProgress = useCallback((info: TimerProgress) => {
    focusMinutesRef.current = info.focusMinutes;
    setFocusMinutes(info.focusMinutes);
  }, []);

  const finishSession = useCallback(
    async (result?: TimerResult) => {
      if (endRequested.current || sessionState !== "active") return;
      endRequested.current = true;
      setSessionState("ending");

      try {
        // Task 4: gửi số phút thực sự đã focus. Nếu chưa xong phiên nào (rời sớm)
        // thì để backend tự tính theo thời gian trôi.
        const minutes = focusMinutesRef.current;
        const data = await endSession(minutes > 0 ? minutes : undefined);
        toast.success(
          "Đã lưu kết quả phiên",
          `Đã focus ${data.session.focus_minutes ?? minutes} phút · +${data.xp_awarded} XP.`,
        );
        // XP/level/streak đã đổi ở backend → làm mới hồ sơ.
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        // Phút đã học vừa cộng vào mục tiêu hôm nay → làm mới DailyGoal hôm nay
        // và lịch chuỗi (history) để streak/ngọn lửa cập nhật ngay.
        queryClient.invalidateQueries({ queryKey: ["daily-goal"] });
        setSessionState("ended");
        void result;
      } catch (error) {
        endRequested.current = false;
        setSessionState("active");
        toast.error("Không thể kết thúc phiên", readApiError(error));
        throw error;
      }
    },
    [sessionState, toast, queryClient],
  );

  const handleLeave = useCallback(async () => {
    try {
      await finishSession();
      router.push("/rooms");
    } catch {
      // Giữ user trong phòng để có thể thử kết thúc phiên lại.
    }
  }, [finishSession, router]);

  // Gắn stream vào thẻ <video> mỗi khi bật cam / element được mount lại.
  useEffect(() => {
    if (!camOff && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [camOff]);

  // Dừng mọi track khi rời component để trả camera/mic về hệ thống.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Đồng bộ state với trạng thái fullscreen thực (kể cả khi user nhấn Esc).
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === sceneRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleCamera = useCallback(async () => {
    if (!camOff) {
      streamRef.current?.getVideoTracks().forEach((t) => {
        t.stop();
        streamRef.current?.removeTrack(t);
      });
      setCamOff(true);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true });
      const stream = streamRef.current ?? new MediaStream();
      media.getVideoTracks().forEach((t) => stream.addTrack(t));
      streamRef.current = stream;
      setCamOff(false);
    } catch {
      toast.error("Không thể bật camera", "Hãy kiểm tra quyền truy cập camera của trình duyệt.");
    }
  }, [camOff, toast]);

  const toggleMic = useCallback(async () => {
    if (!micOff) {
      streamRef.current?.getAudioTracks().forEach((t) => {
        t.stop();
        streamRef.current?.removeTrack(t);
      });
      setMicOff(true);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const stream = streamRef.current ?? new MediaStream();
      media.getAudioTracks().forEach((t) => stream.addTrack(t));
      streamRef.current = stream;
      setMicOff(false);
    } catch {
      toast.error("Không thể bật mic", "Hãy kiểm tra quyền truy cập micro của trình duyệt.");
    }
  }, [micOff, toast]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void sceneRef.current?.requestFullscreen?.();
    }
  }, []);

  const status = STATUS[sessionState];
  const isLive = sessionState === "active" || sessionState === "ending";
  const leaveDisabled = sessionState === "starting" || sessionState === "ending";

  return (
    <div
      className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* ── Scene ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col lg:col-span-2">
        <div
          ref={sceneRef}
          data-fullscreen={isFullscreen ? "" : undefined}
          className="flex flex-col overflow-hidden rounded-3xl border border-[#e8e6df] bg-white shadow-sm data-fullscreen:justify-center data-fullscreen:rounded-none"
        >
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#efece4] px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#5f8a64]">
                  Phòng học
                </span>
                <h1 className="text-lg font-bold tracking-tight text-[#1b1b19]">
                  {room?.name ?? `Phòng #${sessionId}`}
                </h1>
              </div>
              {room?.category && (
                <span className="rounded-full bg-[#eef4ef] px-2.5 py-0.5 text-xs font-medium text-[#4f6b53]">
                  {room.category}
                </span>
              )}
              {room && (
                <span className="text-xs text-[#6b6b66]">
                  {room.active_user_count}/{room.max_users} người
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.cls}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: status.dot }}
                />
                {status.label}
              </span>
            </div>
          </header>

          {/* Lưới participant tiles */}
          <div className="bg-[#fbfaf6] p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SceneTile
                name="Minh An"
                initial="A"
                color="#7a9e7e"
                self
                camOff={camOff}
                micOff={micOff}
                videoRef={videoRef}
              />
              {MEMBERS.map((m) => (
                <SceneTile key={m.name} name={m.name} initial={m.initial} color={m.color} />
              ))}
            </div>
          </div>

          {/* Control dock */}
          <footer className="flex items-center justify-center gap-3 border-t border-[#efece4] px-5 py-4">
            <DockButton
              active={!camOff}
              onClick={() => void toggleCamera()}
              label={camOff ? "Bật camera" : "Tắt camera"}
              icon={<CameraIcon />}
              off={camOff}
            />
            <DockButton
              active={!micOff}
              onClick={() => void toggleMic()}
              label={micOff ? "Bật mic" : "Tắt mic"}
              icon={<MicIcon />}
              off={micOff}
            />
            <DockButton
              active={isFullscreen}
              onClick={toggleFullscreen}
              label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              icon={isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            />
          </footer>
        </div>
      </section>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="flex flex-col gap-5">
        {/* Bảng điều khiển phiên — timer + rời phòng gọn trên cùng */}
        <div className="rounded-3xl border border-[#e8e6df] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.cls}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse" : ""}`}
                style={{ backgroundColor: status.dot }}
              />
              {status.label}
            </span>
            {focusMinutes > 0 && (
              <span className="text-xs font-medium text-[#4f6b53]">
                Đã focus {focusMinutes} phút
              </span>
            )}
          </div>

          {isLive && epochMs !== null ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Timer
                epochMs={epochMs}
                focusSeconds={30 * 60}
                breakSeconds={5 * 60}
                cycles={4}
                onProgress={handleProgress}
                onSessionEnd={(result) => void finishSession(result)}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#6b6b66]">{status.label}</p>
          )}

          <button
            type="button"
            onClick={() => void handleLeave()}
            disabled={leaveDisabled}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#e7c6b8] bg-[#f8ece6] px-4 py-2 text-sm font-medium text-[#a8503a] transition-colors hover:bg-[#f3ddd2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LeaveIcon />
            {sessionState === "ending" ? "Đang lưu…" : "Rời phòng"}
          </button>
        </div>

        {/* Thành viên */}
        <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b19]">
              <UsersIcon className="text-[#5f8a64]" />
              Thành viên
            </h2>
            <span className="rounded-full bg-[#eef4ef] px-2.5 py-0.5 text-xs font-medium text-[#4f6b53]">
              {room?.active_user_count ?? 0} đang học
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            <MemberRow name="Bạn" initial="A" color="#7a9e7e" status="Đang tập trung" elapsed="—" />
            {MEMBERS.map((m) => (
              <MemberRow key={m.name} {...m} />
            ))}
          </ul>
          {/* Backend mới trả về số đếm, chưa có API danh sách người trong phòng. */}
          <p className="mt-3 text-xs text-[#b0aea6]">
            Danh sách minh họa — chờ API người trong phòng.
          </p>
        </div>

        {/* Ghi chú nhanh */}
        <QuickNotes roomKey={String(sessionId ?? "default")} />
      </aside>

      {/* Checklist công việc — nút nổi góc phải, mở popover (API /api/v1/todos/) */}
      <TodoWidget />
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────── */
function DockButton({
  icon,
  label,
  onClick,
  active,
  off = false,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active: boolean;
  off?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
        active
          ? "border-[#cfe0d2] bg-[#eef4ef] text-[#4f6b53] hover:bg-[#e3eee4]"
          : "border-[#e8e6df] bg-white text-[#6b6b66] hover:bg-[#f1f0ea]"
      }`}
    >
      {icon}
      {off && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#b45454]">
          <SlashIcon size={26} />
        </span>
      )}
    </button>
  );
}

function MemberRow({
  name,
  initial,
  color,
  status,
  elapsed,
}: {
  name: string;
  initial: string;
  color: string;
  status: string;
  elapsed: string;
}) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {initial}
        </span>
        <div>
          <div className="text-sm font-medium text-[#1b1b19]">{name}</div>
          <div className="flex items-center gap-1.5 text-xs text-[#6b6b66]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7a9e7e]" />
            {status}
          </div>
        </div>
      </div>
      <span className="font-mono text-xs text-[#b0aea6]">{elapsed}</span>
    </li>
  );
}

/* ── Ghi chú nhanh — tự lưu vào localStorage theo từng phòng ───────────── */
function QuickNotes({ roomKey }: { roomKey: string }) {
  const storageKey = `room-notes:${roomKey}`;
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  // Tránh ghi đè localStorage rỗng trước khi nạp xong nội dung đã lưu.
  const loaded = useRef(false);

  useEffect(() => {
    setText(window.localStorage.getItem(storageKey) ?? "");
    setSaved(true);
    loaded.current = true;
  }, [storageKey]);

  // Debounce: chỉ ghi sau khi ngừng gõ 600ms để đỡ chạm localStorage liên tục.
  useEffect(() => {
    if (!loaded.current) return;
    setSaved(false);
    const id = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, text);
      setSaved(true);
    }, 600);
    return () => window.clearTimeout(id);
  }, [text, storageKey]);

  return (
    <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b19]">
          <NoteIcon className="text-[#5f8a64]" />
          Ghi chú nhanh
        </h2>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
            saved ? "text-[#5f8a64]" : "text-[#b0aea6]"
          }`}
        >
          {saved ? (
            <>
              <CheckIcon /> Đã lưu
            </>
          ) : (
            "Đang lưu…"
          )}
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-[#e0ddd3] bg-[#fbfaf6] transition-colors focus-within:border-[#7a9e7e] focus-within:ring-2 focus-within:ring-[#7a9e7e]/15">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Ghi lại mục tiêu hoặc ý tưởng trong buổi học…"
          className="w-full resize-none rounded-2xl bg-transparent p-3 text-sm text-[#1b1b19] outline-none placeholder:text-[#b0aea6]"
        />
        <div className="flex items-center justify-between border-t border-[#ebe8df] px-3 py-2 text-[11px] text-[#b0aea6]">
          <span>Tự lưu trên thiết bị này</span>
          <span className="tabular-nums">{text.length} ký tự</span>
        </div>
      </div>
    </div>
  );
}
