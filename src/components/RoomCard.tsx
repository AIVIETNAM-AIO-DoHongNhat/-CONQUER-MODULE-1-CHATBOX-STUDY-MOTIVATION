"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken, type Room } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { FlaskIcon, RocketIcon, PaletteIcon, TargetIcon } from "@/components/icons";

// Phối màu + icon cho từng track, lấy đúng tông từ landing page.
type Visual = {
  Icon: typeof FlaskIcon;
  color: string;
  bg: string;
};

export function getCategoryVisual(category?: string | null): Visual {
  const c = (category ?? "").toLowerCase();
  if (c.includes("research"))
    return { Icon: FlaskIcon, color: "#5f8a64", bg: "rgba(122,158,126,.14)" };
  if (c.includes("product"))
    return { Icon: RocketIcon, color: "#a86a3f", bg: "rgba(181,118,74,.14)" };
  if (c.includes("nontech") || c.includes("non-tech"))
    return { Icon: PaletteIcon, color: "#6f86a8", bg: "rgba(122,140,168,.14)" };
  return { Icon: TargetIcon, color: "#5f8a64", bg: "rgba(122,158,126,.14)" };
}

export default function RoomCard({ room }: { room: Room }) {
  const router = useRouter();
  const toast = useToast();
  const v = getCategoryVisual(room.category);
  const isFull = room.active_user_count >= room.max_users;

  // Vào phòng cần đăng nhập (RoomShell gọi API cần token). Chưa đăng nhập thì
  // chặn điều hướng, báo và đưa tới trang đăng nhập.
  function handleJoin(e: React.MouseEvent) {
    if (getAccessToken()) return; // đã đăng nhập → để Link điều hướng bình thường
    e.preventDefault();
    toast.warning(
      "Bạn cần đăng nhập",
      "Hãy đăng nhập để tham gia phòng học. Chưa có tài khoản thì đăng ký nhé."
    );
    router.push("/login");
  }
  const pct = room.max_users
    ? Math.min(100, Math.round((room.active_user_count / room.max_users) * 100))
    : 0;

  return (
    <div className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: v.bg, color: v.color }}
        >
          <v.Icon size={22} />
        </span>
        {room.category && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: v.bg, color: v.color }}
          >
            {room.category}
          </span>
        )}
      </div>

      <h3 className="mt-4 truncate text-base font-semibold text-gray-900">
        {room.name}
      </h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-500">
        {room.description?.trim() || "Không gian học tập trung cùng nhau."}
      </p>

      {/* Sức chứa */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: isFull ? "#cbd5e1" : "#7a9e7e" }}
            />
            {room.active_user_count}/{room.max_users} người
          </span>
          <span
            className="font-medium"
            style={{ color: isFull ? "#b45454" : "#5f8a64" }}
          >
            {isFull ? "Đã đầy" : "Còn chỗ"}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: isFull ? "#cbd5e1" : "#7a9e7e" }}
          />
        </div>
      </div>

      <Link
        href={`/rooms/${room.id}`}
        onClick={handleJoin}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f]"
      >
        {isFull ? "Vào xem" : "Join phòng"}
      </Link>
    </div>
  );
}
