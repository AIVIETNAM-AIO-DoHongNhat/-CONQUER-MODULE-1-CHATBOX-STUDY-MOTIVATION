"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useRooms } from "@/hooks/useRooms";
import { readApiError, type Room } from "@/lib/api";
import {
  FlaskIcon,
  RocketIcon,
  PaletteIcon,
  TargetIcon,
} from "@/components/icons";

const PAGE_SIZE = 6;

// Phối màu + icon cho từng track, lấy đúng tông từ landing page.
type Visual = {
  Icon: typeof FlaskIcon;
  color: string;
  bg: string;
};

function getCategoryVisual(category?: string | null): Visual {
  const c = (category ?? "").toLowerCase();
  if (c.includes("research"))
    return { Icon: FlaskIcon, color: "#5f8a64", bg: "rgba(122,158,126,.14)" };
  if (c.includes("product"))
    return { Icon: RocketIcon, color: "#a86a3f", bg: "rgba(181,118,74,.14)" };
  if (c.includes("nontech") || c.includes("non-tech"))
    return { Icon: PaletteIcon, color: "#6f86a8", bg: "rgba(122,140,168,.14)" };
  return { Icon: TargetIcon, color: "#5f8a64", bg: "rgba(122,158,126,.14)" };
}

function RoomCard({ room }: { room: Room }) {
  const v = getCategoryVisual(room.category);
  const isFull = room.active_user_count >= room.max_users;
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
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f]"
      >
        {isFull ? "Vào xem" : "Join phòng"}
      </Link>
    </div>
  );
}

function RoomsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // useRooms phụ thuộc localStorage (token) nên server và client khác nhau lúc
  // đầu → hydration mismatch. Chờ mounted rồi mới hiện trạng thái thật; trước đó
  // cả hai phía đều render loading giống hệt nhau.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading: queryLoading, isError, error, refetch, isFetching } = useRooms();
  const isLoading = !mounted || queryLoading;
  const rooms: Room[] = useMemo(() => data?.results ?? [], [data]);

  const initialCategory = searchParams?.get("category") ?? "All";
  const initialQuery = searchParams?.get("q") ?? "";
  const initialPage = Number(searchParams?.get("page") ?? 1) || 1;
  const [category, setCategory] = useState<string>(initialCategory);
  const [query, setQuery] = useState<string>(initialQuery);
  const [page, setPage] = useState<number>(initialPage);

  // Danh mục lọc dựng từ chính dữ liệu thật của backend.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of rooms) {
      const c = r.category?.trim();
      if (c) set.add(c);
    }
    return ["All", ...Array.from(set).sort()];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return rooms.filter((r) => {
      const matchCategory =
        category === "All" ||
        (r.category ?? "").toLocaleLowerCase() === category.toLocaleLowerCase();
      const matchQuery = !q || r.name.toLocaleLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [rooms, category, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const displayedRooms = filteredRooms.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Đồng bộ category/q/page lên URL để chia sẻ/F5 giữ nguyên trạng thái.
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams ?? []));
    if (category === "All") params.delete("category");
    else params.set("category", category);
    const q = query.trim();
    if (!q) params.delete("q");
    else params.set("q", q);
    if (safePage <= 1) params.delete("page");
    else params.set("page", String(safePage));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, safePage]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Tiêu đề */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#5f8a64]">
            Phòng học theo track
          </div>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Chọn phòng, gặp đúng người
          </h1>
          <p className="mt-1 text-gray-500">
            Vào phòng, bật camera và để AI giữ nhịp tập trung cho bạn.
          </p>
        </div>
        {!isLoading && !isError && rooms.length > 0 && (
          <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-sm font-medium text-[#4f6b53]">
            {rooms.length} phòng đang mở
          </span>
        )}
      </div>

      {/* Thanh tìm kiếm + lọc category */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm phòng theo tên..."
            aria-label="Tìm phòng theo tên"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-9 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {categories.length > 1 && (
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo danh mục"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/20 sm:w-48"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "Tất cả danh mục" : c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-58 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
              aria-hidden
            />
          ))}
          <div role="status" className="sr-only">
            Đang tải danh sách phòng học...
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <p>{readApiError(error, "Không tải được danh sách phòng.")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2 font-medium text-red-700 transition hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredRooms.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ef] text-[#5f8a64]">
            <TargetIcon size={26} />
          </span>
          <p className="mt-4 text-sm text-gray-500">
            {rooms.length === 0
              ? "Chưa có phòng học nào. Hãy quay lại sau nhé."
              : "Không tìm thấy phòng phù hợp với bộ lọc."}
          </p>
          {rooms.length > 0 && (query || category !== "All") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
                setPage(1);
              }}
              className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-[#7a9e7e] hover:text-[#5f8a64]"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Danh sách phòng */}
      {!isLoading && !isError && displayedRooms.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      {/* Phân trang */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {filteredRooms.length} phòng{isFetching && " · đang cập nhật..."}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm transition hover:border-[#7a9e7e] disabled:opacity-50 disabled:hover:border-gray-200"
            >
              Prev
            </button>
            <div className="text-sm text-gray-600">
              Trang {safePage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm transition hover:border-[#7a9e7e] disabled:opacity-50 disabled:hover:border-gray-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500">
          Đang tải danh sách phòng học...
        </div>
      }
    >
      <RoomsPageContent />
    </Suspense>
  );
}
