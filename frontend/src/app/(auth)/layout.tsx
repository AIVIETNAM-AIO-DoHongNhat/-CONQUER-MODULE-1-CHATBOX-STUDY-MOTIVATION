"use client";

// Guard cho nhóm route auth (login / register / forgot-password).
// Nếu người dùng đã đăng nhập (có sẵn access_token VÀ refresh_token trong
// localStorage) thì không cho vào các trang này: báo một thông báo rồi đưa về
// trang chủ. Tránh việc đã đăng nhập mà vẫn mở lại form đăng nhập/đăng ký.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getRefreshToken } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const toast = useToast();
  // Chưa xác minh xong thì chưa render form (tránh nháy form rồi mới redirect).
  const [checked, setChecked] = useState(false);
  const redirected = useRef(false); // chặn toast/redirect lặp (StrictMode gọi effect 2 lần)

  useEffect(() => {
    if (redirected.current) return;

    // Coi là đã đăng nhập khi có cả access và refresh token.
    if (getAccessToken() && getRefreshToken()) {
      redirected.current = true;
      toast.info(
        "Bạn đã đăng nhập",
        "Không thể vào lại trang đăng nhập / đăng ký. Đang đưa bạn về trang chủ."
      );
      router.replace("/");
      return;
    }

    setChecked(true);
  }, [router, toast]);

  // Chưa xác minh xong (hoặc đang redirect) → không hiển thị form.
  if (!checked) return null;

  return <>{children}</>;
}
