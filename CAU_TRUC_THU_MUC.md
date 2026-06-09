# Phân tích Cấu trúc Thư mục Monorepo

Dự án này được tổ chức theo cấu trúc **Monorepo**, giúp quản lý tập trung mã nguồn của nhiều thành phần khác nhau trong cùng một hệ sinh thái Không gian học tập ảo. Cấu trúc được chia thành 3 mảng cốt lõi:

## 1. Front-end (`/frontend`)
- **Mục đích:** Chứa mã nguồn cho giao diện người dùng (User Interface). Đây là nơi người học tương tác trực tiếp với không gian học tập ảo và trợ lý AI.
- **Cấu trúc con đề xuất:**
  - `src/components`: Các thành phần giao diện (UI components) có thể tái sử dụng.
  - `src/pages` (hoặc `src/views`): Các màn hình chính của ứng dụng (Dashboard, Lớp học ảo, Cài đặt, v.v.).
  - `src/services`: Chứa logic gọi API kết nối đến Back-end.
  - `src/store`: Quản lý trạng thái (state) toàn cục của người học.
  - `public`: Các tài nguyên tĩnh như hình ảnh, biểu tượng, fonts.

## 2. Back-end (`/backend`)
- **Mục đích:** Xử lý logic nghiệp vụ, quản lý cơ sở dữ liệu học tập của học viên và cung cấp các API kết nối giữa hệ thống với AI cũng như Front-end.
- **Cấu trúc con đề xuất:**
  - `src/controllers`: Xử lý các yêu cầu (requests) từ phía client trả về kết quả tương ứng.
  - `src/models`: Định nghĩa cấu trúc dữ liệu, sơ đồ cơ sở dữ liệu (Database Schema).
  - `src/routes`: Khai báo và phân luồng các endpoints của API.
  - `src/services`: Logic xử lý nghiệp vụ chính, bảo mật, và xác thực người dùng.

## 3. Training AI (`/ai_training`)
- **Mục đích:** Phân hệ nghiên cứu, phát triển và huấn luyện "trợ lý AI thông minh". Được tổ chức theo tiêu chuẩn MLOps và Data Science của doanh nghiệp nhằm đảm bảo khả năng tái tạo (reproducibility), dễ bảo trì và mở rộng.
- **Cấu trúc con đề xuất:**
  - `config/`: Chứa các file cấu hình (YAML, JSON) cho quá trình huấn luyện và đánh giá.
  - `data/`: 
    - `raw/`: Dữ liệu thô nguyên bản, không bao giờ được phép chỉnh sửa trực tiếp.
    - `processed/`: Dữ liệu đã qua làm sạch, biến đổi để sẵn sàng đưa vào huấn luyện.
  - `models/`: Thư mục lưu trữ các phiên bản trọng số của mô hình (model weights) đã huấn luyện (VD: `.pt`, `.h5`, `.pkl`).
  - `notebooks/`: Các file Jupyter Notebook (`.ipynb`) dùng để nghiên cứu, phân tích dữ liệu (EDA) và thử nghiệm nhanh. (Quy ước: đặt tên theo định dạng `<STT>-<Tên_thành_viên>-<Mô_tả>`).
  - `src/`: Thư mục chứa mã nguồn (source code) chính của quy trình học máy.
    - `data/`: Các script xử lý, trích xuất và làm sạch dữ liệu.
    - `features/`: Các script trích xuất đặc trưng (feature engineering).
    - `models/`: Mã nguồn định nghĩa kiến trúc mô hình (`architecture.py`), script huấn luyện (`train_model.py`) và suy luận (`predict_model.py`).
    - `evaluation/`: Các kịch bản đánh giá mô hình.
    - `utils/`: Các hàm tiện ích hỗ trợ (logging, setup môi trường).
  - `requirements.txt`: Chứa danh sách các thư viện Python cần thiết để chạy môi trường AI.

## Lợi ích của kiến trúc Monorepo trong dự án này:
1. **Dễ dàng quản lý và đồng bộ:** Mọi mã nguồn nằm chung ở một repository. Bất cứ khi nào cấu trúc dữ liệu ở Back-end hoặc mô hình AI thay đổi, lập trình viên có thể dễ dàng kiểm tra và cập nhật chéo lên Front-end ngay lập tức.
2. **Triển khai CI/CD linh hoạt:** Hệ thống có thể được cấu hình để tự động build và deploy từng phần riêng biệt mà không ảnh hưởng tới thành phần khác, tuy nhiên vẫn có khả năng chạy thử nghiệm tích hợp toàn bộ hệ thống ở một nơi.
3. **Tiêu chuẩn hóa:** Chia sẻ dễ dàng các tiêu chuẩn về code (formatting, linting) thống nhất xuyên suốt các nhóm phụ trách Front-end, Back-end và AI.