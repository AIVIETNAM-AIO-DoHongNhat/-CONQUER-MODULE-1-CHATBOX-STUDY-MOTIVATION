# AIOtivation — Phòng học ảo giữ nhịp tập trung

Phòng học ảo giúp bạn _học cùng nhau, giữ nhịp tập trung_: video/mic realtime, đồng hồ Pomodoro, checklist, mục tiêu phút/ngày, streak, huy hiệu, bảng xếp hạng tuần — kèm linh vật **Bo** động viên ở mọi trang.

| Thư mục | Vai trò | Công nghệ |
|---|---|---|
| [`backend/`](./backend/) | REST API (`/api/v1/*`), JWT + OTP email, ký token LiveKit | Django + DRF, PostgreSQL |
| [`frontend/`](./frontend/) | Giao diện web | Next.js 16, React 19, TypeScript, Tailwind v4, TanStack Query |

**Yêu cầu:** Python 3.10+ · Node.js ≥ 20 (npm ≥ 10) · PostgreSQL 12+ (hoặc SQLite để thử nhanh, không cần cài gì).

---

## 1. Chạy backend (cổng 8000)

```bash
cd backend

python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Tạo file `backend/.env` với nội dung tối thiểu sau (dùng **SQLite**, chạy được ngay):

```env
DJANGO_SECRET_KEY=dev-secret-key
JWT_SECRET_KEY=dev-jwt-key
FRONTEND_URL=http://localhost:3000

# SQLite — thử nhanh, không cần cài database
DATABASE_ENGINE=django.db.backends.sqlite3
DATABASE_NAME=db.sqlite3
```

> Dùng **PostgreSQL** thay SQLite: bỏ dòng `DATABASE_ENGINE`, thay bằng `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST=localhost`, `DATABASE_PORT=5432` (database phải tạo trước).

Rồi chạy:

```bash
python manage.py migrate
python manage.py createsuperuser   # tạo tài khoản để đăng nhập (vì chưa bật OTP email)
python manage.py runserver
```

Backend chạy tại **http://localhost:8000** — Swagger UI: **http://localhost:8000/api/docs/**.

## 2. Chạy frontend (cổng 3000)

Mở terminal **mới**, giữ backend đang chạy:

```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env
npm run dev
```

Mở **http://localhost:3000**, đăng nhập bằng tài khoản superuser vừa tạo — **xong**.

Scripts khác: `npm run build` (build production) · `npm run start` (chạy bản build) · `npm run lint`.

---

## Tính năng tùy chọn (bật khi cần)

App chạy được ngay mà không cần các dịch vụ dưới đây — thiếu thì tính năng tương ứng tắt. Bật bằng cách thêm biến vào `backend/.env` (mẫu đầy đủ: [`backend/.env.example`](backend/.env.example)):

| Tính năng | Biến cần thêm | Ghi chú |
|---|---|---|
| **OTP email** (đăng ký, quên mật khẩu) | `EMAIL_HOST`, `EMAIL_PORT=587`, `EMAIL_USE_TLS=True`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | Gmail: dùng **App Password** |
| **Video/mic realtime** | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL=wss://…` | Lấy tại [cloud.livekit.io](https://cloud.livekit.io) → Settings → Keys. Frontend không cần biến gì |
| **Upload ảnh đại diện** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Lấy tại [cloudinary.com](https://cloudinary.com) |

## Chạy backend bằng Docker (tùy chọn)

Thay cho mục 1 — compose gồm **Postgres + backend** (frontend vẫn chạy bằng npm như mục 2):

```bash
cd backend
# Trong .env đặt: DATABASE_HOST=db, DATABASE_PORT=5432 (+ NAME/USER/PASSWORD tùy ý)
docker compose up -d --build      # backend: http://localhost:8000, tự chạy migrate
docker compose down               # dừng (thêm -v để xoá dữ liệu)
```

> Postgres expose ra host ở cổng **5433** để tránh đụng Postgres cài sẵn.

---

## Cấu trúc code

**Backend** — mỗi tính năng một app Django, API đều dưới `/api/v1/`:

| App | Vai trò |
|---|---|
| `authentication` | Đăng ký/đăng nhập, OTP email, JWT |
| `rooms` | Phòng học ảo |
| `session` | Phiên học (bắt đầu/kết thúc, tự đóng quá hạn) + token LiveKit |
| `gamify` | Mục tiêu ngày, streak, huy hiệu, bảng xếp hạng |
| `todos` | Checklist gắn theo phiên học |
| `core` | Cấu hình dự án (`settings.py`, `urls.py`) |

**Frontend** — Next.js App Router trong `frontend/src/`:

```
src/
├─ app/(auth)/      # login, register (OTP 2 bước), forgot-password
├─ app/(app)/       # trang chủ, rooms, profile, leaderboard, todos, about
├─ components/      # Header, Timer, RoomShell (video), Toast, BoWidget, …
├─ hooks/           # useAuth, useRooms, useTodos, … (TanStack Query)
└─ lib/api.ts       # API client duy nhất: token, auto-refresh 401, token LiveKit
```

Quy ước chính: mọi lời gọi API đi qua `lib/api.ts` (không `fetch` rải rác); component tương tác cần `"use client"`; thông báo dùng `useToast()` từ `components/Toast`.

## Test

```bash
# Backend (trong backend/, virtualenv đã kích hoạt)
python manage.py test        # hoặc: pytest

# Frontend (trong frontend/)
npm run lint && npm run build
```

## Sự cố thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| Frontend lỗi mạng / CORS | Backend chưa chạy hoặc `NEXT_PUBLIC_API_URL` sai (mặc định backend đã cho phép origin `http://localhost:3000`) |
| Lỗi database khi migrate | Postgres chưa chạy / `DATABASE_*` sai — hoặc chuyển sang SQLite như mục 1 |
| Không nhận email OTP | Chưa cấu hình `EMAIL_*` (Gmail cần App Password) — hoặc đăng nhập bằng superuser |
| Khung video "chưa kết nối" | Backend thiếu `LIVEKIT_*` |

## Tài liệu thêm

- [`backend/README.md`](backend/README.md) — chi tiết API, endpoint LiveKit
- [`frontend/README.md`](frontend/README.md) — chi tiết cấu trúc, xác thực & token, Toast
- **Swagger UI**: http://localhost:8000/api/docs/ · **OpenAPI schema**: http://localhost:8000/api/schema/
