# SOS App API

## Tổng quan
- Dịch vụ API cho hệ thống hỗ trợ khẩn cấp (Safe Connect) xây dựng bằng Node.js và Express.
- Sử dụng MongoDB với Mongoose để quản lý dữ liệu người dùng, tình huống SOS, bài viết và thông báo.
- Hỗ trợ xác thực JWT, quản lý phiên qua cookie, cấu hình CORS linh hoạt và các biện pháp bảo vệ dữ liệu cơ bản.

## Tính năng chính
- **Authentication**: Đăng ký và đăng nhập người dùng bằng số điện thoại hoặc email, mã hóa mật khẩu với bcrypt.
- **User Management**: Lấy thông tin hồ sơ người dùng đang đăng nhập bằng token JWT.
- **SOS Case Management**: Hệ thống quản lý tình huống khẩn cấp với:
  - Tạo và quản lý SOS case
  - Tìm kiếm tình nguyện viên gần nhất (trong bán kính 50km)
  - Chấp nhận/từ chối/hủy case
  - Hiển thị vị trí trên map (MapLibre)
  - Tích hợp Google Maps directions
- **Article Management**: Quản lý bài viết với upload hình ảnh lên AWS S3
- **Database**: Đồng bộ index MongoDB và áp dụng schema validation tự động mỗi khi khởi động.
- **Architecture**: Kiến trúc module hóa với các thư mục `controllers`, `routes`, `middleware`, `models` và `utils`.

## Yêu cầu hệ thống
- Node.js >= 18
- MongoDB instance và quyền kết nối (Atlas hoặc self-hosted)

## Cài đặt
1. Cài đặt dependencies:  
   ```bash
   npm install
   ```
2. Tạo file `.env` ở thư mục gốc và điền các biến cấu hình cần thiết (xem mục bên dưới).
3. Khởi động cơ sở dữ liệu MongoDB và đảm bảo ứng dụng có thể kết nối tới `MONGO_URI` đã cấu hình.

## Chạy dự án
- Chạy môi trường phát triển/production nhẹ:
  ```bash
  npm run dev
  ```
  (lệnh `npm start` dùng chung cấu hình)

Khi khởi động thành công, server log: `Server listening at http://localhost:5000` (hoặc host/port bạn cấu hình). Endpoint kiểm tra nhanh: `GET /health`.

## Biến môi trường
| Biến | Bắt buộc | Giá trị mẫu | Mô tả |
| ---- | -------- | ----------- | ----- |
| `PORT` | Không | `5000` | Cổng HTTP server. Mặc định 5000. |
| `HOST` | Không | `0.0.0.0` | Địa chỉ bind server. `0.0.0.0` cho phép truy cập từ mọi IP. |
| `MONGO_URI` | Có | `mongodb://localhost:27017/sos_app` | Chuỗi kết nối MongoDB. |
| `JWT_SECRET` | Có | `super-secret-key` | Secret ký/verify JWT. |
| `JWT_EXPIRES_IN` | Không | `7d` | Thời gian hết hạn token (chuẩn JWT). |
| `CORS_ORIGINS` | Không | `https://app.example.com,http://localhost:3000` | Danh sách origin được phép, phân tách bằng dấu phẩy. |

Trong môi trường production, đảm bảo không commit file `.env` và lưu secret an toàn (ví dụ thông qua trình quản lý secret).

## Cấu trúc thư mục
```text
.
├─ config/                # Cấu hình kết nối DB và khởi tạo schema/validator
├─ controllers/           # Xử lý logic API (vd: auth.controller)
├─ docs/                  # Tài liệu bổ sung
├─ middleware/            # Middleware tùy chỉnh (auth, error handler, ...)
├─ models/                # Định nghĩa Mongoose models và schemas
├─ routes/                # Khai báo router Express
├─ utils/                 # Helper chung (JWT, AppError, ...)
├─ server.js              # Điểm khởi động chính của ứng dụng
└─ package.json           # Scripts và dependencies
```

## API chính

### Authentication API
- `POST /api/auth/register`  
  Body JSON: `fullName`, `phone`, tùy chọn `email`, `password`. Trả về `token` và thông tin `user`.
- `POST /api/auth/login`  
  Body JSON: `phone` hoặc `email`, kèm `password`. Trả về `token` và thông tin `user`.
