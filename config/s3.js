// config/s3.js
const { S3Client, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');


// Cấu hình AWS S3 Client v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Cấu hình multer cho S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      // Tạo tên file unique
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `articles/${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedBy: req.user ? req.user._id.toString() : 'anonymous'
      });
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép upload hình ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ được upload file hình ảnh!'), false);
    }
  }
});

// Middleware để xử lý lỗi upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa là 5MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Trường file không đúng'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Quá nhiều file được upload'
      });
    }
  }
  
  if (error.message === 'Chỉ được upload file hình ảnh!') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Function để xóa file từ S3
const deleteFileFromS3 = async (key) => {
  try {
    if (!key) return true;
    
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(command);
    console.log(`File deleted from S3: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Function để lấy URL file từ S3
const getFileUrl = (key) => {
  if (!key) return null;
  
  // Nếu file đã có URL đầy đủ, trả về luôn
  if (key.startsWith('http')) {
    return key;
  }
  
  // Tạo URL từ S3
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`;
};

// Function để kiểm tra file có tồn tại trên S3 không
const checkFileExists = async (key) => {
  try {
    if (!key) return false;
    
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

// Function để lấy thông tin file từ S3
const getFileInfo = async (key) => {
  try {
    if (!key) return null;
    
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    });
    
    const data = await s3Client.send(command);
    return {
      size: data.ContentLength,
      lastModified: data.LastModified,
      contentType: data.ContentType,
      etag: data.ETag
    };
  } catch (error) {
    if (error.name === 'NotFound') {
      return null;
    }
    throw error;
  }
};

module.exports = {
  s3Client,
  upload,
  handleUploadError,
  deleteFileFromS3,
  getFileUrl,
  checkFileExists,
  getFileInfo
};