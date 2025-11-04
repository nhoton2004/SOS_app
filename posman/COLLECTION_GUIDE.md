# Hướng dẫn sử dụng Postman Collection

## Tổng quan

Có 2 cách để sử dụng Postman Collections:

### Cách 1: Sử dụng Collection gộp (Khuyến nghị)
- File: `SOS_App_Complete_API_Collection.json`
- **Ưu điểm**: Tất cả API trong 1 file, dễ quản lý
- **Phù hợp**: Khi muốn test toàn bộ hệ thống

### Cách 2: Sử dụng Collections riêng lẻ
- `SOS_App_Postman_Collection.json` - Authentication API
- `Article_API_Postman_Collection.json` - Article API
- `SOS_Case_API_Postman_Collection.json` - SOS Case API
- **Ưu điểm**: Dễ focus vào từng module
- **Phù hợp**: Khi chỉ test một phần cụ thể

## Cách import

### Import Collection gộp
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file `SOS_App_Complete_API_Collection.json`
4. Click **Import**

### Import Environment
1. Click **Import** trong Postman
2. Chọn file `SOS_App_Postman_Environment.json`
3. Click **Import**
4. Chọn environment "SOS App Environment" ở dropdown góc phải trên

## Cấu trúc Collection

### Health Check
- Root Endpoint
- Health Check

### Authentication
- Register User
- Login with Phone
- Login with Email
- Get Profile

### SOS Case Management
- Create SOS Case
- Get SOS Case Details
- Get All SOS Cases
- Accept SOS Case
- Decline SOS Case
- Reporter Cancel Case
- Volunteer Cancel Case
- Get Directions URL

### Article Management
- Get All Articles
- Search Articles
- Get Article by ID
- Create Article (Admin/TNV)
- Update Article
- Delete Article
- Upload Image
- Like Article

### Test Cases
- Auth Test Cases
- SOS Case Test Cases
- Article Test Cases

## Collection Variables

Collection có các biến sau:
- `baseUrl`: http://localhost:5000
- `token`: Token JWT (tự động lưu sau khi login)
- `reporterToken`: Token của reporter (cho SOS case)
- `volunteerToken`: Token của volunteer (cho SOS case)
- `caseId`: ID của SOS case (tự động lưu khi tạo case)
- `articleId`: ID của article (tự động lưu khi tạo article)

## Cách sử dụng

### 1. Setup Environment Variables
1. Chọn environment "SOS App Environment"
2. Set `baseUrl` = `http://localhost:5000` (hoặc URL server của bạn)

### 2. Test Authentication
1. Chạy "Register User" hoặc "Login with Phone"
2. Token sẽ tự động lưu vào `{{token}}`

### 3. Test SOS Case
1. Đăng nhập với tài khoản USER → lưu token vào `{{reporterToken}}`
2. Đăng nhập với tài khoản TNV → lưu token vào `{{volunteerToken}}`
3. Tạo SOS case → Case ID tự động lưu vào `{{caseId}}`
4. Volunteer chấp nhận case
5. Lấy directions URL

### 4. Test Articles
1. Đăng nhập với tài khoản ADMIN/TNV
2. Tạo article → Article ID tự động lưu
3. Upload image
4. Like article

## Lưu ý

1. **Auto-save variables**: Một số request tự động lưu biến:
   - Login → lưu `token`
   - Create SOS Case → lưu `caseId`
   - Get Article → lưu `articleId`

2. **Manual setup**: Một số biến cần set thủ công:
   - `reporterToken`: Copy token từ login của reporter
   - `volunteerToken`: Copy token từ login của volunteer

3. **Environment**: Đảm bảo đã chọn đúng environment trước khi test

## Troubleshooting

### Token không tự động lưu
- Kiểm tra test script trong request có đúng không
- Kiểm tra response format có đúng không
- Set thủ công token vào collection variable

### Variables không hoạt động
- Kiểm tra đã chọn đúng environment chưa
- Kiểm tra variable name có đúng không (case-sensitive)
- Thử set giá trị trực tiếp trong request

### Request bị lỗi
- Kiểm tra server có đang chạy không
- Kiểm tra `baseUrl` có đúng không
- Kiểm tra token có hết hạn không
- Xem console log trong Postman để debug
