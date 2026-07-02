"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRooms } from "@/hooks/useRooms";
import { useProfile } from "@/hooks/useProfile";
import { getAccessToken, readApiError, type Room } from "@/lib/api";
import { useToast } from "@/components/Toast";
import Reveal from "@/components/Reveal";
import RoomCard from "@/components/RoomCard";
import CreateRoomModal from "@/components/CreateRoomModal";
import { TargetIcon } from "@/components/icons";

export default function MyRoomsPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  // useRooms/useProfile phụ thuộc localStorage (token) → server và client khác
  // nhau lúc đầu. Chờ mounted rồi mới hiện trạng thái thật, tránh hydration lệch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: profile } = useProfile();
  const { data, isLoading: queryLoading, isError, error, refetch } = useRooms();
  const isLoading = !mounted || queryLoading;

  const rooms: Room[] = useMemo(() => data?.results ?? [], [data]);

  // Chỉ giữ phòng do chính mình tạo (owner === id của mình).
  const myRooms = useMemo(
    () => (profile ? rooms.filter((r) => r.owner === profile.id) : []),
    [rooms, profile]
  );

  function openCreate() {
    if (!getAccessToken()) {
      toast.warning(
        "Bạn cần đăng nhập",
        "Hãy đăng nhập để tạo phòng học của riêng bạn."
      );
      router.push("/login");
      return;
    }
    setShowCreate(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Tiêu đề */}
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#5f8a64]">
            Không gian của bạn
          </div>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Phòng học của tôi
          </h1>
          <p className="mt-1 text-gray-500">
            Những phòng do chính bạn tạo và quản lý.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && !isError && myRooms.length > 0 && (
            <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-sm font-medium text-[#4f6b53]">
              {myRooms.length} phòng
            </span>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tạo phòng
          </button>
        </div>
      </Reveal>

      <Reveal delay={120}>
        {/* Loading state */}
        {isLoading && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-58 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
                aria-hidden
              />
            ))}
            <div role="status" className="sr-only">
              Đang tải phòng học của bạn...
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
        {!isLoading && !isError && myRooms.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ef] text-[#5f8a64]">
              <TargetIcon size={26} />
            </span>
            <p className="mt-4 text-sm text-gray-500">
              Bạn chưa tạo phòng học nào. Tạo một phòng để bắt đầu nhé.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tạo phòng đầu tiên
            </button>
          </div>
        )}

        {/* Danh sách phòng của tôi */}
        {!isLoading && !isError && myRooms.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </Reveal>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
          }}
        />
      )}
    </div>
  );
}
