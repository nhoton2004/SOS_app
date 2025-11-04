# Quick Start - Test SOS Case API

## Các bước test nhanh

### 1. Chuẩn bị (1 lần)

```bash
# Khởi động server
npm run dev
```

### 2. Setup Postman (1 lần)

1. Import `SOS_Case_API_Postman_Collection.json`
2. Import `SOS_App_Postman_Environment.json`
3. Set `baseUrl` = `http://localhost:5000`

### 3. Test Flow (5 phút)

#### Bước 1: Đăng nhập Reporter
```
POST /api/auth/login
Body: {
  "phone": "+84123456789",
  "password": "password123"
}
→ Copy token vào {{reporterToken}}
```

#### Bước 2: Tạo SOS Case
```
POST /api/sos
Headers: Authorization: Bearer {{reporterToken}}
Body: {
  "latitude": 10.762622,
  "longitude": 106.660172,
  "emergencyType": "MEDICAL",
  "description": "Cần hỗ trợ y tế khẩn cấp",
  "manualAddress": "123 Đường ABC, Quận 1",
  "batteryLevel": 45,
  "isUrgent": true
}
→ Case ID tự động lưu vào {{caseId}}
```

**Kỳ vọng:**
- Status: 201
- Case được tạo với status SEARCHING
- Có reporterLocation (GeoJSON Point)

#### Bước 3: Volunteer chấp nhận
```
POST /api/sos/{{caseId}}/accept
Headers: Authorization: Bearer {{volunteerToken}}
```

**Kỳ vọng:**
- Status: 200
- Case status = ACCEPTED
- Có responderLocation và directionsUrl

#### Bước 4: Xem chi tiết
```
GET /api/sos/{{caseId}}
Headers: Authorization: Bearer {{token}}
```

**Kỳ vọng:**
- Có đầy đủ thông tin case
- Có cả 2 locations (reporter và responder)
- Có directionsUrl

#### Bước 5: Lấy Google Maps URL
```
GET /api/sos/{{caseId}}/directions
Headers: Authorization: Bearer {{token}}
```

**Kỳ vọng:**
- Có directionsUrl
- Copy URL và mở trong browser → Google Maps hiển thị đường đi

## Test các chức năng khác

### Test Cancel Case
```
POST /api/sos/{{caseId}}/cancel
Body: {
  "cancelReason": "Đã được hỗ trợ"
}
```

### Test Decline Case
```
POST /api/sos/{{caseId}}/decline
Body: {
  "declineReason": "Đang bận"
}
```

### Test List Cases
```
GET /api/sos?status=SEARCHING&page=1&limit=10
```

## Checklist nhanh

- [ ] Server đang chạy
- [ ] Postman collection đã import
- [ ] Đã đăng nhập và có token
- [ ] Tạo case thành công
- [ ] Volunteer chấp nhận thành công
- [ ] Lấy được directions URL
- [ ] Mở Google Maps thành công

## Lưu ý quan trọng

1. **Cần VolunteerProfile**: Volunteer phải có VolunteerProfile với:
   - `status: 'APPROVED'`
   - `ready: true`
   - `homeBase.location` đã set

2. **Khoảng cách**: Tìm TNV trong bán kính 50km từ vị trí case

3. **Role**: Volunteer phải có role `TNV_CN` hoặc `TNV_TC`

4. **GeoJSON Format**: Coordinates là `[longitude, latitude]` (không phải ngược lại)

## Troubleshooting nhanh

| Lỗi | Giải pháp |
|-----|----------|
| "No volunteers available" | Kiểm tra VolunteerProfile có approved và ready |
| "Not authorized" | Kiểm tra token và role |
| "Invalid coordinates" | Lat: -90 to 90, Lng: -180 to 180 |
| "Case not found" | Kiểm tra caseId có đúng không |

## Xem thêm

- `SOS_CASE_TESTING_GUIDE.md` - Hướng dẫn test chi tiết
- `README.md` - Tài liệu API đầy đủ