- `GET /api/auth/me`  
  Yêu cầu header `Authorization: Bearer <JWT>`. Trả về hồ sơ người dùng hiện tại.

### SOS Case API
- `POST /api/sos`  
  Tạo SOS case mới. Body: `latitude`, `longitude`, `emergencyType`, `description`, `manualAddress`, `batteryLevel`, `isUrgent`.
- `POST /api/sos/:caseId/accept`  
  Tình nguyện viên chấp nhận case. Trả về vị trí và Google Maps directions URL.
- `POST /api/sos/:caseId/cancel`  
  Hủy SOS case (reporter/volunteer/admin). Body: `cancelReason`.
- `POST /api/sos/:caseId/decline`  
  Tình nguyện viên từ chối case trong queue. Body: `declineReason`.
- `GET /api/sos/:caseId`  
  Lấy chi tiết SOS case với vị trí reporter và responder.
- `GET /api/sos`  
  Lấy danh sách SOS cases (có filter, pagination).
- `GET /api/sos/:caseId/directions`  
  Lấy Google Maps directions URL.

### Article API
- `POST /api/articles` - Tạo bài viết (chỉ ADMIN, TNV_CN, TNV_TC)
- `GET /api/articles` - Lấy danh sách bài viết
- `GET /api/articles/:id` - Lấy chi tiết bài viết
- `PUT /api/articles/:id` - Cập nhật bài viết
- `DELETE /api/articles/:id` - Xóa bài viết
- `POST /api/articles/:id/like` - Thích/bỏ thích bài viết
- `POST /api/articles/upload-image` - Upload hình ảnh lên S3

### Health Check
- `GET /` và `GET /health`  
  Endpoint kiểm tra trạng thái dịch vụ.

Ví dụ đăng nhập bằng `curl`:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+84123456789","password":"your-password"}'
```

## Kiểm thử & lint
- Hiện chưa cấu hình bài test tự động (`npm test` trả về placeholder). Khuyến nghị bổ sung khi phát triển thêm.
- Dự án chưa tích hợp ESLint/Prettier; cấu hình phù hợp nên được thêm tùy nhu cầu nhóm.

## Hướng dẫn Test API

### Test với Postman

1. **Import Collection và Environment**:
   - Import `posman/SOS_App_Complete_API_Collection.json` vào Postman (file gộp tất cả API)
   - Hoặc import từng collection riêng:
     - `posman/SOS_App_Postman_Collection.json` (Auth API)
     - `posman/Article_API_Postman_Collection.json` (Article API)
     - `posman/SOS_Case_API_Postman_Collection.json` (SOS Case API)
   - Import `posman/SOS_App_Postman_Environment.json` (nếu chưa có)
   - Set environment variable `baseUrl` = `http://localhost:5000`

2. **Test Flow cơ bản**:
   ```bash
   # Bước 1: Đăng nhập
   POST /api/auth/login → Lấy token
   
   # Bước 2: Tạo SOS case
   POST /api/sos → Tạo case mới
   
   # Bước 3: Volunteer chấp nhận
   POST /api/sos/:caseId/accept → Chấp nhận case
   
   # Bước 4: Lấy chi tiết và directions
   GET /api/sos/:caseId → Xem thông tin case
   GET /api/sos/:caseId/directions → Lấy Google Maps URL
   ```

3. **Xem hướng dẫn chi tiết**: 
   - Đọc file `posman/SOS_CASE_TESTING_GUIDE.md` để có hướng dẫn test đầy đủ

### Test với cURL

```bash
# 1. Đăng nhập
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+84123456789","password":"password123"}' \
  | jq -r '.token')

# 2. Tạo SOS case
CASE_ID=$(curl -X POST http://localhost:5000/api/sos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "latitude": 10.762622,
    "longitude": 106.660172,
    "emergencyType": "MEDICAL",
    "description": "Cần hỗ trợ y tế khẩn cấp"
  }' | jq -r '.data.case._id')

# 3. Lấy chi tiết case
curl -X GET http://localhost:5000/api/sos/$CASE_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Ghi chú phát triển
- Khi server khởi chạy, hàm `initializeDatabase` sẽ đồng bộ index và áp dụng validator JSON Schema cho các collection chính (`users`, `sos_cases`, `posts`). Hãy đảm bảo tài khoản kết nối MongoDB có quyền `collMod`.
- Để mở rộng API, thêm router mới vào `routes/index.js` và viết controller tương ứng trong `controllers`.
