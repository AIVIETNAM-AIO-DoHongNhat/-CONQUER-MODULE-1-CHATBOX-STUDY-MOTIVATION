"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/Toast";

// Bọc toàn app trong QueryClientProvider.
// QueryClient được tạo qua useState để giữ ổn định một instance suốt vòng đời
// (không tạo lại mỗi lần render), và mỗi user/tab có client riêng.
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 phút coi dữ liệu là "tươi", hạn chế refetch thừa
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
