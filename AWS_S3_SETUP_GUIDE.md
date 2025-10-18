# Hướng dẫn cấu hình AWS S3 cho hệ thống bài viết

## 1. Tạo AWS Account và S3 Bucket

### Bước 1: Tạo AWS Account
1. Truy cập [AWS Console](https://aws.amazon.com/console/)
2. Đăng ký tài khoản AWS (nếu chưa có)
3. Đăng nhập vào AWS Console

### Bước 2: Tạo S3 Bucket
1. Vào **S3** service trong AWS Console
2. Click **Create bucket**
3. Đặt tên bucket (ví dụ: `sos-app-images`)
4. Chọn region: **Asia Pacific (Singapore) ap-southeast-1**
5. **Uncheck** "Block all public access" (vì chúng ta cần public-read cho hình ảnh)
6. Check "I acknowledge that the current settings might result in this bucket and the objects within it becoming public"
7. Click **Create bucket**

### Bước 3: Cấu hình Bucket Policy
1. Vào bucket vừa tạo
2. Vào tab **Permissions**
3. Scroll xuống **Bucket policy**
4. Click **Edit** và thêm policy sau:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

**Lưu ý**: Thay `YOUR_BUCKET_NAME` bằng tên bucket thực tế của bạn.

## 2. Tạo IAM User và Access Keys

### Bước 1: Tạo IAM User
1. Vào **IAM** service trong AWS Console
2. Click **Users** → **Create user**
3. Đặt tên user: `sos-app-s3-user`
4. Chọn **Programmatic access**
5. Click **Next: Permissions**

### Bước 2: Tạo Policy cho S3
1. Click **Attach policies directly**
2. Click **Create policy**
3. Vào tab **JSON** và paste policy sau:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
        }
    ]
}
```

4. Đặt tên policy: `SOSAppS3Policy`
5. Click **Create policy**

### Bước 3: Gán Policy cho User
1. Quay lại tạo user
2. Search và chọn policy `SOSAppS3Policy` vừa tạo
3. Click **Next: Tags** → **Next: Review**
4. Click **Create user**

### Bước 4: Lấy Access Keys
1. Click vào user vừa tạo
2. Vào tab **Security credentials**
3. Click **Create access key**
4. Chọn **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **Lưu lại** Access Key ID và Secret Access Key (chỉ hiển thị 1 lần)

## 3. Cấu hình Environment Variables

Thêm các biến sau vào file `.env`:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=your-bucket-name-here
```

## 4. Test Upload

### Sử dụng Postman:
1. Import collection `Article_API_Postman_Collection.json`
2. Đăng nhập để lấy token
3. Test endpoint `POST /api/articles/upload-image`
4. Chọn file hình ảnh và upload

### Sử dụng cURL:
```bash
curl -X POST http://localhost:5000/api/articles/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

## 5. Troubleshooting

### Lỗi Access Denied:
- Kiểm tra Access Key ID và Secret Access Key
- Kiểm tra bucket policy
- Kiểm tra IAM user permissions

### Lỗi Bucket Not Found:
- Kiểm tra tên bucket trong `.env`
- Kiểm tra region có đúng không

### Lỗi File Upload:
- Kiểm tra file size (max 5MB)
- Kiểm tra file type (chỉ hình ảnh)
- Kiểm tra network connection

### Lỗi CORS (nếu có):
Thêm CORS configuration cho bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## 6. Security Best Practices

1. **Không commit Access Keys vào Git**
2. **Sử dụng IAM roles thay vì access keys khi có thể**
3. **Rotate access keys định kỳ**
4. **Giới hạn permissions theo nguyên tắc least privilege**
5. **Monitor S3 access logs**
6. **Sử dụng CloudTrail để audit**

## 7. Cost Optimization

1. **Sử dụng S3 Intelligent Tiering** cho file ít truy cập
2. **Set up lifecycle policies** để xóa file cũ
3. **Monitor usage** qua AWS Cost Explorer
4. **Sử dụng CloudFront** để giảm S3 requests

## 8. Monitoring

1. **CloudWatch Metrics**: Monitor S3 requests, errors
2. **S3 Access Logs**: Track file access patterns
3. **CloudTrail**: Audit API calls
4. **Billing Alerts**: Set up cost alerts

## 9. Backup Strategy

1. **Enable versioning** cho bucket
2. **Cross-region replication** cho critical data
3. **Regular backup** của database references
4. **Disaster recovery plan**

## 10. Production Checklist

- [ ] Bucket created với proper naming
- [ ] IAM user với minimal permissions
- [ ] Environment variables configured
- [ ] CORS policy set up
- [ ] Bucket policy for public read
- [ ] Error handling tested
- [ ] File size limits enforced
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security review completed
