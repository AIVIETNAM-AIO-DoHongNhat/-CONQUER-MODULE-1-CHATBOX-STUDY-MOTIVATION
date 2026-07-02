"use client";

// Khung chat với linh vật Bo: bong bóng chat (Bo trái, người dùng phải), avatar
// mascot, trạng thái "đang nghĩ" (ba chấm nhấp nháy), tự cuộn xuống cuối, gửi
// bằng Enter (Shift+Enter xuống dòng), ô nhập tự giãn cao.
//
// Hiện chưa có API Bo nên câu trả lời được tạo cục bộ (theo từ khoá) để khung
// chat hoạt động mượt. Khi có endpoint thật, chỉ cần thay `generateReply` bằng
// lời gọi API trong `sendMessage`.

import { useCallback, useEffect, useRef, useState } from "react";
import { BoMascot } from "./BoMascot";
import { chatWithBo } from "@/lib/api";

type Role = "bo" | "user";

interface ChatMsg {
  id: number;
  role: Role;
  text: string;
}

const GREETING =
  "Chào bạn! Mình là Bo - người bạn giữ lửa học tập của bạn. Hôm nay mình tiếp sức cho bạn điều gì nào? 🔥";

// Gợi ý mở đầu, chỉ hiện khi cuộc trò chuyện mới có lời chào của Bo.
const SUGGESTIONS = [
  "Mình đang mất động lực",
  "Gợi ý cách tập trung",
  "Cùng đặt mục tiêu hôm nay",
];

// Kho câu trả lời theo nhóm cảm xúc/ngữ cảnh - Bo luôn ấm áp và tiếp lửa.
const REPLIES: Record<string, string[]> = {
  empathy: [
    "Mình hiểu cảm giác đó mà. Nghỉ một hơi thật sâu nhé, rồi mình thử bắt đầu với việc nhỏ xíu trong 5 phút thôi - không cần hoàn hảo. 🌱",
    "Có những ngày khó là chuyện bình thường. Bạn đã ngồi vào bàn là đã hơn hôm qua rồi đấy. Mình làm cùng nhau từng chút một nhé!",
    "Mệt thì cứ chậm lại một chút. Chọn đúng MỘT việc quan trọng nhất hôm nay thôi, phần còn lại để sau cũng được mà.",
  ],
  celebrate: [
    "Tuyệt vời ông mặt trời! 🎉 Bạn vừa giữ thêm một mẩu lửa cho chuỗi học của mình đấy. Tự thưởng một chút rồi tiếp tục nhé!",
    "Đỉnh thật! Mỗi lần hoàn thành là một lần bạn chứng minh mình làm được. Mình tự hào về bạn ghê!",
    "Quá giỏi! Ghi lại cảm giác này để hôm nào nản còn nhớ là bạn từng làm được nha. 🔥",
  ],
  advice: [
    "Thử Pomodoro nhé: 25 phút tập trung, 5 phút nghỉ. Tắt thông báo, để điện thoại xa tầm tay, và chỉ làm một việc thôi.",
    "Bí quyết của mình: chia nhỏ tới mức không thể từ chối. Thay vì 'học chương 3', hãy là 'đọc 1 trang đầu'. Bắt đầu được là thắng một nửa!",
    "Hãy bắt đầu bằng việc dễ nhất để lấy đà. Khi não đã 'nóng máy', việc khó sẽ trôi hơn nhiều đấy.",
  ],
  greet: [
    "Hế lô! Rất vui được gặp bạn. Bạn đang muốn chinh phục môn gì hôm nay thế? 😊",
    "Chào bạn! Sẵn sàng cùng mình giữ lửa chưa nào?",
  ],
  default: [
    "Mình nghe đây! Bạn kể rõ hơn một chút để mình tiếp sức đúng chỗ nhé.",
    "Ừm, mình hiểu rồi. Mình thử biến điều đó thành một bước nhỏ làm ngay trong hôm nay nhé?",
    "Cứ từ từ thôi, mình luôn ở đây. Bạn muốn mình nhắc bạn điều gì để giữ vững phong độ?",
  ],
};

