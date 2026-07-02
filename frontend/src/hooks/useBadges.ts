"use client";

// Bộ sưu tập huy hiệu của user: tất cả badge active kèm trạng thái mở/chưa mở.
// Theo pattern useLeaderboard (useQuery + queryKey, chỉ chạy khi đã đăng nhập).

import { useQuery } from "@tanstack/react-query";
import { getBadges, getAccessToken } from "@/lib/api";

export function useBadges() {
  return useQuery({
    queryKey: ["badges"] as const,
    queryFn: () => getBadges(),
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    retry: false,
    staleTime: 60 * 1000,
  });
}
