# Hướng dẫn sử dụng Postman Collection cho SOS App API

## Tổng quan
Collection Postman này được tạo để test các API endpoint của ứng dụng SOS (Safe Connect). Collection bao gồm các request để test authentication, health check và các test case cơ bản.

## Cài đặt

### 1. Import Collection và Environment
1. Mở Postman
2. Click **Import** ở góc trái trên
3. Import 2 files:
   - `SOS_App_Postman_Collection.json` (Collection)
   - `SOS_App_Postman_Environment.json` (Environment)
4. Chọn environment "SOS App Environment" ở dropdown góc phải trên

### 2. Cấu hình Environment
Trong environment "SOS App Environment", bạn có thể thay đổi các giá trị:
- `baseUrl`: URL của server (mặc định: http://localhost:5000)
- `testPhone`: Số điện thoại test (mặc định: +84123456789)
- `testEmail`: Email test (mặc định: test@example.com)
- `testPassword`: Mật khẩu test (mặc định: password123)

## Cách sử dụng

### 1. Kiểm tra Server
Trước tiên, chạy các request trong folder **Health Check**:
- **Root Endpoint**: Kiểm tra API có hoạt động không
- **Health Check**: Kiểm tra trạng thái chi tiết của server

### 2. Test Authentication Flow

#### Bước 1: Đăng ký tài khoản mới
1. Chạy request **Register User** trong folder **Authentication**
2. Nếu thành công (status 201), token sẽ được tự động lưu vào biến `token`
3. Response sẽ chứa thông tin user và token

#### Bước 2: Đăng nhập
1. Chạy request **Login with Phone** hoặc **Login with Email**
2. Token sẽ được tự động lưu sau khi đăng nhập thành công

#### Bước 3: Lấy thông tin profile
1. Chạy request **Get Profile**
2. Request này sử dụng token đã lưu để xác thực
3. Sẽ trả về thông tin chi tiết của user hiện tại

### 3. Test Cases
Folder **Test Cases** chứa các request để test các trường hợp lỗi:
- **Register - Missing Required Fields**: Test đăng ký thiếu thông tin
- **Login - Invalid Credentials**: Test đăng nhập sai thông tin
- **Get Profile - No Token**: Test lấy profile không có token
- **Get Profile - Invalid Token**: Test lấy profile với token sai

## Cấu trúc Collection

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập (phone hoặc email)
- `GET /api/auth/me` - Lấy thông tin profile (cần xác thực)

### Test Cases
- Các request test các trường hợp lỗi và edge cases

## Lưu ý quan trọng

1. **Token Management**: Collection tự động lưu token sau khi đăng ký/đăng nhập thành công
2. **Environment Variables**: Sử dụng environment để dễ dàng thay đổi URL và thông tin test
3. **Error Handling**: Các request test case sẽ trả về lỗi như mong đợi
4. **Server Status**: Đảm bảo server SOS App đang chạy trước khi test

## Troubleshooting

### Lỗi Connection Refused
- Kiểm tra server có đang chạy không: `npm run dev`
- Kiểm tra PORT trong file .env (mặc định 5000)
- Kiểm tra biến `baseUrl` trong environment

### Lỗi 401 Unauthorized
- Kiểm tra token có được lưu đúng không
- Thử đăng nhập lại để lấy token mới
- Kiểm tra JWT_SECRET trong file .env

### Lỗi 409 Conflict (Account already exists)
- Thay đổi số điện thoại hoặc email trong request register
- Hoặc xóa user cũ trong database

## Mở rộng Collection

Để thêm các endpoint mới:
1. Tạo folder mới trong collection
2. Thêm request với method, URL, headers và body phù hợp
3. Sử dụng biến environment `{{baseUrl}}` và `{{token}}`
4. Thêm test script nếu cần lưu response data

## Ví dụ Request Body

### Register
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "+84123456789",
  "email": "user@example.com",
  "password": "password123"
}
```

### Login
```json
{
  "phone": "+84123456789",
  "password": "password123"
}
```

### Login with Email
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
