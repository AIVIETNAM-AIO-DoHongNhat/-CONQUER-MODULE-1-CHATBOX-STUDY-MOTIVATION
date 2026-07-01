# AIOtivation · Backend

API của **AIOtivation** — phòng học ảo giúp _học cùng nhau, giữ nhịp tập trung_. Xây bằng **Django + Django REST Framework**, xác thực JWT, cấp token realtime cho **LiveKit**.

---

## Tính năng chính

- **Xác thực** — đăng ký + xác thực **OTP qua email**, đăng nhập, đổi/khôi phục mật khẩu; phiên **JWT** (access + refresh).
- **Phòng học (rooms)** — quản lý phòng học ảo.
- **Phiên học (sessions)** — bắt đầu/kết thúc phiên trong phòng, **thời lượng dự kiến** (`planned_minutes`, mặc định 30, khoảng 1–600′), tự **đóng phiên quá hạn**, tính `focus_minutes` giới hạn theo thời lượng dự kiến & thời gian thực.
- **Video/audio realtime (LiveKit)** — endpoint ký **access token** để client kết nối thẳng tới LiveKit Cloud (media không đi qua backend).
- **Gamification (gamify)** — mục tiêu phút/ngày, chuỗi học (streak), huy hiệu, bảng xếp hạng tuần.
- **Công việc (todos)** — checklist gắn theo phiên học.
- **API docs** — OpenAPI + Swagger UI qua `drf-spectacular`.

---

## Công nghệ

| Hạng mục | Sử dụng |
|---|---|
| Framework | Django, Django REST Framework |
| Database | PostgreSQL |
| Xác thực | `djangorestframework-simplejwt` |
| Realtime | LiveKit (`livekit-api` — ký token phía server) |
| Ảnh / media | Cloudinary |
| API docs | `drf-spectacular` |
| Cấu hình | `python-dotenv` |

---

## Yêu cầu

- **Python 3.10+**
- **PostgreSQL 12+**
- `pip` (khuyến khích dùng virtualenv)

---

## Cài đặt & chạy

```sh
# 1. Cài dependencies (nên dùng virtualenv)
pip install -r requirements.txt

# 2. Tạo file .env (xem mục Biến môi trường)

# 3. Chạy migrations
python manage.py migrate

# 4. Chạy dev server (http://127.0.0.1:8000/)
python manage.py runserver
```

---

## Biến môi trường

Tạo file `.env` ở thư mục `backend` (xem đầy đủ trong [`.env.example`](./.env.example)):

```env
# Database
DATABASE_NAME=...
DATABASE_USER=...
DATABASE_PASSWORD=...
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Django / JWT
DJANGO_SECRET_KEY=...
JWT_SECRET_KEY=...
ACCESS_TOKEN_LIFETIME=1   # ngày
REFRESH_TOKEN_LIFETIME=7  # ngày

# Email (OTP đăng ký, khôi phục mật khẩu)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
DEFAULT_FROM_EMAIL=...
FRONTEND_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# LiveKit Cloud (https://cloud.livekit.io → Settings → Keys)
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://your-project.livekit.cloud
```

---

## Cấu trúc ứng dụng

| App | Vai trò |
|---|---|
| `authentication` | Đăng ký/đăng nhập, OTP email, JWT, đổi/khôi phục mật khẩu |
| `rooms` | Phòng học ảo |
| `session` | Phiên học (`planned_minutes`, tự đóng phiên quá hạn) + **token LiveKit** |
| `gamify` | Mục tiêu ngày, chuỗi học, huy hiệu, bảng xếp hạng |
| `todos` | Công việc gắn theo phiên |
| `core` | Cấu hình dự án, `settings.py`, `urls.py` |

Tất cả API nằm dưới tiền tố `/api/v1/`.

---

## LiveKit (video/audio realtime)

- **Endpoint:** `POST /api/v1/livekit/token/` với body `{ "room_id": <id> }` (yêu cầu JWT).
- **Trả về:** `{ token, url, room, identity }`. Token được **ký ở server** bằng `LIVEKIT_API_SECRET` (không lộ ra client), chỉ cho phép tham gia đúng phòng của `room_id`.
- **Media** đi thẳng client ↔ LiveKit Cloud, **không qua backend** — endpoint chỉ ký JWT (vài ms).
- Nếu thiếu cấu hình `LIVEKIT_*`, endpoint trả lỗi và frontend hiển thị "chưa kết nối video".

---

## API Documentation

Khi server đang chạy:

- **Swagger UI**: `http://127.0.0.1:8000/api/docs/`
- **OpenAPI Schema**: `http://127.0.0.1:8000/api/schema/`

---

## Chạy test

```sh
python manage.py test
```

---

## Chạy bằng Docker (tùy chọn)

Toàn bộ stack (backend + frontend + Postgres) chạy bằng `docker-compose.yaml` ở thư mục gốc dự án:

```sh
docker compose up -d
```