// Chọn nhóm câu trả lời theo từ khoá trong tin nhắn của người dùng.
function pickBucket(input: string): keyof typeof REPLIES {
  const t = input.toLowerCase();
  if (/(mệt|chán|nản|lười|không muốn|stress|áp lực|bỏ cuộc|khó quá)/.test(t)) return "empathy";
  if (/(xong|hoàn thành|done|đã học|làm được|qua rồi|đạt|hoàn tất)/.test(t)) return "celebrate";
  if (/(chào|hi|hello|hế lô|alo|hey)/.test(t)) return "greet";
  if (/(\?|sao|thế nào|cách|làm gì|nên|gợi ý|tập trung|mục tiêu)/.test(t)) return "advice";
  return "default";
}

// Sinh câu trả lời cục bộ, tránh lặp lại đúng câu vừa nói.
function generateReply(input: string, prev: string): string {
  const bucket = REPLIES[pickBucket(input)];
  const choices = bucket.filter((c) => c !== prev);
  const pool = choices.length ? choices : bucket;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ── Icons ─────────────────────────────────────────────────────────────── */
function SendIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function MinimizeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
    </svg>
  );
}

/* ── Bong bóng chat ────────────────────────────────────────────────────── */
function extractYoutubeId(text: string): string | null {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

function YoutubeCard({ videoId }: { videoId: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#efece4] bg-white shadow-sm w-full max-w-[280px]">
      <iframe
        width="100%"
        height="150"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="rounded-t-xl"
      />
      <div className="p-2 text-[11px] font-semibold text-[#1b1b19] flex justify-between items-center bg-[#fbfaf6]">
        <span>🎵 Nhạc nhẹ thư giãn cùng Bo</span>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#9a6b3f] hover:underline shrink-0"
        >
          Xem trên YT ↗
        </a>
      </div>
    </div>
  );
}

function MessageRow({ msg }: { msg: ChatMsg }) {
  const isBo = msg.role === "bo";
  const youtubeId = extractYoutubeId(msg.text);

  return (
    <div className={`boBubble flex items-end gap-2.5 ${isBo ? "" : "flex-row-reverse"}`}>
      {isBo && (
        <span className="mb-0.5 shrink-0">
          <BoMascot size={32} />
        </span>
      )}
      <div
        className={`max-w-[82%] whitespace-pre-wrap break-words px-4 py-2.5 text-[15px] leading-relaxed ${
          isBo
            ? "rounded-2xl rounded-bl-md bg-[#f1f0ea] text-[#1b1b19]"
            : "rounded-2xl rounded-br-md bg-[#1b1b19] text-[#f7f6f1]"
        }`}
      >
        <div>{msg.text}</div>
        {youtubeId && <YoutubeCard videoId={youtubeId} />}
      </div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="boBubble flex items-end gap-2.5">
      <span className="mb-0.5 shrink-0">
        <BoMascot size={32} thinking />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[#f1f0ea] px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="boDot h-2 w-2 rounded-full bg-[#b0aea6]"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function BoChat({
  onClose,
  focusMinutes = 0,
  roomId,
}: {
  onClose?: () => void;
  focusMinutes?: number;
  roomId?: string | number;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 0, role: "bo", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [reminderInterval, setReminderInterval] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("bo-reminder-interval") ?? "0");
  });

  const nextId = useRef(1);
  const lastBoReply = useRef("");
  const replyTimer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const lastRemindedMinute = useRef<number>(0);
  const isFirstProgress = useRef(true);

  // Lưu cấu hình nhắc nhở
  useEffect(() => {
    localStorage.setItem("bo-reminder-interval", String(reminderInterval));
  }, [reminderInterval]);

  // Khởi tạo mốc đã nhắc ban đầu để tránh bị nhắc trùng ngay khi vào phòng
  useEffect(() => {
    if (focusMinutes > 0 && isFirstProgress.current) {
      lastRemindedMinute.current = focusMinutes;
      isFirstProgress.current = false;
    }
  }, [focusMinutes]);

  // Đếm giờ và nhắc nhở giải lao
  useEffect(() => {
    if (reminderInterval > 0 && focusMinutes > 0 && focusMinutes % reminderInterval === 0) {
      if (focusMinutes !== lastRemindedMinute.current) {
        lastRemindedMinute.current = focusMinutes;
        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: "bo",
            text: `Bạn đã học tập trung được ${focusMinutes} phút rồi đó! Hãy tạm nghỉ ngơi, vươn vai thư giãn 5 phút nhé! Bo đợi bạn ở đây. ☕`
          }
        ]);
      }
    }
  }, [focusMinutes, reminderInterval]);

  // Tự cuộn xuống cuối mỗi khi có tin mới hoặc Bo bắt đầu nghĩ.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Dọn timeout đang chờ khi rời trang để khỏi setState trên component đã unmount.
  useEffect(() => () => {
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || thinking) return;

      const userMsg: ChatMsg = { id: nextId.current++, role: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setThinking(true);

      const historyToSend = messages
        .filter((m) => m.id !== 0)
        .map((m) => ({ role: m.role, text: m.text }));

      try {
        const response = await chatWithBo(text, historyToSend, focusMinutes);
        const reply = response.reply;
        lastBoReply.current = reply;
        setMessages((prev) => [...prev, { id: nextId.current++, role: "bo", text: reply }]);
      } catch (err) {
        console.error("AI Chat failed, falling back to local reply:", err);
        const reply = generateReply(text, lastBoReply.current);
        lastBoReply.current = reply;
        setMessages((prev) => [...prev, { id: nextId.current++, role: "bo", text: reply }]);
      } finally {
        setThinking(false);
      }
    },
    [messages, thinking, focusMinutes],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Tự giãn cao theo nội dung, tối đa ~5 dòng.
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }

  const showSuggestions = messages.length === 1 && !thinking;

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#e8e6df] bg-white shadow-[0_18px_44px_-30px_rgba(27,27,25,0.3)]"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      {/* Header: nhận diện Bo + trạng thái */}
      <header className="flex items-center gap-3 border-b border-[#efece4] px-5 py-3.5">
        <span className="boFloat shrink-0">
          <BoMascot size={44} thinking={thinking} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-[#1b1b19]">Bo</h2>
          <p className="flex items-center gap-1.5 text-xs text-[#8a8a83]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${thinking ? "bg-[#c9a24a]" : "bg-[#5f8a64]"}`}
            />
            {thinking ? "Bo đang nghĩ…" : "Luôn sẵn sàng tiếp lửa cho bạn"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#8a8a83]">
            <span className="font-medium shrink-0">Nhắc nghỉ:</span>
            <select
              value={reminderInterval}
              onChange={(e) => setReminderInterval(Number(e.target.value))}
              className="rounded-lg border border-[#e0ddd3] bg-white px-2 py-1 text-xs text-[#1b1b19] outline-none cursor-pointer focus:border-[#7a9e7e] transition-colors"
            >
              <option value={0}>Tắt</option>
              <option value={15}>15 phút</option>
              <option value={25}>25 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
            </select>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Thu gọn cửa sổ chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8a8a83] transition-colors hover:bg-[#f1f0ea] hover:text-[#1b1b19]"
            >
              <MinimizeIcon />
            </button>
          )}
        </div>
      </header>

      {/* Khung tin nhắn cuộn được */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#fbfaf6] px-4 py-5 sm:px-5">
        {messages.map((msg) => (
          <MessageRow key={msg.id} msg={msg} />
        ))}
        {thinking && <ThinkingRow />}
      </div>

      {/* Gợi ý mở đầu */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2 border-t border-[#efece4] bg-white px-4 pt-3 sm:px-5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-[#e7d9c6] bg-[#fdf7ee] px-3.5 py-1.5 text-sm font-medium text-[#9a6b3f] transition-colors hover:bg-[#fbeede]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Ô nhập */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-[#efece4] bg-white px-4 py-3 sm:px-5"
      >
        <div className="flex flex-1 items-end rounded-2xl border border-[#e0ddd3] bg-[#fbfaf6] px-3 py-1 transition-colors focus-within:border-[#7a9e7e] focus-within:ring-2 focus-within:ring-[#7a9e7e]/15">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Nhắn cho Bo… (Enter để gửi)"
            aria-label="Nhập tin nhắn cho Bo"
            className="max-h-[132px] w-full resize-none bg-transparent py-2 text-[15px] text-[#1b1b19] outline-none placeholder:text-[#b0aea6]"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          aria-label="Gửi tin nhắn"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1b1b19] text-[#f7f6f1] transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
