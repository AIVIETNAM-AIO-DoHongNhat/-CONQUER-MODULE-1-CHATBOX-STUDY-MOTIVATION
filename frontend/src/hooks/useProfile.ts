"use client";

// Hook đọc dữ liệu (query) mẫu - lấy hồ sơ user đang đăng nhập.
// Đây là pattern để rooms/todos sau này noi theo: useQuery + queryKey + queryFn.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  getAccessToken,
  updateProfile,
  type Profile,
  type UpdateProfilePayload,
} from "@/lib/api";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    // Chỉ gọi khi đã có access token (tránh fetch 401 lúc chưa đăng nhập).
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    // apiFetch đã tự refresh khi 401; nếu vẫn lỗi thì coi như chưa đăng nhập,
    // không cần thử lại nhiều lần.
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Cập nhật hồ sơ → ghi thẳng kết quả mới vào cache ["profile"] để UI (kể cả
// avatar ở Header) cập nhật ngay, không cần refetch.
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (res) => {
      queryClient.setQueryData<Profile>(["profile"], res.data);
    },
  });
}
