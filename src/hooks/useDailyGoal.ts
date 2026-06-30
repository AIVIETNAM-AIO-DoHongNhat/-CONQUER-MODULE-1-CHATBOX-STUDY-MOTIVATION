"use client";

// Mục tiêu phút/ngày: đọc mục tiêu hôm nay + đặt target. Theo pattern useTodos
// (useQuery + queryKey, optimistic update để thanh tiến độ phản hồi tức thì).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDailyGoalToday,
  getDailyGoalHistory,
  setDailyGoalToday,
  getAccessToken,
  type DailyGoal,
} from "@/lib/api";

const KEY = ["daily-goal", "today"] as const;
const HISTORY_KEY = ["daily-goal", "history"] as const;

export function useDailyGoal() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => getDailyGoalToday(),
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    retry: false,
    staleTime: 60 * 1000,
  });
}

// Lịch chuỗi học kiểu Duolingo (N ngày gần nhất + current/longest streak).
export function useStreakHistory(days = 30) {
  return useQuery({
    queryKey: [...HISTORY_KEY, days],
    queryFn: () => getDailyGoalHistory(days),
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    retry: false,
    staleTime: 60 * 1000,
  });
}

export function useSetDailyGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetMinutes: number) => setDailyGoalToday(targetMinutes),
    onMutate: async (targetMinutes) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<DailyGoal>(KEY);
      if (prev) {
        qc.setQueryData<DailyGoal>(KEY, { ...prev, target_minutes: targetMinutes });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSuccess: (goal) => qc.setQueryData(KEY, goal),
  });
}
