"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readApiError } from "@/lib/api";
import { useLogin } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";
import AuthShell from "@/components/AuthShell";
import EyeIcon from "@/components/EyeIcon";

const fieldClass =
  "w-full rounded-xl border border-[#e0ddd3] bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-[#b0aea6] focus:border-[#1b1b19] focus:ring-2 focus:ring-[#1b1b19]/10";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const toast = useToast();

  // Vừa xác thực email xong (verify → /login?registered=1) thì báo mừng.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1") {
      toast.success("Đăng ký thành công 🎉", "Đăng nhập để bắt đầu phiên học đầu tiên.");
      window.history.replaceState(null, "", "/login");
    }
  }, [toast]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () =>
          toast.success("Đăng nhập thành công", "Chào mừng bạn quay lại 👋"),
        onError: (err) => toast.error("Đăng nhập thất bại", readApiError(err)),
      }
    );
  }

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng trở lại - tiếp tục phiên học của bạn."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-[#1b1b19] underline-offset-2 hover:underline"
          >
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#1b1b19]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ban@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[#1b1b19]"
            >
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#6b6b66] underline-offset-2 hover:text-[#1b1b19] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b66] hover:text-[#1b1b19]"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {login.isError && (
          <p
            role="alert"
            className="rounded-xl border border-[#e7c6b8] bg-[#f8ece6] px-4 py-3 text-sm text-[#a8503a]"
          >
            {readApiError(login.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="mt-2 flex items-center justify-center rounded-full bg-[#1b1b19] px-6 py-3.5 text-[15px] font-medium text-[#f7f6f1] transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </AuthShell>
  );
}
