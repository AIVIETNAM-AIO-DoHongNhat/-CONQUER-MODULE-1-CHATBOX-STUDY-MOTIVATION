"use client";

// Bảng xếp hạng tuần: top N + thứ hạng của chính user. Theo pattern useDailyGoal
// (useQuery + queryKey, chỉ chạy khi đã đăng nhập).

import { useQuery } from "@tanstack/react-query";
import { getWeeklyLeaderboard, getAccessToken } from "@/lib/api";

export function useWeeklyLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ["leaderboard", "weekly", limit] as const,
    queryFn: () => getWeeklyLeaderboard(limit),
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    retry: false,
    staleTime: 60 * 1000,
  });
}
