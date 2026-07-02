// Lightweight API client cho backend Django (DRF + SimpleJWT).
// Base URL lấy từ NEXT_PUBLIC_API_URL (xem .env.local).

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const AUTH = `${API_BASE}/api/v1/auth`;

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.data = data;
  }
}

// Gia hạn access token bằng refresh token. Dùng single-flight: nhiều request
// 401 cùng lúc chỉ kích hoạt MỘT lần gọi refresh, các request còn lại chờ chung.
// (SIMPLE_JWT đang để ROTATE_REFRESH_TOKENS=False nên backend chỉ trả về access mới.)
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError(401, { detail: "Thiếu refresh token" });

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${AUTH}/refresh-token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        clearTokens(); // refresh hết hạn/không hợp lệ → buộc đăng nhập lại
        throw new ApiError(res.status, await res.json().catch(() => null));
      }
      const data = await res.json();
      // Nếu sau này bật rotation, data.refresh sẽ có và được lưu kèm.
      setTokens(data.access, data.refresh);
      return data.access as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Fetch wrapper: tự gắn Bearer token; nếu 401 thì thử refresh 1 lần rồi gọi lại.
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Access hết hạn → gia hạn rồi thử lại đúng 1 lần.
  if (res.status === 401 && retryOn401 && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return apiFetch<T>(path, options, false);
    } catch {
      // refresh thất bại (đã clearTokens) → để rơi xuống và ném lỗi 401 gốc.
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// ---- Auth ----

export interface LoginResponse {
  access?: string;
  refresh?: string;
  [key: string]: unknown;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${AUTH}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  const data: LoginResponse = await res.json();
  if (data.access) setTokens(data.access, data.refresh);
  return data;
}

// Helper: POST/PUT JSON tới endpoint auth, ném ApiError nếu thất bại.
async function authPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  const res = await fetch(`${AUTH}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// Đăng ký: gửi thông tin → backend tạo PendingRegistration và gửi OTP qua email.
export async function register(
  email: string,
  fullName: string,
  password: string
): Promise<{ message?: string }> {
  return authPost("register/", { email, full_name: fullName, password });
}

// Xác thực OTP để hoàn tất đăng ký → tạo user thật.
export async function verifyEmail(
  email: string,
  otp: string
): Promise<{ message?: string }> {
  return authPost("verify-email/", { email, otp });
}

// Gửi (lại) OTP khôi phục mật khẩu tới email.
export async function requestPasswordReset(
  email: string
): Promise<{ message?: string }> {
  return authPost("resend-otp/", { email });
}

// Đặt lại mật khẩu bằng OTP → backend trả về access/refresh token và tự lưu.
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<LoginResponse> {
  const data = await authPost<LoginResponse>(
    "reset-password/",
    { email, otp, new_password: newPassword },
    "PUT"
  );
  if (data.access) setTokens(data.access, data.refresh);
  return data;
}

export interface Profile {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string | null;
  profile_picture?: string | null;
  is_verified?: boolean;
  level?: number;
  xp?: number;
  current_streak?: number;
  longest_streak?: number;
  created_at?: string;
}

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/api/v1/auth/user/profile/");
}

// Các trường người dùng được phép tự cập nhật.
export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string;
  profile_picture?: string;
}

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<{ message?: string; data: Profile }> {
  return apiFetch<{ message?: string; data: Profile }>(
    "/api/v1/auth/user/profile/update/",
    { method: "PATCH", body: JSON.stringify(payload) }
  );
}

export async function logout() {
  clearTokens();
}

// Một phiên học (session.SessionSerializer).
export interface StudySession {
  id: number;
  user: number;
  room: number;
  started_at: string;
  ended_at: string | null;
  planned_minutes: number;
  focus_minutes: number | null;
  status: "running" | "completed";
}

// Điều kiện mở khóa huy hiệu (gamify.Badge.CONDITION_CHOICES).
export type BadgeConditionType =
  | "streak_days"
  | "total_focus_minutes"
  | "total_sessions"
  | "xp"
  | "level";

export interface Badge {
  id: number;
  code: string;
  name: string;
  description: string;
  condition_type: BadgeConditionType | string;
  threshold: number;
  icon: string;
}

// Huy hiệu kèm trạng thái mở khóa của user hiện tại (gamify.UserBadgeSerializer).
// is_unlocked = đã đạt điều kiện; unlocked_at = thời điểm mở (null nếu chưa).
export interface UserBadge extends Badge {
  is_unlocked: boolean;
  unlocked_at: string | null;
}

// Toàn bộ huy hiệu đang active (đã mở + chưa mở), sắp theo condition_type rồi
// threshold. Backend trả về list thẳng, không bọc phân trang.
export function getBadges(): Promise<UserBadge[]> {
  return apiFetch<UserBadge[]>("/api/v1/badges/");
}

// Kết quả khi kết thúc phiên: backend lưu focus_minutes, cộng XP/streak và mở
// khóa huy hiệu rồi trả về tất cả.
export interface EndSessionResult {
  session: StudySession;
  daily_goal: { date: string; target_minutes: number; achieved_minutes: number };
  xp_awarded: number;
  level: number;
  streak: unknown;
  unlocked_badges: Badge[];
}

// Phiên đang chạy của user (nếu có). Backend trả 404 khi không có phiên nào →
// quy về null để caller phân biệt "không có phiên" với lỗi thật.
export async function getActiveSession(): Promise<StudySession | null> {
  try {
    return await apiFetch<StudySession>("/api/v1/sessions/active/");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// Bắt đầu phiên trong một phòng cụ thể - backend yêu cầu room_id. plannedMinutes
// là thời lượng học dự kiến do người dùng chọn (đếm ngược đơn); bỏ trống thì
// backend dùng mặc định.
export function startSession(
  roomId: string | number,
  plannedMinutes?: number,
): Promise<StudySession> {
  return apiFetch<StudySession>("/api/v1/sessions/start/", {
    method: "POST",
    body: JSON.stringify({
      room_id: roomId,
      ...(plannedMinutes !== undefined ? { planned_minutes: plannedMinutes } : {}),
    }),
  });
}

// Kết thúc phiên đang chạy. Truyền focusMinutes (số phút thực sự tập trung) để
// lưu chính xác; bỏ trống thì backend tự tính theo thời gian trôi.
export function endSession(focusMinutes?: number): Promise<EndSessionResult> {
  return apiFetch<EndSessionResult>("/api/v1/sessions/end/", {
    method: "POST",
    ...(focusMinutes !== undefined
      ? { body: JSON.stringify({ focus_minutes: focusMinutes }) }
      : {}),
  });
}

// ---- Rooms ----

// Một phòng học trả về từ backend (rooms.RoomSerializer).
export interface Room {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  max_users: number;
  is_active: boolean;
  active_user_count: number;
}

// Backend bọc list trong CustomPagination (core/pagination.py).
export interface Paginated<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Lấy danh sách phòng đang hoạt động. page_size lớn để lobby hiển thị đủ phòng
// rồi lọc/phân trang phía client; chỉnh lại nếu sau này cần phân trang server.
export function listRooms(pageSize = 100): Promise<Paginated<Room>> {
  return apiFetch<Paginated<Room>>(`/api/v1/rooms/?page_size=${pageSize}`);
}

// Chi tiết một phòng (rooms.RoomViewSet.retrieve).
export function getRoom(id: string | number): Promise<Room> {
  return apiFetch<Room>(`/api/v1/rooms/${id}/`);
}

// ---- LiveKit ----

// Token + wss URL để client kết nối realtime tới LiveKit Cloud. Backend ký token
// bằng API_SECRET (bí mật) và trả về URL; media đi thẳng client ↔ LiveKit Cloud,
// KHÔNG qua backend. `room` là tên phòng LiveKit (room-<id>), `identity` = user id.
export interface LivekitToken {
  token: string;
  url: string;
  room: string;
  identity: string;
}

// Xin token tham gia phòng LiveKit tương ứng với room hiện tại.
export function getLivekitToken(roomId: string | number): Promise<LivekitToken> {
  return apiFetch<LivekitToken>("/api/v1/livekit/token/", {
    method: "POST",
    body: JSON.stringify({ room_id: roomId }),
  });
}

// ---- Todos ----

// Một todo trả về từ backend (todos.TodoSerializer). Khi tạo trong lúc có phiên
// đang chạy, backend tự gán `session` = phiên đó → todo gắn với buổi học.
export interface Todo {
  id: number;
  title: string;
  is_done: boolean;
  order: number;
  session: number | null;
  user: number;
  created_at: string;
  updated_at: string;
}

// Backend tự lọc theo phiên đang chạy (nếu có), không thì lấy todo không gắn
// phiên. page_size lớn để lấy hết cho checklist trong phòng.
export function listTodos(pageSize = 100): Promise<Paginated<Todo>> {
  return apiFetch<Paginated<Todo>>(`/api/v1/todos/?page_size=${pageSize}`);
}

export function createTodo(title: string): Promise<Todo> {
  return apiFetch<Todo>("/api/v1/todos/", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateTodo(
  id: number,
  patch: Partial<Pick<Todo, "title" | "is_done" | "order">>
): Promise<Todo> {
  return apiFetch<Todo>(`/api/v1/todos/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteTodo(id: number): Promise<void> {
  return apiFetch<void>(`/api/v1/todos/${id}/`, { method: "DELETE" });
}

// ---- Daily goal ----

// Mục tiêu phút/ngày (gamify.DailyGoalSerializer). achieved_minutes do backend
// cộng dồn khi kết thúc phiên; chỉ target_minutes là ghi được từ client.
export interface DailyGoal {
  id: number;
  user: number;
  date: string;
  target_minutes: number;
  achieved_minutes: number;
  created_at: string;
  updated_at: string;
}

// Mục tiêu hôm nay. Backend get_or_create nên luôn trả về (0/0 nếu chưa đặt).
export function getDailyGoalToday(): Promise<DailyGoal> {
  return apiFetch<DailyGoal>("/api/v1/daily-goals/today/");
}

// Đặt/đổi mục tiêu phút cho hôm nay.
export function setDailyGoalToday(targetMinutes: number): Promise<DailyGoal> {
  return apiFetch<DailyGoal>("/api/v1/daily-goals/today/", {
    method: "POST",
    body: JSON.stringify({ target_minutes: targetMinutes }),
  });
}

// Một ngày trong lịch chuỗi (gamify.DailyGoalHistoryDaySerializer). achieved =
// đã đạt mục tiêu hôm đó → ngày này được tính vào streak (tô sáng "ngọn lửa").
export interface DailyGoalHistoryDay {
  date: string;
  target_minutes: number;
  achieved_minutes: number;
  achieved: boolean;
}

// Lịch sử chuỗi học kiểu Duolingo: số streak hiện tại/dài nhất + danh sách ngày
// (cũ → mới) để vẽ lịch ngọn lửa.
export interface DailyGoalHistory {
  current_streak: number;
  longest_streak: number;
  days: DailyGoalHistoryDay[];
}

// N ngày gần nhất tính tới hôm nay (mặc định 30, backend kẹp 1..365).
export function getDailyGoalHistory(days = 30): Promise<DailyGoalHistory> {
  return apiFetch<DailyGoalHistory>(`/api/v1/daily-goals/history/?days=${days}`);
}

// ---- Leaderboard ----

// Thông tin user gọn trong bảng xếp hạng (gamify.LeaderboardUserSerializer).
export interface LeaderboardUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  profile_picture: string | null;
  level: number;
  xp: number;
}

// Một dòng xếp hạng: thứ hạng + user + tổng phút tập trung trong tuần.
export interface LeaderboardEntry {
  rank: number;
  user: LeaderboardUser;
  total_minutes: number;
}

// Bảng xếp hạng tuần (gamify.WeeklyLeaderboardSerializer). current_user là dòng
// của chính người đang đăng nhập (kể cả khi nằm ngoài top) - null nếu tuần này
// chưa có phiên học nào được tính.
export interface WeeklyLeaderboard {
  week: { start: string; end: string };
  results: LeaderboardEntry[];
  current_user: LeaderboardEntry | null;
}

// Top `limit` người học chăm nhất tuần này (theo tổng focus_minutes).
export function getWeeklyLeaderboard(limit = 10): Promise<WeeklyLeaderboard> {
  return apiFetch<WeeklyLeaderboard>(
    `/api/v1/leaderboard/weekly/?limit=${limit}`
  );
}

// Trích thông báo lỗi gọn gàng từ response của backend (DRF) để hiển thị cho user.
export function readApiError(err: unknown, fallback = "Có lỗi xảy ra, thử lại sau."): string {
  if (err instanceof ApiError) {
    const data = err.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const first =
        obj.detail ??
        obj.message ??
        obj.non_field_errors ??
        Object.values(obj)[0];
      if (Array.isArray(first)) return String(first[0]);
      if (first) return String(first);
    }
    if (err.status === 401) return "Email hoặc mật khẩu không đúng.";
    return `Yêu cầu thất bại (mã ${err.status}).`;
  }
  return err instanceof Error ? err.message : fallback;
}

export { ApiError, API_BASE };
