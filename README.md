# AIOtivation · Frontend

Giao diện web của **AIOtivation** - phòng học ảo giúp bạn _học cùng nhau, giữ nhịp tập trung_. Xây bằng **Next.js (App Router) + React + TypeScript + Tailwind CSS v4**, kết nối backend Django REST.

---

## Tính năng chính

- **Phòng học ảo** - vào phòng, **gọi video/mic realtime** cùng thành viên (LiveKit), **đồng hồ đếm ngược** theo thời lượng dự kiến (preset 15/25/45/60/90′), ghi chú nhanh tự lưu.
- **Công việc (Todos)** - checklist gắn theo phiên học, nút nổi mở nhanh ở mọi nơi.
- **Mục tiêu & chuỗi học** - đặt mục tiêu phút/ngày, theo dõi **streak** kiểu Duolingo + lịch đóng góp kiểu GitHub.
- **Bảng xếp hạng tuần** - podium top 3 + vị trí của bạn, tính theo tổng thời gian tập trung.
- **Huy hiệu** - bộ sưu tập thành tích: badge đã mở thì sáng, chưa mở thì mờ kèm điều kiện.
- **Bo** - linh vật "giữ lửa": nút nổi chat động viên, có trạng thái _đang nghĩ_, xuất hiện ở mọi trang.

---

## Công nghệ

| Hạng mục | Sử dụng |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Data fetching / cache | TanStack Query v5 |
| Video/audio realtime | LiveKit (`@livekit/components-react`, `livekit-client`) |
| Ngôn ngữ | TypeScript 5 |
| Font | Be Vietnam Pro, Geist (next/font) |

---

## Yêu cầu

- **Node.js >= 20** (đã test trên 22) và **npm >= 10**
- Backend đang chạy (mặc định tại `http://localhost:8000`)

> Chi tiết thư viện xem [`DEPENDENCIES.md`](./DEPENDENCIES.md) hoặc nguồn chính [`package.json`](./package.json).

---

## Cài đặt & chạy

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file môi trường .env (xem mục Biến môi trường bên dưới)

# 3. Chạy dev (http://localhost:3000)
npm run dev
```

### Scripts

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy server phát triển (hot reload) |
| `npm run build` | Build production |
| `npm run start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra ESLint |

---

## Biến môi trường

Tạo file `.env` (hoặc `.env.local`) ở thư mục `frontend`:

