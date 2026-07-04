"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { ConnectionState, Track, type Participant } from "livekit-client";
import Timer, { type TimerProgress } from "./Timer";
import TodoWidget from "./TodoWidget";
import BoChat from "./BoChat";
import { useToast } from "./Toast";
import { useRoom } from "@/hooks/useRooms";
import {
  ApiError,
  endSession,
  getAccessToken,
  getActiveSession,
  getLivekitToken,
  readApiError,
  startSession,
  type LivekitToken,
} from "@/lib/api";

interface RoomShellProps {
  sessionId?: string | number;
}

type SessionState = "setup" | "busy" | "starting" | "active" | "ending" | "ended" | "error";

// Thời lượng học gợi ý (phút) khi vào phòng / học tiếp.
const DURATION_PRESETS = [15, 25, 45, 60, 90];
const MIN_MINUTES = 1;
const MAX_MINUTES = 600;

function formatMinutes(m: number): string {
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h${rest.toString().padStart(2, "0")}` : `${h} giờ`;
}

// Backend trả 400 kèm thông báo khi user đã có phiên đang chạy. Nhận diện qua
// nội dung message để phân biệt với các lỗi 400 khác (vd phòng đầy).
function hasActiveSessionConflict(error: ApiError): boolean {
  if (error.status !== 400) return false;
  return readApiError(error).toLowerCase().includes("active study session");
}

// Màu avatar suy ra ổn định từ identity (user id) → cùng một người luôn cùng màu.
const TILE_COLORS = ["#7a9e7e", "#b5764a", "#6b8dbf", "#b06b8f", "#5f8a64", "#c9a24a"];
function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}

function initialOf(name: string): string {
  return (name.trim()[0] || "?").toUpperCase();
}

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
function HourglassIcon({ size = 26, className }: IconProps) {
  return (
    <svg {...svg(size, className)}>
      <path d="M6 2h12M6 22h12" />
      <path d="M7 2c0 4.5 3.2 5.5 5 7 1.8-1.5 5-2.5 5-7" />
      <path d="M7 22c0-4.5 3.2-5.5 5-7 1.8 1.5 5 2.5 5 7" />
    </svg>
  );
}

/* ── LiveKit tiles / dock / members (chỉ render bên trong <LiveKitRoom>) ── */

// Một ô video cho một participant. Nguồn = camera track (hoặc placeholder khi
// người đó tắt cam). Chính mình được lật gương (-scale-x) như chuẩn app gọi video.
function LiveTile({ trackRef }: { trackRef: ReturnType<typeof useTracks>[number] }) {
  const p = trackRef.participant;
  const isSelf = p.isLocal;
  const name = p.name || p.identity;
  const hasVideo =
    trackRef.source === Track.Source.Camera &&
    !!trackRef.publication &&
    !trackRef.publication.isMuted;
  const micOff = !p.isMicrophoneEnabled;

  return (
    <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-[#e8e6df] bg-[#f1f0ea]">
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className={`absolute inset-0 h-full w-full object-cover ${isSelf ? "-scale-x-100" : ""}`}
        />
      ) : (
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: colorFor(p.identity) }}
        >
          {initialOf(name)}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/35 to-transparent px-3 py-2">
        <span className="text-xs font-medium text-white drop-shadow">
          {name}
          {isSelf && " (Bạn)"}
        </span>
        <span className="flex items-center gap-1">
          {micOff && (
            <span className="relative rounded-full bg-white/85 p-1 text-[#b45454]">
              <MicIcon size={13} />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <SlashIcon size={18} />
              </span>
            </span>
          )}
          {!hasVideo && (
            <span className="rounded-full bg-white/85 p-1 text-[#6b6b66]">
              <CameraIcon size={13} />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// Lưới participant thật. withPlaceholder → mỗi người trong phòng có đúng 1 ô kể
// cả khi họ tắt camera.
function LiveTiles() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });
  const state = useConnectionState();

  if (state !== ConnectionState.Connected && tracks.length === 0) {
    return (
      <div className="bg-[#fbfaf6] p-4">
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[#e0ddd3] bg-[#f1f0ea] text-sm text-[#b0aea6]">
          {state === ConnectionState.Connecting || state === ConnectionState.Reconnecting
            ? "Đang kết nối video…"
            : "Chưa kết nối video."}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfaf6] p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tracks.map((tr) => (
          <LiveTile key={`${tr.participant.identity}-${tr.source}`} trackRef={tr} />
        ))}
      </div>
    </div>
  );
}

// Dock điều khiển: bật/tắt cam & mic của chính mình qua LiveKit, và toàn màn hình.
function LiveDock({
  isFullscreen,
  onToggleFullscreen,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } = useLocalParticipant();
  const toast = useToast();

  const toggleCam = useCallback(async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch {
      toast.error("Không thể bật camera", "Hãy kiểm tra quyền truy cập camera của trình duyệt.");
    }
  }, [localParticipant, isCameraEnabled, toast]);

  const toggleMic = useCallback(async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      toast.error("Không thể bật mic", "Hãy kiểm tra quyền truy cập micro của trình duyệt.");
    }
  }, [localParticipant, isMicrophoneEnabled, toast]);

  return (
    <footer className="flex items-center justify-center gap-3 border-t border-[#efece4] px-5 py-4">
      <DockButton
        active={isCameraEnabled}
        onClick={() => void toggleCam()}
        label={isCameraEnabled ? "Tắt camera" : "Bật camera"}
        icon={<CameraIcon />}
        off={!isCameraEnabled}
      />
      <DockButton
        active={isMicrophoneEnabled}
        onClick={() => void toggleMic()}
        label={isMicrophoneEnabled ? "Tắt mic" : "Bật mic"}
        icon={<MicIcon />}
        off={!isMicrophoneEnabled}
      />
      <DockButton
        active={isFullscreen}
        onClick={onToggleFullscreen}
        label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        icon={isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
      />
    </footer>
  );
}

// Danh sách thành viên thật trong phòng LiveKit.
function LiveMembers() {
  const participants = useParticipants();
  return (
    <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b19]">
          <UsersIcon className="text-[#5f8a64]" />
          Thành viên
        </h2>
        <span className="rounded-full bg-[#eef4ef] px-2.5 py-0.5 text-xs font-medium text-[#4f6b53]">
          {participants.length} đang học
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {participants.map((p) => (
          <LiveMemberRow key={p.identity} p={p} />
        ))}
        {participants.length === 0 && (
          <li className="text-xs text-[#b0aea6]">Chưa có ai trong phòng.</li>
        )}
      </ul>
    </div>
  );
}

function LiveMemberRow({ p }: { p: Participant }) {
  const name = p.name || p.identity;
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: colorFor(p.identity) }}
        >
          {initialOf(name)}
        </span>
        <div>
          <div className="text-sm font-medium text-[#1b1b19]">
            {name}
            {p.isLocal && " (Bạn)"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6b6b66]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7a9e7e]" />
            {p.isMicrophoneEnabled ? "Đang bật mic" : "Đang tập trung"}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── Fallback khi LiveKit chưa sẵn sàng (đang tải token / chưa cấu hình) ── */

function FallbackTiles({ error }: { error: boolean }) {
  return (
    <div className="bg-[#fbfaf6] p-4">
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[#e0ddd3] bg-[#f1f0ea] px-4 text-center text-sm text-[#b0aea6]">
        {error
          ? "Video chưa sẵn sàng - LiveKit chưa được cấu hình trên server."
          : "Đang chuẩn bị video…"}
      </div>
    </div>
  );
}

function FallbackDock({
  isFullscreen,
  onToggleFullscreen,
}: {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <footer className="flex items-center justify-center gap-3 border-t border-[#efece4] px-5 py-4">
      <DockButton active={false} label="Bật camera" icon={<CameraIcon />} off />
      <DockButton active={false} label="Bật mic" icon={<MicIcon />} off />
      <DockButton
        active={isFullscreen}
        onClick={onToggleFullscreen}
        label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        icon={isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
      />
    </footer>
  );
}

function FallbackMembers({ count, error }: { count: number; error: boolean }) {
  return (
    <div className="rounded-3xl border border-[#e8e6df] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b19]">
          <UsersIcon className="text-[#5f8a64]" />
          Thành viên
        </h2>
        <span className="rounded-full bg-[#eef4ef] px-2.5 py-0.5 text-xs font-medium text-[#4f6b53]">
          {count} đang học
        </span>
      </div>
      <p className="mt-3 text-xs text-[#b0aea6]">
        {error
          ? "Danh sách thời gian thực cần LiveKit - đang dùng số liệu từ server."
          : "Đang kết nối phòng…"}
      </p>
    </div>
  );
}

const STATUS: Record<SessionState, { label: string; dot: string; cls: string }> = {
  setup: { label: "Chọn thời lượng", dot: "#c9a24a", cls: "border-[#ecdfb8] bg-[#f7f1e0] text-[#8a6d2f]" },
  busy: { label: "Đang học phòng khác", dot: "#c9a24a", cls: "border-[#ecdfb8] bg-[#f7f1e0] text-[#8a6d2f]" },
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
  // Chưa đăng nhập không vào được phòng (các API dưới đều cần token). null = chưa
  // kiểm tra (render null để tránh chớp UI trước khi redirect).
  const [authOk, setAuthOk] = useState<boolean | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("starting");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Tab đang mở ở panel bên phải khi toàn màn hình: trợ lý Bo hoặc ghi chú nhanh.
  const [fsPanel, setFsPanel] = useState<"bo" | "notes">("bo");
  // Độ rộng (px) panel bên phải khi toàn màn hình - kéo được, nhớ ở localStorage.
  const PANEL_MIN = 280;
  const PANEL_DEFAULT = 384;
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT);
  const panelWidthRef = useRef(PANEL_DEFAULT);
  useEffect(() => {
    const v = Number(window.localStorage.getItem("room-panel-width"));
    if (v >= PANEL_MIN) {
      setPanelWidth(v);
      panelWidthRef.current = v;
    }
  }, []);
  // Bắt đầu kéo cạnh trái panel: cập nhật độ rộng theo con trỏ tới khi thả.
  const startPanelResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const onMove = (ev: PointerEvent) => {
      const max = Math.round(window.innerWidth * 0.75);
      const w = Math.min(Math.max(window.innerWidth - ev.clientX, PANEL_MIN), max);
      panelWidthRef.current = w;
      setPanelWidth(w);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.localStorage.setItem("room-panel-width", String(panelWidthRef.current));
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);
  const [focusMinutes, setFocusMinutes] = useState(0);
  // Thời lượng đếm ngược (giây) của phiên hiện tại, do người dùng chọn.
  const [targetSeconds, setTargetSeconds] = useState<number | null>(null);
  // Hộp thoại "Học tiếp?" khi hết giờ đếm ngược.
  const [showContinue, setShowContinue] = useState(false);
  // Id phòng đang có phiên chạy khác phòng này (nếu có) - chặn học chồng phiên.
  const [otherRoomId, setOtherRoomId] = useState<number | null>(null);
  // Kết nối LiveKit (token + wss URL) cho phòng này. null khi chưa lấy được:
  // đang tải, hoặc LiveKit chưa cấu hình trên server (khi đó lkError=true → fallback).
  const [lk, setLk] = useState<LivekitToken | null>(null);
  const [lkError, setLkError] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  // Mốc thời gian thực khi phiên bắt đầu (= session.started_at). Timer suy ra
  // thời gian còn lại từ mốc này nên khôi phục đúng sau khi chuyển trang/refresh.
  const [epochMs, setEpochMs] = useState<number | null>(null);
  const startRequested = useRef(false);
  const endRequested = useRef(false);
  // Cờ đánh dấu đang CHỦ ĐỘNG rời phòng (qua nút "Rời phòng") → tạm bỏ chặn điều hướng.
  const leavingRef = useRef(false);
  // Chống spam toast cảnh báo khi chặn điều hướng, và chỉ báo "đã khóa" một lần.
  const lastWarnRef = useRef(0);
  const guardAnnouncedRef = useRef(false);
  // Số phút focus do Timer báo về (đã trôi, chặn ở thời lượng dự kiến); dùng ref
  // để finishSession/handleLeave luôn đọc được giá trị mới nhất.
  const focusMinutesRef = useRef(0);

  // Ghi chú nhanh - nâng state lên đây để sidebar và panel toàn màn hình dùng
  // CHUNG một nguồn, không lệch nội dung khi chuyển qua lại. Tự lưu localStorage
  // theo từng phòng (debounce).
  const notesKey = `room-notes:${String(sessionId ?? "default")}`;
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const notesLoaded = useRef(false);
  useEffect(() => {
    setNotes(window.localStorage.getItem(notesKey) ?? "");
    setNotesSaved(true);
    notesLoaded.current = true;
  }, [notesKey]);
  useEffect(() => {
    if (!notesLoaded.current) return;
    setNotesSaved(false);
    const id = window.setTimeout(() => {
      window.localStorage.setItem(notesKey, notes);
      setNotesSaved(true);
    }, 600);
    return () => window.clearTimeout(id);
  }, [notes, notesKey]);

  // Guard đăng nhập: chạy trước mọi thứ. Không có token → báo và về trang đăng nhập.
  useEffect(() => {
    if (getAccessToken()) {
      setAuthOk(true);
      return;
    }
    toast.warning(
      "Bạn cần đăng nhập",
      "Hãy đăng nhập để vào phòng học. Chưa có tài khoản thì đăng ký nhé."
    );
    router.replace("/login");
  }, [router, toast]);

  useEffect(() => {
    if (!getAccessToken()) return; // chưa đăng nhập → guard sẽ redirect, đừng gọi API
    if (startRequested.current) return;
    if (sessionId === undefined) return;
    startRequested.current = true;

    (async () => {
      try {
        // Ưu tiên khôi phục phiên đang chạy để không restart từ đầu. Mốc + thời
        // lượng lấy từ backend → Timer tính đúng thời gian còn lại. (Phiên quá hạn
        // đã được backend tự đóng nên chỉ phiên còn hiệu lực mới trả về đây.)
        const active = await getActiveSession();
        if (active) {
          // Chỉ khôi phục nếu phiên đang chạy thuộc ĐÚNG phòng này. Phiên ở phòng
          // khác không được "đè" timer lên phòng này (mỗi lúc chỉ học 1 phòng).
          if (active.room === Number(sessionId)) {
            setEpochMs(Date.parse(active.started_at));
            setTargetSeconds(active.planned_minutes * 60);
            setSessionState("active");
          } else {
            setOtherRoomId(active.room);
            setSessionState("busy");
          }
          return;
        }
      } catch {
        // Lỗi khi hỏi phiên hiện tại (không phải 404) → bỏ qua, hỏi thời lượng mới.
      }

      // Chưa có phiên → cho người dùng chọn thời lượng trước khi bắt đầu đếm ngược.
      setSessionState("setup");
    })();
  }, [toast, sessionId]);

  // Xin token LiveKit cho phòng này (một lần khi biết phòng). Media đi thẳng
  // client ↔ LiveKit Cloud; nếu server chưa cấu hình LiveKit (503) → dùng fallback.
  useEffect(() => {
    if (!getAccessToken()) return; // chưa đăng nhập → guard sẽ redirect, đừng gọi API
    if (sessionId === undefined) return;
    let cancelled = false;
    getLivekitToken(sessionId)
      .then((data) => {
        if (cancelled) return;
        setLk(data);
        setLkError(false);
      })
      .catch(() => {
        if (!cancelled) setLkError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Bắt đầu một phiên mới với thời lượng người dùng chọn (đếm ngược đơn).
  const beginSession = useCallback(
    async (minutes: number) => {
      if (sessionId === undefined) return;
      setSessionState("starting");
      try {
        const session = await startSession(sessionId, minutes);
        setEpochMs(Date.parse(session.started_at));
        setTargetSeconds(session.planned_minutes * 60);
        focusMinutesRef.current = 0;
        setFocusMinutes(0);
        endRequested.current = false;
        setShowContinue(false);
        setSessionState("active");
        toast.success("Bắt đầu học", `Đếm ngược ${formatMinutes(minutes)}.`);
      } catch (error) {
        // Đã có phiên đang chạy: nếu là phiên phòng này (race) → khôi phục; nếu ở
        // phòng khác → chuyển sang trạng thái "đang học phòng khác".
        if (error instanceof ApiError && hasActiveSessionConflict(error)) {
          const active = await getActiveSession().catch(() => null);
          if (active && active.room === Number(sessionId)) {
            setEpochMs(Date.parse(active.started_at));
            setTargetSeconds(active.planned_minutes * 60);
            endRequested.current = false;
            setShowContinue(false);
            setSessionState("active");
            toast.info("Tiếp tục phiên đang mở", "Bạn đã có một phiên học đang chạy.");
            return;
          }
          if (active) {
            setOtherRoomId(active.room);
            setSessionState("busy");
            return;
          }
        }
        setSessionState("setup");
        toast.error("Không thể bắt đầu phiên", readApiError(error));
      }
    },
    [sessionId, toast],
  );

  // Timer báo số phút focus đã trôi (đã chặn ở thời lượng dự kiến). Gán thẳng,
  // đúng cả khi khôi phục phiên (Timer báo giá trị hiện tại lúc mount).
  const handleProgress = useCallback((info: TimerProgress) => {
    focusMinutesRef.current = info.focusMinutes;
    setFocusMinutes(info.focusMinutes);
  }, []);

  const finishSession = useCallback(async () => {
    if (endRequested.current || sessionState !== "active") return;
    endRequested.current = true;
    setShowContinue(false);
    setSessionState("ending");

    try {
      // Gửi số phút thực sự đã focus. Nếu chưa học phút nào (rời ngay) thì để
      // backend tự tính theo thời gian trôi.
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
    } catch (error) {
      endRequested.current = false;
      setSessionState("active");
      toast.error("Không thể kết thúc phiên", readApiError(error));
      throw error;
    }
  }, [sessionState, toast, queryClient]);

  const handleLeave = useCallback(async () => {
    try {
      await finishSession();
      // Đánh dấu rời chủ động TRƯỚC khi điều hướng để guard không chặn cú push này.
      leavingRef.current = true;
      router.push("/rooms");
    } catch {
      // Giữ user trong phòng để có thể thử kết thúc phiên lại.
    }
  }, [finishSession, router]);

  // Hết giờ đếm ngược → hỏi người dùng có học tiếp không (không tự kết thúc).
  const handleFinished = useCallback(() => {
    setShowContinue(true);
    toast.info("Hết giờ tập trung", "Bạn muốn học tiếp không?");
  }, [toast]);

  // "Học tiếp" với thời lượng mới: đóng hiệp hiện tại (ghi công phút đã học) rồi
  // mở một phiên mới. Mỗi hiệp là một phiên riêng ở backend.
  const continueSession = useCallback(
    async (minutes: number) => {
      if (endRequested.current) return;
      endRequested.current = true;
      setShowContinue(false);
      setSessionState("ending");
      try {
        const done = focusMinutesRef.current;
        await endSession(done > 0 ? done : undefined);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["daily-goal"] });
      } catch (error) {
        endRequested.current = false;
        setSessionState("active");
        setShowContinue(true);
        toast.error("Không thể lưu hiệp vừa rồi", readApiError(error));
        return;
      }
      // beginSession sẽ tự đặt lại endRequested = false và mốc/thời lượng mới.
      await beginSession(minutes);
    },
    [beginSession, queryClient, toast],
  );

  // Đang có phiên ở phòng khác: kết thúc phiên đó rồi cho chọn thời lượng học ở
  // phòng này (backend chỉ cho 1 phiên chạy mỗi lúc).
  const endOtherAndSetup = useCallback(async () => {
    setSessionState("ending");
    try {
      await endSession();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["daily-goal"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOtherRoomId(null);
      setSessionState("setup");
      toast.success("Đã kết thúc phiên trước", "Bạn có thể bắt đầu học ở phòng này.");
    } catch (error) {
      setSessionState("busy");
      toast.error("Không thể kết thúc phiên kia", readApiError(error));
    }
  }, [queryClient, toast]);

  // Đồng bộ state với trạng thái fullscreen thực (kể cả khi user nhấn Esc).
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === sceneRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void sceneRef.current?.requestFullscreen?.();
    }
  }, []);

  // Chỉ khóa điều hướng khi đồng hồ đếm ngược đang chạy (active) hoặc đang lưu
  // phiên (ending) - lúc đó rời trang mới làm mất thời gian đã học. Còn lúc
  // setup/busy (chưa bấm bắt đầu) người dùng vẫn đi lại tự do.
  const guardActive =
    authOk === true && (sessionState === "active" || sessionState === "ending");

  // Toast nhắc người dùng phải bấm "Rời phòng", có cooldown tránh spam.
  const warnBlocked = useCallback(() => {
    const now = Date.now();
    if (now - lastWarnRef.current < 2500) return;
    lastWarnRef.current = now;
    toast.warning(
      "Bạn đang ở trong phòng học",
      'Hãy nhấn "Rời phòng" để kết thúc phiên trước khi rời đi - tránh mất thời gian đã học.',
    );
  }, [toast]);

  useEffect(() => {
    if (!guardActive) {
      // Hết khóa (phiên kết thúc / quay lại setup) → hiệp sau sẽ báo lại.
      guardAnnouncedRef.current = false;
      return;
    }

    // Báo một lần mỗi khi khóa điều hướng bắt đầu có hiệu lực.
    if (!guardAnnouncedRef.current) {
      guardAnnouncedRef.current = true;
      toast.info(
        "Đã khóa rời trang",
        'Đếm ngược đã bắt đầu - bạn chỉ có thể ra ngoài bằng nút "Rời phòng" để không mất thời gian đã học.',
      );
    }

    // 1) Đóng tab / tải lại / đóng trình duyệt → hộp thoại xác nhận gốc của trình duyệt.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    // 2) Nút back/forward → đẩy lại một entry để giữ nguyên trang phòng + nhắc.
    const onPopState = () => {
      if (leavingRef.current) return;
      window.history.pushState(null, "", window.location.href);
      warnBlocked();
    };

    // 3) Bấm vào bất kỳ link điều hướng nội bộ nào (Link/<a>) → chặn ở pha capture.
    const onClickCapture = (e: MouseEvent) => {
      if (leavingRef.current || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      // Bỏ qua neo trong trang, mở tab mới, tải xuống, mailto/tel…
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (/^(mailto:|tel:)/i.test(href)) return;
      e.preventDefault();
      e.stopPropagation();
      warnBlocked();
    };

    // Chốt sẵn một entry lịch sử để bắt được lần bấm back đầu tiên.
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [guardActive, warnBlocked, toast]);

  const status = STATUS[sessionState];
  const isLive = sessionState === "active" || sessionState === "ending";
  const leaveDisabled = sessionState === "starting" || sessionState === "ending";

  const content = (
    <div
      className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* ── Scene ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col lg:col-span-2">
        <div
          ref={sceneRef}
          className={
            isFullscreen
              ? "flex h-screen w-screen flex-row overflow-hidden bg-white"
              : "flex flex-col overflow-hidden rounded-3xl border border-[#e8e6df] bg-white shadow-sm"
          }
        >
          {/* Cột video - chiếm hết bề ngang lúc thường, chia sẻ với panel khi fullscreen */}
          <div className="flex min-w-0 flex-1 flex-col">
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

            {/* Lưới participant tiles - giãn đầy chiều cao khi fullscreen */}
            <div className={isFullscreen ? "min-h-0 flex-1 overflow-y-auto" : ""}>
              {lk ? <LiveTiles /> : <FallbackTiles error={lkError} />}
            </div>

            {/* Control dock */}
            {lk ? (
              <LiveDock isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
            ) : (
              <FallbackDock isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
            )}
          </div>

          {/* Thanh kéo đổi độ rộng panel - chỉ khi toàn màn hình */}
          {isFullscreen && (
            <div
              onPointerDown={startPanelResize}
              onDoubleClick={() => {
                setPanelWidth(PANEL_DEFAULT);
                panelWidthRef.current = PANEL_DEFAULT;
                window.localStorage.setItem("room-panel-width", String(PANEL_DEFAULT));
              }}
              role="separator"
              aria-orientation="vertical"
              title="Kéo để đổi độ rộng · nhấp đúp để đặt lại"
              className="group relative w-1.5 shrink-0 cursor-col-resize touch-none bg-[#efece4] transition-colors hover:bg-[#d8e0d9]"
            >
              <span className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
                <span className="h-9 w-0.5 rounded-full bg-[#c9c6bd] transition-colors group-hover:bg-[#7a9e7e]" />
              </span>
            </div>
          )}

          {/* Panel bên phải - chỉ khi toàn màn hình: chat Bo + ghi chú nhanh */}
          {isFullscreen && (
            <aside
              style={{ width: panelWidth }}
              className="flex shrink-0 flex-col bg-[#f5f3ec]">
              {/* Tabs chuyển giữa Bo và Ghi chú */}
              <div className="flex gap-1 border-b border-[#efece4] p-2">
                {([
                  { key: "bo", label: "Trợ lý Bo" },
                  { key: "notes", label: "Ghi chú" },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFsPanel(t.key)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      fsPanel === t.key
                        ? "bg-white text-[#1b1b19] shadow-sm"
                        : "text-[#8a8a83] hover:bg-white/60 hover:text-[#1b1b19]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Nội dung - mount cả hai, chỉ ẩn/hiện để giữ nguyên trạng thái */}
              <div className="min-h-0 flex-1 p-3">
                <div className={`h-full ${fsPanel === "bo" ? "" : "hidden"}`}>
                  <BoChat focusMinutes={focusMinutes} roomId={sessionId} />
                </div>
                <div className={`h-full overflow-y-auto ${fsPanel === "notes" ? "" : "hidden"}`}>
                  <QuickNotes value={notes} onChange={setNotes} saved={notesSaved} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="flex flex-col gap-5">
        {/* Bảng điều khiển phiên - timer + rời phòng gọn trên cùng */}
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

          {sessionState === "busy" ? (
            <div className="mt-3">
              <p className="text-sm text-[#6b6b66]">
                Bạn đang có một phiên học ở phòng khác. Mỗi lúc chỉ học được một
                phòng - hãy quay lại phòng đó, hoặc kết thúc để học ở đây.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {otherRoomId !== null && (
                  <button
                    type="button"
                    onClick={() => router.push(`/rooms/${otherRoomId}`)}
                    className="w-full rounded-full bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f]"
                  >
                    Về phòng đang học
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void endOtherAndSetup()}
                  className="w-full rounded-full border border-[#e0ddd3] bg-[#fbfaf6] px-4 py-2 text-sm font-medium text-[#4f6b53] transition hover:border-[#7a9e7e] hover:bg-[#eef4ef]"
                >
                  Kết thúc phiên kia &amp; học ở đây
                </button>
              </div>
            </div>
          ) : sessionState === "setup" ? (
            <p className="mt-3 text-sm text-[#6b6b66]">
              Hãy chọn thời lượng trong hộp thoại để bắt đầu đồng hồ Pomodoro
              đếm ngược.
            </p>
          ) : isLive && epochMs !== null && targetSeconds !== null ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Timer
                key={epochMs}
                epochMs={epochMs}
                targetSeconds={targetSeconds}
                onProgress={handleProgress}
                onFinished={handleFinished}
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

        {/* Thành viên (LiveKit thật, hoặc fallback khi chưa sẵn sàng) */}
        {lk ? (
          <LiveMembers />
        ) : (
          <FallbackMembers count={room?.active_user_count ?? 0} error={lkError} />
        )}

        {/* Ghi chú nhanh */}
        <QuickNotes value={notes} onChange={setNotes} saved={notesSaved} />
      </aside>

      {/* Checklist công việc - nút nổi góc phải, mở popover (API /api/v1/todos/) */}
      <TodoWidget />

      {/* Hộp thoại thiết lập thời lượng - hiện ngay khi vào phòng, chọn xong bấm
          OK để bắt đầu đồng hồ Pomodoro đếm ngược. */}
      {sessionState === "setup" && (
        <div className="modalOverlay fixed inset-0 z-50 flex items-center justify-center bg-[#1b1b19]/45 p-4">
          <div className="modalCard w-full max-w-sm overflow-hidden rounded-[28px] border border-[#ece9e1] bg-white shadow-[0_30px_80px_-30px_rgba(27,27,25,0.55)]">
            {/* Đầu hộp thoại - icon + tiêu đề trên nền gradient nhẹ */}
            <div className="bg-linear-to-b from-[#f1f6f1] to-white px-6 pt-7 pb-5 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#5f8a64] shadow-sm ring-1 ring-[#dfeae0]">
                <HourglassIcon className="hourglassFlip" />
              </span>
              <h3 className="mt-3.5 text-lg font-bold tracking-tight text-[#1b1b19]">
                Thiết lập phiên tập trung
              </h3>
              <p className="mx-auto mt-1.5 max-w-[16rem] text-sm leading-relaxed text-[#6b6b66]">
                Chọn thời lượng để bắt đầu đồng hồ Pomodoro đếm ngược.
              </p>
            </div>

            {/* Thân - chọn thời lượng + hành động */}
            <div className="px-6 pb-6">
              <DurationPicker actionLabel="Bắt đầu tập trung" onPick={(m) => void beginSession(m)} />
              <button
                type="button"
                onClick={() => void handleLeave()}
                className="mt-2.5 w-full rounded-2xl px-4 py-2.5 text-sm font-medium text-[#a8503a] transition-colors hover:bg-[#f8ece6]"
              >
                Rời phòng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại "Học tiếp?" khi hết giờ đếm ngược */}
      {showContinue && (
        <div className="modalOverlay fixed inset-0 z-50 flex items-center justify-center bg-[#1b1b19]/45 p-4">
          <div className="modalCard w-full max-w-sm rounded-3xl border border-[#e8e6df] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold tracking-tight text-[#1b1b19]">
              Hết giờ tập trung 🎉
            </h3>
            <p className="mt-1 text-sm text-[#6b6b66]">
              {focusMinutes > 0 ? `Bạn vừa học ${formatMinutes(focusMinutes)}. ` : ""}
              Muốn học tiếp thì chọn thời lượng cho hiệp tiếp theo nhé.
            </p>
            <div className="mt-4">
              <DurationPicker
                actionLabel="Học tiếp"
                disabled={sessionState === "ending"}
                onPick={(m) => void continueSession(m)}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleLeave()}
              disabled={sessionState === "ending"}
              className="mt-3 w-full rounded-full border border-[#e7c6b8] bg-[#f8ece6] px-4 py-2 text-sm font-medium text-[#a8503a] transition-colors hover:bg-[#f3ddd2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Kết thúc &amp; rời phòng
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Chưa xác thực xong (hoặc đang redirect vì chưa đăng nhập) → chưa render phòng.
  if (!authOk) return null;

  // Khi có token LiveKit → bọc toàn bộ trong <LiveKitRoom> để scene, dock và
  // danh sách thành viên cùng chia sẻ context realtime. connect + audio/video=false:
  // vào phòng ở trạng thái tắt cam/mic, người dùng tự bật qua dock. `contents` để
  // div bọc không phá layout lưới bên trong. Chưa có token → render fallback thẳng.
  return lk ? (
    <LiveKitRoom
      serverUrl={lk.url}
      token={lk.token}
      connect
      audio={false}
      video={false}
      className="contents"
      onError={(e) => console.error("LiveKit error:", e)}
    >
      {content}
      <RoomAudioRenderer />
    </LiveKitRoom>
  ) : (
    content
  );
}

/* ── Sub-components ───────────────────────────────────────────────────── */

// Chọn thời lượng học: chọn preset (hoặc nhập số phút tuỳ ý), highlight lựa chọn
// đang chọn, rồi bấm nút chính để xác nhận bắt đầu.
function DurationPicker({
  actionLabel,
  onPick,
  disabled = false,
}: {
  actionLabel: string;
  onPick: (minutes: number) => void;
  disabled?: boolean;
}) {
  // Preset đang chọn (mặc định 25 phút - nhịp Pomodoro kinh điển).
  const [preset, setPreset] = useState<number>(25);
  const [custom, setCustom] = useState("");
  const customVal = parseInt(custom, 10);
  const customValid =
    Number.isFinite(customVal) && customVal >= MIN_MINUTES && customVal <= MAX_MINUTES;
  // Ô "số phút khác" có giá trị hợp lệ thì ưu tiên nó; ngược lại dùng preset.
  const chosen = customValid ? customVal : preset;
  const canStart = !disabled && chosen >= MIN_MINUTES && chosen <= MAX_MINUTES;

  return (
    <div>
      {/* Preset dạng lưới, ô đang chọn được tô nổi bật */}
      <div className="grid grid-cols-3 gap-2">
        {DURATION_PRESETS.map((m) => {
          const active = !customValid && preset === m;
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => {
                setPreset(m);
                setCustom("");
              }}
              className={`rounded-2xl border px-2 py-2.5 text-sm font-semibold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-[#7a9e7e] bg-[#eef4ef] text-[#3f5a43] shadow-[inset_0_0_0_1px_rgba(122,158,126,0.5)]"
                  : "border-[#e8e6df] bg-white text-[#6b6b66] hover:border-[#c9d8cb] hover:bg-[#f7f9f6]"
              }`}
            >
              {formatMinutes(m)}
            </button>
          );
        })}

        {/* Ô nhập số phút tuỳ ý - chiếm trọn 1 hàng dưới lưới preset */}
        <div
          className={`col-span-3 flex items-center rounded-2xl border bg-white px-3 transition-colors ${
            customValid
              ? "border-[#7a9e7e] shadow-[inset_0_0_0_1px_rgba(122,158,126,0.5)]"
              : "border-[#e8e6df] focus-within:border-[#7a9e7e]"
          }`}
        >
          <input
            type="number"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            inputMode="numeric"
            value={custom}
            disabled={disabled}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Số phút khác"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#1b1b19] outline-none placeholder:text-[#b0aea6] disabled:cursor-not-allowed"
          />
          <span className="pl-2 text-xs font-medium text-[#b0aea6]">phút</span>
        </div>
      </div>

      <button
        type="button"
        disabled={!canStart}
        onClick={() => canStart && onPick(chosen)}
        className="mt-3 w-full rounded-2xl bg-[#7a9e7e] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6b8d6f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {actionLabel} · {formatMinutes(chosen)}
      </button>
    </div>
  );
}

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

/* ── Ghi chú nhanh - component trình bày, state do RoomShell giữ (dùng chung
   cho sidebar và panel toàn màn hình, tự lưu localStorage ở phía cha) ──────── */
function QuickNotes({
  value: text,
  onChange,
  saved,
}: {
  value: string;
  onChange: (value: string) => void;
  saved: boolean;
}) {
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
          onChange={(e) => onChange(e.target.value)}
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
