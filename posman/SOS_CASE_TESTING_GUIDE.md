# Hướng dẫn Test SOS Case API

## Tổng quan
Hướng dẫn này sẽ giúp bạn test toàn bộ hệ thống SOS Case API từ đầu đến cuối.

## Chuẩn bị

### 1. Import Postman Collection
1. Mở Postman
2. Click **Import**
3. Import file `SOS_Case_API_Postman_Collection.json`
4. Import file `SOS_App_Postman_Environment.json` (nếu chưa có)

### 2. Tạo test data trong database

#### Tạo User (Reporter)
```javascript
// Đăng ký user thường
POST /api/auth/register
{
  "fullName": "Nguyễn Văn A",
  "phone": "+84123456789",
  "email": "reporter@test.com",
  "password": "password123"
}
```

#### Tạo Volunteer Profile
Cần có VolunteerProfile với:
- `status: 'APPROVED'`
- `ready: true`
- `homeBase.location` được set (GeoJSON Point)

**Lưu ý**: Cần tạo user với role TNV_CN hoặc TNV_TC trước, sau đó tạo VolunteerProfile.

## Test Flow

### Bước 1: Đăng nhập để lấy token

#### 1.1. Đăng nhập Reporter
```
POST /api/auth/login
Body: {
  "phone": "+84123456789",
  "password": "password123"
}
```
- Copy `token` từ response
- Paste vào collection variable `{{reporterToken}}`

#### 1.2. Đăng nhập Volunteer
```
POST /api/auth/login
Body: {
  "phone": "+84987654321", // Số điện thoại của volunteer
  "password": "password123"
}
```
- Copy `token` từ response
- Paste vào collection variable `{{volunteerToken}}`

### Bước 2: Tạo SOS Case

#### 2.1. Tạo case mới
```
POST /api/sos
Headers: Authorization: Bearer {{reporterToken}}
Body: {
  "latitude": 10.762622,      // Tọa độ TP.HCM
  "longitude": 106.660172,
  "emergencyType": "MEDICAL",
  "description": "Cần hỗ trợ y tế khẩn cấp, người bị ngất",
  "manualAddress": "123 Đường ABC, Quận 1, TP.HCM",
  "batteryLevel": 45,
  "isUrgent": true
}
```

**Kỳ vọng Response:**
- Status: 201 Created
- Có `case._id` (được lưu vào `{{caseId}}`)
- Có `reporterLocation` (GeoJSON Point)
- Case status: `SEARCHING`

**Kiểm tra:**
- Case được tạo với code unique (format: `SOS{timestamp}{random}`)
- SosResponderQueue được tạo cho các TNV gần nhất
- Vị trí được lưu đúng format GeoJSON

### Bước 3: Volunteer chấp nhận case

#### 3.1. Xem danh sách cases đang SEARCHING
```
GET /api/sos?status=SEARCHING
Headers: Authorization: Bearer {{volunteerToken}}
```

#### 3.2. Chấp nhận case
```
POST /api/sos/{{caseId}}/accept
Headers: Authorization: Bearer {{volunteerToken}}
```

**Kỳ vọng Response:**
- Status: 200 OK
- Case status: `ACCEPTED`
- Có `responderLocation` (lấy từ VolunteerProfile.homeBase.location)
- Có `directionsUrl` (Google Maps URL)
- `acceptedBy` = volunteerId

**Kiểm tra:**
- Case được cập nhật với responderInfo
- SosResponderQueue của volunteer khác được set status = DECLINED
- Google Maps URL có format đúng

### Bước 4: Lấy chi tiết case

```
GET /api/sos/{{caseId}}
Headers: Authorization: Bearer {{token}}
```

**Kỳ vọng Response:**
- Có đầy đủ thông tin case
- Có `reporterLocation` (GeoJSON Point)
- Có `responderLocation` (nếu đã chấp nhận)
- Có `directionsUrl` (nếu có responder)

### Bước 5: Lấy Google Maps Directions

```
GET /api/sos/{{caseId}}/directions
Headers: Authorization: Bearer {{token}}
```

**Kỳ vọng Response:**
- Status: 200 OK
- Có `directionsUrl` (có thể mở trong browser)
- Có `origin` và `destination` coordinates

**Test:**
- Copy `directionsUrl` và mở trong browser
- Kiểm tra Google Maps hiển thị đúng đường đi

### Bước 6: Test Cancel Case

#### 6.1. Reporter hủy case
```
POST /api/sos/{{caseId}}/cancel
Headers: Authorization: Bearer {{reporterToken}}
Body: {
  "cancelReason": "Đã được hỗ trợ bởi người khác"
}
```

**Kỳ vọng Response:**
- Status: 200 OK
- Case status: `CANCELLED`
- `cancelledByRole`: `REPORTER`
- Tất cả queue items status = DECLINED

#### 6.2. Volunteer hủy case (sau khi đã accept)
```
POST /api/sos/{{caseId}}/cancel
Headers: Authorization: Bearer {{volunteerToken}}
Body: {
  "cancelReason": "Không thể đến được địa điểm"
}
```

**Kỳ vọng Response:**
- Status: 200 OK
- Case status: `SEARCHING` (không phải CANCELLED)
- Case được reset: `acceptedBy = null`, `responderLocation = null`
- Tìm TNV mới trong queue

### Bước 7: Test Decline Case

Trước khi volunteer chấp nhận, có thể từ chối:

```
POST /api/sos/{{caseId}}/decline
Headers: Authorization: Bearer {{volunteerToken}}
Body: {
  "declineReason": "Đang bận case khác"
}
```

