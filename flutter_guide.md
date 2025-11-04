## Hướng dẫn tích hợp Flutter frontend với backend SOS

Tài liệu này giúp tích hợp ứng dụng Flutter (không realtime) với backend Node.js/Express + MongoDB hiện tại (JWT + REST, MapLibre/Google Maps directions, S3 upload hình qua backend).

---

### 1) Cấu hình dự án Flutter

- Khuyến nghị SDK Flutter: 3.x
- Thêm dependencies:
  - dio: ^5.x
  - flutter_secure_storage: ^9.x — lưu token (Android Keystore/iOS Keychain)
  - url_launcher: ^6.x — mở Google Maps
  - (tuỳ chọn) json_annotation, build_runner, json_serializable — generate model

Base URL (ENV):
- Dev Web: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://127.0.0.1:3000`
- Prod: `https://your-domain.com`

---

### 2) Tạo Dio client + Interceptor JWT

```dart
class ApiClient {
  final Dio dio;
  final FlutterSecureStorage storage;

  ApiClient(String baseUrl)
      : dio = Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: const Duration(seconds: 20))),
        storage = const FlutterSecureStorage() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'jwt');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
          await storage.delete(key: 'jwt');
          // TODO: điều hướng về màn Login
        }
        return handler.next(e);
      },
    ));
  }
}
```

---

### 3) Đăng nhập (JWT) và lưu phiên

Endpoint: `POST /api/auth/login`
- Payload: `{ phone/email, password }` (tuỳ cấu hình backend)
- Response: `{ success, data: { token, user } }` hoặc `{ token, user }`

```dart
class AuthRepository {
  final ApiClient api;
  AuthRepository(this.api);

  Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await api.dio.post('/auth/login', data: {'phone': phone, 'password': password});
    final data = res.data;
    final token = data['data']?['token'] ?? data['token'];
    final user = data['data']?['user'] ?? data['user'];
    if (token == null) throw Exception('Không nhận được token');
    await api.storage.write(key: 'jwt', value: token);
    return {'token': token, 'user': user};
  }

  Future<void> logout() async => api.storage.delete(key: 'jwt');
}
```

Hàm parse lỗi gọn:

```dart
String parseError(dynamic e) {
  try { return e.response?.data?['message'] ?? e.message; } catch (_) { return 'Có lỗi xảy ra'; }
}
```

---

### 4) Models tối thiểu (GeoJSON + SOS Case)

```dart
class GeoPoint {
  final String type; // 'Point'
  final List<double> coordinates; // [lng, lat]
  GeoPoint({required this.type, required this.coordinates});
}

class SosCase {
  final String idOrCode; // _id hoặc code
  final String status; // SEARCHING | ACCEPTED | IN_PROGRESS | RESOLVED | CANCELLED
  final GeoPoint reporterLocation; // field: location
  final GeoPoint? responderLocation;

  SosCase({required this.idOrCode, required this.status, required this.reporterLocation, this.responderLocation});

  factory SosCase.fromJson(Map<String, dynamic> j) => SosCase(
    idOrCode: j['code'] ?? j['_id'] ?? '',
    status: j['status'],
    reporterLocation: GeoPoint(
      type: j['location']['type'],
      coordinates: (j['location']['coordinates'] as List).map((e) => (e as num).toDouble()).toList(),
    ),
    responderLocation: j['responderLocation'] == null
        ? null
        : GeoPoint(
            type: j['responderLocation']['type'],
            coordinates: (j['responderLocation']['coordinates'] as List).map((e) => (e as num).toDouble()).toList(),
          ),
  );
}
```

---

### 5) SOS APIs (không realtime)

- Tạo case: `POST /api/sos`
  - Body: `{ latitude, longitude, emergencyType, description, manualAddress, batteryLevel, isUrgent }`
