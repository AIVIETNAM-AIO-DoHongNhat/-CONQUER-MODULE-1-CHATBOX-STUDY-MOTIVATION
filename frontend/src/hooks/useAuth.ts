"use client";

// Các hook auth - bọc hàm fetch trong lib/api bằng useMutation của TanStack Query.
// Component chỉ cần gọi hook, nhận { mutate, isPending, error } thay vì tự quản
// loading/error bằng useState. Điều hướng cố định (login → rooms...) được bake
// sẵn trong onSuccess; side-effect cục bộ của trang truyền qua mutate(vars, { onSuccess }).

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  login,
  register,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
} from "@/lib/api";

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      login(vars.email, vars.password),
    onSuccess: () => router.push("/"),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (vars: {
      email: string;
      fullName: string;
      password: string;
    }) => register(vars.email, vars.fullName, vars.password),
  });
}

export function useVerifyEmail() {
  const router = useRouter();
  return useMutation({
    mutationFn: (vars: { email: string; otp: string }) =>
      verifyEmail(vars.email, vars.otp),
    onSuccess: () => router.push("/login?registered=1"),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (vars: { email: string }) => requestPasswordReset(vars.email),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (vars: { email: string; otp: string; newPassword: string }) =>
      resetPassword(vars.email, vars.otp, vars.newPassword),
    onSuccess: () => router.push("/rooms"),
  });
}
