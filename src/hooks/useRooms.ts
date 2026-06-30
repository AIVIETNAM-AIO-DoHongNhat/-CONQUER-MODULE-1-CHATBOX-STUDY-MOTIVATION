"use client";

// Hook đọc danh sách phòng cho trang Lobby. Theo đúng pattern của useProfile:
// useQuery + queryKey + queryFn, chỉ gọi khi đã đăng nhập (endpoint yêu cầu auth).

import { useQuery } from "@tanstack/react-query";
import { getAccessToken, getRoom, listRooms } from "@/lib/api";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => listRooms(),
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    retry: false,
    // Số người trong phòng thay đổi liên tục → giữ staleTime ngắn.
    staleTime: 30 * 1000,
  });
}

// Chi tiết một phòng cho trang /rooms/[id].
export function useRoom(id?: string | number) {
  return useQuery({
    queryKey: ["room", String(id)],
    queryFn: () => getRoom(id!),
    enabled:
      id !== undefined &&
      typeof window !== "undefined" &&
      !!getAccessToken(),
    retry: false,
    staleTime: 30 * 1000,
  });
}