- Danh sách: `GET /api/sos?limit=...&status=...` (có thể filter client-side)
- Chi tiết: `GET /api/sos/:caseId` (caseId = `code` hoặc `_id`)
- Chấp nhận: `POST /api/sos/:caseId/accept` (nếu volunteer không có homeBase, có thể truyền `{ latitude, longitude }`)
- Hủy: `POST /api/sos/:caseId/cancel`  Body: `{ cancelReason }`
- Từ chối: `POST /api/sos/:caseId/decline` Body: `{ declineReason }`
- Google Maps URL: `GET /api/sos/:caseId/directions`

```dart
class SosRepository {
  final ApiClient api;
  SosRepository(this.api);

  Future<SosCase> createSos({
    required double lat,
    required double lng,
    required String emergencyType,
    required String description,
    String? manualAddress,
    int? batteryLevel,
    bool isUrgent = false,
  }) async {
    final res = await api.dio.post('/sos', data: {
      'latitude': lat,
      'longitude': lng,
      'emergencyType': emergencyType,
      'description': description,
      'manualAddress': manualAddress,
      'batteryLevel': batteryLevel,
      'isUrgent': isUrgent,
    });
    final caseJson = res.data['data']?['case'] ?? res.data['case'] ?? res.data;
    return SosCase.fromJson(caseJson);
  }

  Future<List<SosCase>> getSosList({int limit = 50}) async {
    final res = await api.dio.get('/sos', queryParameters: {'limit': limit});
    final list = (res.data['data'] ?? res.data) as List;
    return list.map((e) => SosCase.fromJson(e)).toList();
  }

  Future<SosCase> getSosDetails(String caseId) async {
    final res = await api.dio.get('/sos/$caseId');
    final j = res.data['data']?['case'] ?? res.data['case'];
    return SosCase.fromJson(j);
  }

  Future<void> accept(String caseId, {double? lat, double? lng}) async {
    await api.dio.post('/sos/$caseId/accept', data: lat != null && lng != null ? {'latitude': lat, 'longitude': lng} : null);
  }

  Future<void> cancel(String caseId, String reason) async {
    await api.dio.post('/sos/$caseId/cancel', data: {'cancelReason': reason});
  }

  Future<void> decline(String caseId, String reason) async {
    await api.dio.post('/sos/$caseId/decline', data: {'declineReason': reason});
  }

  Future<String> getDirectionsUrl(String caseId) async {
    final res = await api.dio.get('/sos/$caseId/directions');
    return res.data['data']?['directionsUrl'] ?? res.data['directionsUrl'];
  }
}
```

---

### 6) Hiển thị Map & “Chỉ đường”

Bạn có thể dùng `google_maps_flutter` (hoặc `maplibre_gl`). Backend trả về GeoJSON Point:
- `reporterLocation`: `{ type: 'Point', coordinates: [lng, lat] }`
- `responderLocation`: tương tự (nếu có)

Gợi ý với Google Maps:

```dart
final reporter = LatLng(reporterLat, reporterLng);
final responder = responderLatLngOrNull; // LatLng?

final markers = <Marker>{
  const Marker(markerId: MarkerId('reporter'), position: reporter),
  if (responder != null) const Marker(markerId: MarkerId('responder'), position: responder),
};

GoogleMap(
  initialCameraPosition: CameraPosition(target: reporter, zoom: 14),
  markers: markers,
);
```

Mở Google Maps Directions:

```dart
import 'package:url_launcher/url_launcher.dart';

Future<void> openDirections(String url) async {
  final uri = Uri.parse(url);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
```

---

### 7) Upload ảnh bài viết (S3 qua backend)

Route: `POST /api/articles/upload-image` — field `image` (multipart/form-data)

```dart
Future<String> uploadImage(File file, ApiClient api) async {
  final form = FormData.fromMap({
    'image': await MultipartFile.fromFile(file.path, filename: 'photo.jpg'),
  });
  final res = await api.dio.post('/articles/upload-image', data: form);
  return res.data['data']?['url'] ?? res.data['url'];
}
```

Giới hạn: 5MB, chỉ hình ảnh. Backend dùng ACL `public-read`, tự dọn dẹp khi lỗi.

---

### 8) Phân quyền & bảo mật