**Kỳ vọng Response:**
- Status: 200 OK
- Queue item status = `DECLINED`
- Tìm TNV tiếp theo trong queue

## Test Cases

### Test Case 1: Validation

#### 1.1. Thiếu trường bắt buộc
```
POST /api/sos
Body: {
  "latitude": 10.762622
  // Thiếu longitude, emergencyType, description
}
```
**Kỳ vọng:** 400 Bad Request - "Latitude and longitude are required" hoặc "Emergency type and description are required"

#### 1.2. Tọa độ không hợp lệ
```
POST /api/sos
Body: {
  "latitude": 200,  // > 90
  "longitude": 300, // > 180
  "emergencyType": "MEDICAL",
  "description": "Test"
}
```
**Kỳ vọng:** 400 Bad Request - "Invalid coordinates"

#### 1.3. Hủy case không có lý do
```
POST /api/sos/{{caseId}}/cancel
Body: {}
```
**Kỳ vọng:** 400 Bad Request - "Cancel reason is required"

### Test Case 2: Authorization

#### 2.1. Reporter không thể accept case của mình
```
POST /api/sos/{{caseId}}/accept
Headers: Authorization: Bearer {{reporterToken}}
```
**Kỳ vọng:** 400 Bad Request - "SOS case is no longer available" hoặc lỗi tương tự

#### 2.2. User không phải reporter không thể hủy
```
POST /api/sos/{{caseId}}/cancel (với token của user khác)
```
**Kỳ vọng:** 403 Forbidden - "Not authorized to cancel this SOS case"

### Test Case 3: Business Logic

#### 3.1. Accept case đã được accept
```
POST /api/sos/{{caseId}}/accept (case đã có acceptedBy)
```
**Kỳ vọng:** 400 Bad Request - "SOS case is no longer available"

#### 3.2. Hủy case đã bị hủy
```
POST /api/sos/{{caseId}}/cancel (case status = CANCELLED)
```
**Kỳ vọng:** 400 Bad Request - "SOS case has been cancelled"

#### 3.3. Volunteer đang bận case khác
Tạo case mới, một volunteer đã accept case khác (status ACCEPTED/IN_PROGRESS), volunteer này không nên được tìm thấy trong queue.

## Test với Multiple Volunteers

### Scenario: Nhiều TNV trong queue

1. **Tạo case** → Tìm được 3 TNV gần nhất
2. **TNV 1 từ chối** → Queue item 1 status = DECLINED
3. **TNV 2 từ chối** → Queue item 2 status = DECLINED
4. **TNV 3 chấp nhận** → Case accepted, queue item 3 status = ACCEPTED, queue item 1,2 = DECLINED

### Scenario: Volunteer hủy sau khi accept

1. **Tạo case** → Tìm được TNV
2. **TNV chấp nhận** → Case status = ACCEPTED
3. **TNV hủy** → Case status = SEARCHING, tìm TNV mới
4. **TNV mới chấp nhận** → Case status = ACCEPTED

## Kiểm tra GeoJSON Format

### Reporter Location
```json
{
  "type": "Point",
  "coordinates": [106.660172, 10.762622]  // [longitude, latitude]
}
```

### Responder Location
```json
{
  "type": "Point",
  "coordinates": [106.660172, 10.762622]  // [longitude, latitude]
}
```

## Kiểm tra Google Maps URL

Format URL:
```
https://www.google.com/maps/dir/?api=1&origin={lat},{lng}&destination={lat},{lng}&travelmode=driving
```

Ví dụ:
```
https://www.google.com/maps/dir/?api=1&origin=10.762622,106.660172&destination=10.763000,106.661000&travelmode=driving
```

## Troubleshooting

### Lỗi "No volunteers available in the area"
- Kiểm tra VolunteerProfile có `status: 'APPROVED'` và `ready: true`
- Kiểm tra `homeBase.location` đã được set
- Kiểm tra TNV không đang trong case khác (status ACCEPTED/IN_PROGRESS)
- Kiểm tra khoảng cách (trong bán kính 50km)

### Lỗi "SOS case not found"
- Kiểm tra `{{caseId}}` có đúng không
- Kiểm tra case có tồn tại trong database

### Lỗi "Not authorized"
- Kiểm tra token có đúng không
- Kiểm tra user có quyền thực hiện action không

### Case không tìm được TNV
- Kiểm tra có VolunteerProfile nào trong bán kính 50km không
- Kiểm tra VolunteerProfile có `status: 'APPROVED'` và `ready: true`
- Kiểm tra User có role TNV_CN hoặc TNV_TC

## Tips

1. **Sử dụng Environment Variables** trong Postman để dễ dàng chuyển đổi giữa các môi trường
2. **Save Response** để tham khảo sau này
3. **Test từng bước** một cách tuần tự
4. **Kiểm tra database** sau mỗi bước để đảm bảo data đúng
5. **Test với nhiều tài khoản** để test flow đầy đủ

## Checklist

- [ ] Đăng nhập thành công với reporter và volunteer
- [ ] Tạo SOS case thành công
- [ ] Case được tìm thấy TNV gần nhất
- [ ] Volunteer chấp nhận case thành công
- [ ] Lấy được chi tiết case với locations
- [ ] Lấy được Google Maps directions URL
- [ ] Reporter hủy case thành công
- [ ] Volunteer hủy case (reset về SEARCHING)
- [ ] Volunteer từ chối case trong queue
- [ ] Test validation errors
- [ ] Test authorization errors