```env
# URL gốc của backend Django (DRF). Tiền tố NEXT_PUBLIC_ để client đọc được.
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Cấu trúc thư mục

```
src/
├─ app/
│  ├─ (auth)/              # Nhóm route xác thực (không có Header/Footer)
│  │  ├─ layout.tsx        #   Guard: đã đăng nhập thì redirect về trang chủ
│  │  ├─ login/            #   Đăng nhập
│  │  ├─ register/         #   Đăng ký + xác thực OTP (2 bước)
│  │  └─ forgot-password/  #   Quên / đặt lại mật khẩu
│  ├─ (app)/               # Nhóm route ứng dụng (có Header + Footer)
│  │  ├─ page.tsx          #   Trang chủ (landing)
│  │  ├─ about/            #   Về chúng tôi
│  │  ├─ profile/          #   Hồ sơ + chuỗi học (StreakGrid) + huy hiệu (BadgeGrid)
│  │  ├─ rooms/            #   Phòng học (Pomodoro, ghi chú, thành viên)
│  │  ├─ leaderboard/      #   Bảng xếp hạng tuần (podium top 3)
│  │  └─ todos/            #   Công việc
│  ├─ (app)/layout.tsx     # Header + Footer + BoWidget (nút nổi chat Bo)
│  ├─ layout.tsx           # Layout gốc + font + Providers
│  └─ globals.css          # Tailwind + keyframes (toast, auth, bo, …)
├─ components/
│  ├─ Header.tsx           # Điều hướng + avatar + chuỗi/mục tiêu nhanh
│  ├─ BoWidget.tsx         # Nút nổi mở chat với Bo (mọi trang)
│  ├─ BoChat.tsx, BoMascot.tsx       # Khung chat + avatar linh vật Bo
│  ├─ Timer.tsx, RoomShell.tsx       # Đồng hồ đếm ngược + khung phòng học (video LiveKit)
│  ├─ TodoList.tsx, TodoWidget.tsx   # Checklist công việc (+ nút nổi)
│  ├─ DailyGoal.tsx, HeaderDailyGoal.tsx, HeaderStreak.tsx  # Mục tiêu phút/ngày + chuỗi
│  ├─ StreakGrid.tsx, StreakCalendar.tsx  # Lịch chuỗi học (GitHub / lịch)
│  ├─ BadgeGrid.tsx        # Bộ sưu tập huy hiệu (mở/chưa mở + điều kiện)
│  ├─ Toast.tsx            # Hệ thống thông báo dùng chung (useToast)
│  ├─ Providers.tsx        # QueryClientProvider + ToastProvider
│  ├─ AuthShell.tsx, Footer.tsx
│  └─ icons.tsx, Logo.tsx, Reveal.tsx, …
├─ hooks/
│  ├─ useAuth.ts           # login / register / verify / reset (TanStack mutation)
│  ├─ useProfile.ts        # đọc & cập nhật hồ sơ
│  ├─ useRooms.ts          # danh sách / chi tiết phòng
│  ├─ useTodos.ts          # CRUD công việc (optimistic update)
│  ├─ useDailyGoal.ts      # mục tiêu phút/ngày + lịch sử chuỗi
│  ├─ useLeaderboard.ts    # bảng xếp hạng tuần
│  └─ useBadges.ts         # bộ sưu tập huy hiệu
└─ lib/
   └─ api.ts               # API client + quản lý token + auto-refresh + token LiveKit
```

---

## Xác thực & token

- Đăng nhập lưu **access + refresh token** vào `localStorage` ([`lib/api.ts`](./src/lib/api.ts)).
- `apiFetch` tự gắn `Authorization: Bearer`; khi gặp **401** sẽ **tự gọi `refresh-token/`** (single-flight) rồi thử lại 1 lần. Refresh hỏng → xoá token.
- `Header` hiển thị **avatar + menu** khi đã đăng nhập, ngược lại hiện **Đăng nhập / Đăng ký**.

## Thông báo (Toast)

Dùng ở bất kỳ client component nào:

```tsx
import { useToast } from "@/components/Toast";

const toast = useToast();
toast.success("Đăng nhập thành công", "Chào mừng bạn quay lại 👋");
toast.error("Có lỗi", "Email hoặc mật khẩu không đúng.");
```

---

## Video/audio realtime (LiveKit)

- Trong phòng học, client xin **token** qua `getLivekitToken(roomId)` ([`lib/api.ts`](./src/lib/api.ts)); backend ký token và trả kèm `wss URL`.
- Media (video/mic) đi **thẳng client ↔ LiveKit Cloud**, không qua backend. `RoomShell` render tile video, dock bật/tắt cam-mic & toàn màn hình.
- Không cần biến môi trường ở frontend - cấu hình `LIVEKIT_*` nằm ở **backend**. Nếu backend chưa cấu hình, khung video sẽ báo chưa kết nối.

---

## Quy ước

- Component tương tác cần `"use client"`; trang tĩnh để mặc định (server component).
- Token/đường dẫn API tập trung ở `lib/api.ts` - không gọi `fetch` rải rác.
- Bảng màu thương hiệu: nền `#f7f6f1`, chữ `#1b1b19`, sage `#7a9e7e`, terracotta `#b5764a`.

---

## Chạy bằng Docker (tùy chọn)

Toàn bộ stack (frontend + backend + Postgres) có thể chạy bằng `docker-compose.yaml` ở thư mục gốc dự án:

```bash
docker compose up -d        # frontend: http://localhost:3000
```