- Tất cả route SOS yêu cầu JWT.
- Vai trò: `ADMIN`, `TNV_CN`, `TNV_TC`, `USER`.
- Mobile (USER/TNV) sẽ dùng: tạo case, accept/decline/cancel, xem directions.
- Xoá case (hard delete) chỉ dành cho `ADMIN` (đã có route `/api/admin/sos-cases/:caseId`).

---

### 9) Kiến trúc đề xuất Flutter

- data: `ApiClient`, Repositories (`AuthRepository`, `SosRepository`, `ArticleRepository`)
- domain: models (`SosCase`, `GeoPoint`, `User`…)
- presentation: providers/blocs + screens (List/Detail/Create)
- State management: Riverpod/Bloc/GetX (tuỳ chọn)

---

### 10) Quy trình kiểm thử nhanh

1. Login → lưu JWT vào `flutter_secure_storage`.
2. Tạo case SOS → render marker từ `reporterLocation`.
3. (TNV) Accept → hiển thị thêm `responderLocation` (homeBase hoặc body lat/lng).
4. Nhấn “Chỉ đường” → dùng URL từ `/sos/:caseId/directions` mở Google Maps.
5. Hủy/Từ chối → gọi `/cancel` hoặc `/decline`, cập nhật UI.
6. Upload ảnh bài viết → kiểm tra S3 URL trả về.

---

### 11) Checklist tích hợp

- [ ] Cấu hình Dio + SecureStorage
- [ ] Interceptor JWT
- [ ] AuthRepository (login/logout)
- [ ] Models: `GeoPoint`, `SosCase`
- [ ] SosRepository (create/list/detail/accept/cancel/decline/directions)
- [ ] Màn hình List/Detail/Map + nút mở Google Maps
- [ ] Upload ảnh blog/community (FormData)
- [ ] Xử lý lỗi (hiển thị thông điệp tiếng Việt)

---

Nếu cần, có thể scaffold nhanh 3 màn hình mẫu (List/Detail/Create) với Riverpod + Dio dựa trên repo này.

---

### 12) Bài viết Cộng đồng / Blog

Backend đã hợp nhất hệ thống bài viết, hỗ trợ 2 loại:
- `category`: `COMMUNITY` (bài viết cộng đồng), `BLOG` (bài blog)
- `status`: `DRAFT | PENDING | APPROVED | REJECTED`

Các endpoint chính:
- `GET /api/articles` – danh sách (query: `page, limit, search, category, status, sortBy, sortOrder`)
- `GET /api/articles/:id` – chi tiết
- `POST /api/articles` – tạo mới (yêu cầu auth, role: `ADMIN` hoặc `TNV_CN/TNV_TC` tuỳ cấu hình)
- `PUT /api/articles/:id` – cập nhật (tác giả hoặc admin)
- `DELETE /api/articles/:id` – xoá (tác giả hoặc admin)
- `POST /api/articles/:id/like` – thích / bỏ thích
- `POST /api/articles/upload-image` – upload hình đơn lẻ (đã mô tả ở phần 7)
- Duyệt bài (admin): `POST /api/articles/:id/approve`, `POST /api/articles/:id/reject`

Model đơn giản phía Flutter (tuỳ chỉnh theo giao diện của bạn):

```dart
class Article {
  final String id;
  final String title;
  final String content;
  final String category; // 'COMMUNITY' | 'BLOG'
  final String status;   // 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  final String? imageUrl; // ảnh chính (nếu có)
  final String authorName;
  final DateTime createdAt;
  final DateTime? publishedAt;
  final int likeCount;
  final bool isLikedByMe;

  Article({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.status,
    required this.imageUrl,
    required this.authorName,
    required this.createdAt,
    required this.publishedAt,
    required this.likeCount,
    required this.isLikedByMe,
  });

  factory Article.fromJson(Map<String, dynamic> j) => Article(
    id: j['_id'] ?? j['id'],
    title: j['title'] ?? '',
    content: j['content'] ?? '',
    category: j['category'] ?? 'COMMUNITY',
    status: j['status'] ?? 'PENDING',
    imageUrl: j['images']?['url'], // backend dùng mediaAssetSchema cho ảnh chính
    authorName: j['authorName'] ?? 'Ẩn danh',
    createdAt: DateTime.parse(j['createdAt']),
    publishedAt: j['publishedAt'] != null ? DateTime.tryParse(j['publishedAt']) : null,
    likeCount: j['likeCount'] ?? 0,
    isLikedByMe: j['isLikedByCurrentUser'] ?? false,
  );
}
```

