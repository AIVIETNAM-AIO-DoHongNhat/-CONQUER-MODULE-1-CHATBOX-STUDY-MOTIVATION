"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

type Room = {
  id: number | string;
  title: string;
  members?: number;
  is_open?: boolean;
  category?: string;
  track?: string;
  type?: string;
};

const CATEGORIES = ["All", "Research", "Product", "NonTech"] as const;
const PAGE_SIZE = 4;

function getCategory(room: Room) {
  return (
    room.category ||
    room.track ||
    room.type ||
    (typeof room.title === "string" ? room.title.split("·")[0].trim() : "Other")
  );
}

const SAMPLE_ROOMS: Room[] = [
  { id: "101", title: "Research · Paper Reading", category: "Research", members: 8, is_open: true },
  { id: "102", title: "Research · Data Analysis", category: "Research", members: 5, is_open: true },
  { id: "103", title: "Research · AI Seminar", category: "Research", members: 12, is_open: false },
  { id: "104", title: "Product · Sprint Study", category: "Product", members: 6, is_open: true },
  { id: "105", title: "Product · UX Workshop", category: "Product", members: 9, is_open: true },
  { id: "106", title: "Product · Case Study", category: "Product", members: 4, is_open: false },
  { id: "107", title: "NonTech · Reading Club", category: "NonTech", members: 7, is_open: true },
  { id: "108", title: "NonTech · English Corner", category: "NonTech", members: 11, is_open: true },
  { id: "109", title: "NonTech · Creative Hour", category: "NonTech", members: 3, is_open: false },
];

function RoomsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialCategory = searchParams?.get("category") ?? "All";
  const initialPage = Number(searchParams?.get("page") ?? 1) || 1;
  const [category, setCategory] = useState<string>(initialCategory);
  const [page, setPage] = useState<number>(initialPage);

  const filteredRooms = React.useMemo(() => {
    if (category === "All") return SAMPLE_ROOMS;
    return SAMPLE_ROOMS.filter(
      (room) => getCategory(room).toLocaleLowerCase() === category.toLocaleLowerCase(),
    );
  }, [category]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const displayedRooms = filteredRooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams ?? []));
    if (category === "All") params.delete("category");
    else params.set("category", category);
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [category, page]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Phòng học</h1>
      <p className="text-gray-600">Danh sách phòng học. Chọn Join để vào phòng.</p>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setPage(1);
            }}
            className={`rounded-md px-3 py-1 text-sm ${category === c ? "bg-[#7a9e7e] text-white" : "border bg-white"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div role="status" className="text-sm text-gray-500">
          Dữ liệu minh họa · API sẽ được kết nối sau
        </div>
        {displayedRooms.length === 0 && (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
            Không có phòng học thuộc category này.
          </div>
        )}
        {displayedRooms.map((room) => (
          <div key={String(room.id)} className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
              <div className="font-medium">{room.title}</div>
              <div className="text-sm text-gray-500">
                {room.members ?? 0} thành viên · {room.is_open ? "đang mở" : "đóng"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/rooms/${room.id}`} className="rounded-md bg-[#eef4ef] px-3 py-1 text-sm">
                Join
              </Link>
              <Link href={`/rooms/${room.id}`} className="text-sm text-gray-400">
                Xem chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{filteredRooms.length} phòng</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md px-3 py-1 border bg-white disabled:opacity-50"
          >
            Prev
          </button>
          <div className="text-sm">Trang {page} / {totalPages}</div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md px-3 py-1 border bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-gray-500">
          Đang tải danh sách phòng học...
        </div>
      }
    >
      <RoomsPageContent />
    </Suspense>
  );
}