Repository cho bài viết (cộng đồng + blog):

```dart
class ArticleRepository {
  final ApiClient api;
  ArticleRepository(this.api);

  Future<List<Article>> getArticles({
    String? category, // 'COMMUNITY' | 'BLOG'
    String? status,   // 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT'
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final res = await api.dio.get('/articles', queryParameters: {
      if (category != null) 'category': category,
      if (status != null) 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
      'page': page,
      'limit': limit,
    });
    final list = (res.data['data'] ?? res.data) as List;
    return list.map((e) => Article.fromJson(e)).toList();
  }

  Future<Article> getArticle(String id) async {
    final res = await api.dio.get('/articles/$id');
    final j = res.data['data'] ?? res.data;
    return Article.fromJson(j);
  }

  Future<Article> createArticle({
    required String title,
    required String content,
    required String category, // 'COMMUNITY' | 'BLOG'
    String? imageUrl,         // đã upload trước bằng /articles/upload-image
  }) async {
    final data = {
      'title': title,
      'content': content,
      'category': category,
      if (imageUrl != null) 'images': {'url': imageUrl},
    };
    final res = await api.dio.post('/articles', data: data);
    final j = res.data['data'] ?? res.data;
    return Article.fromJson(j);
  }

  Future<Article> updateArticle(String id, {String? title, String? content, String? imageUrl, String? status}) async {
    final data = {
      if (title != null) 'title': title,
      if (content != null) 'content': content,
      if (imageUrl != null) 'images': {'url': imageUrl},
      if (status != null) 'status': status, // chỉ admin được chuyển trạng thái đặc thù
    };
    final res = await api.dio.put('/articles/$id', data: data);
    final j = res.data['data'] ?? res.data;
    return Article.fromJson(j);
  }

  Future<void> deleteArticle(String id) async {
    await api.dio.delete('/articles/$id');
  }

  Future<int> toggleLike(String id) async {
    final res = await api.dio.post('/articles/$id/like');
    // backend có thể trả likeCount mới
    return res.data['data']?['likeCount'] ?? res.data['likeCount'] ?? 0;
  }

  // Duyệt bài — chỉ Admin
  Future<Article> approve(String id) async {
    final res = await api.dio.post('/articles/$id/approve');
    final j = res.data['data'] ?? res.data;
    return Article.fromJson(j);
  }

  Future<Article> reject(String id, {String? reason}) async {
    final res = await api.dio.post('/articles/$id/reject', data: {'reason': reason});
    final j = res.data['data'] ?? res.data;
    return Article.fromJson(j);
  }
}
```

Luồng hiển thị đề xuất:
- Community Feed: gọi `getArticles(category: 'COMMUNITY', status: 'APPROVED')`
- Blog Feed: gọi `getArticles(category: 'BLOG', status: 'APPROVED')`
- Tạo bài (USER/TNV/ADMIN theo quyền):
  1. Upload hình qua `/articles/upload-image` → lấy `url`
  2. Gọi `createArticle(title, content, category, imageUrl)`
  3. Chờ duyệt (status `PENDING`) → Admin dùng `approve()`/`reject()`
- Chi tiết: `getArticle(id)` → render nội dung và nút `Thích/Bỏ thích` (`toggleLike`) kèm `likeCount`

Gợi ý UI:
- Sử dụng `PagedListView`/`infinite_scroll_pagination` cho feed dài
- Thêm ô `search` để filter theo `title/content`
- Hiển thị chip `status`/`category` để phân loại



