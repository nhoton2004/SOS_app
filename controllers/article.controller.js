const { Article } = require('../models');
const AppError = require('../utils/appError');
const { deleteFileFromS3, getFileUrl } = require('../config/s3');

// Tạo bài viết mới
const createArticle = async (req, res, next) => {
  try {
    const { title, content, category, status } = req.body;
    const authorId = req.user._id;

    // Xử lý hình ảnh nếu có
    let imageData = null;
    if (req.file) {
      imageData = {
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: req.file.key,
        url: req.file.location,
        mimeType: req.file.mimetype,
        size: req.file.size,
        acl: 'public-read',
        etag: req.file.etag
      };
    }

    // Xác định category và status
    const articleCategory = category || 'BLOG';
    const articleStatus = status || (articleCategory === 'COMMUNITY' ? 'PENDING' : 'APPROVED');
    
    // Nếu là BLOG và có quyền admin, có thể set status khác
    const allowedStatuses = ['DRAFT', 'PENDING', 'APPROVED'];
    const finalStatus = req.user.roles.includes('ADMIN') ? (status || articleStatus) : articleStatus;

    const article = await Article.create({
      title,
      content,
      images: imageData,
      author: authorId,
      authorName: req.user.fullName,
      category: articleCategory,
      status: finalStatus,
      publishedAt: finalStatus === 'APPROVED' ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      data: article,
    });
  } catch (error) {
    // Nếu có lỗi và đã upload file, xóa file khỏi S3
    if (req.file) {
      await deleteFileFromS3(req.file.key);
    }
    next(error);
  }
};

// Lấy danh sách bài viết
const getArticles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    
    // Filter theo category
    if (category) {
      query.category = category;
    }
    
    // Filter theo status
    if (status) {
      query.status = status;
    }
    
    // Tìm kiếm theo title và content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const articles = await Article.find(query)
      .populate('author', 'fullName avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Thêm thông tin user hiện tại có thích bài viết không
    if (req.user) {
      articles.forEach(article => {
        article.isLikedByCurrentUser = article.likedBy.includes(req.user._id.toString());
      });
    }

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết bài viết
const getArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id)
      .populate('author', 'fullName avatar')
      .lean();

    if (!article) {
      throw new AppError('Article not found', 404);
    }

    // Thêm thông tin user hiện tại có thích bài viết không
    if (req.user) {
      article.isLikedByCurrentUser = article.likedBy.includes(req.user._id.toString());
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật bài viết
const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user._id;

    const article = await Article.findById(id);
    if (!article) {
      throw new AppError('Article not found', 404);
    }

    // Kiểm tra quyền chỉnh sửa (chỉ tác giả hoặc admin)
    if (article.author.toString() !== userId.toString() && !req.user.roles.includes('ADMIN')) {
      throw new AppError('Not authorized to edit this article', 403);
    }

    const updateData = {
      lastEditedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;

    // Xử lý hình ảnh mới nếu có
    if (req.file) {
      // Xóa hình ảnh cũ nếu có
      if (article.images && article.images.key) {
        await deleteFileFromS3(article.images.key);
      }

      // Thêm hình ảnh mới
      updateData.images = {
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: req.file.key,
        url: req.file.location,
        mimeType: req.file.mimetype,
        size: req.file.size,
        acl: 'public-read',
        etag: req.file.etag
      };
    }

    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('author', 'fullName avatar');

    res.json({
      success: true,
      data: updatedArticle,
    });
  } catch (error) {
    // Nếu có lỗi và đã upload file mới, xóa file khỏi S3
    if (req.file) {
      await deleteFileFromS3(req.file.key);
    }
    next(error);
  }
};

// Thích/bỏ thích bài viết
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const article = await Article.findById(id);
    if (!article) {
      throw new AppError('Article not found', 404);
    }

    const isLiked = await article.toggleLike(userId);

    res.json({
      success: true,
      data: {
        isLiked,
        likeCount: article.likeCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Xóa bài viết
const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const article = await Article.findById(id);
    if (!article) {
      throw new AppError('Article not found', 404);
    }

    // Kiểm tra quyền xóa (chỉ tác giả hoặc admin)
    if (article.author.toString() !== userId.toString() && !req.user.roles.includes('ADMIN')) {
      throw new AppError('Not authorized to delete this article', 403);
    }

    // Xóa hình ảnh khỏi S3 nếu có
    if (article.images && article.images.key) {
      await deleteFileFromS3(article.images.key);
    }

    await Article.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Upload hình ảnh riêng lẻ (endpoint mới)
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No image file provided', 400);
    }

    const imageData = {
      bucket: process.env.AWS_S3_BUCKET_NAME,
      key: req.file.key,
      url: req.file.location,
      mimeType: req.file.mimetype,
      size: req.file.size,
      acl: 'public-read',
      etag: req.file.etag
    };

    res.json({
      success: true,
      data: imageData,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    // Nếu có lỗi và đã upload file, xóa file khỏi S3
    if (req.file) {
      await deleteFileFromS3(req.file.key);
    }
    next(error);
  }
};

// Duyệt bài viết (chỉ admin)
const approveArticle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);
    if (!article) {
      throw new AppError('Article not found', 404);
    }

    if (article.status === 'APPROVED') {
      throw new AppError('Article is already approved', 400);
    }

    article.status = 'APPROVED';
    article.rejectedReason = null;
    if (!article.publishedAt) {
      article.publishedAt = new Date();
    }
    await article.save();

    const articleObj = await Article.findById(id)
      .populate('author', 'fullName avatar')
      .lean();

    res.json({
      success: true,
      data: articleObj,
      message: 'Article approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Từ chối bài viết (chỉ admin)
const rejectArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectedReason } = req.body;

    if (!rejectedReason) {
      throw new AppError('Rejected reason is required', 400);
    }

    const article = await Article.findById(id);
    if (!article) {
      throw new AppError('Article not found', 404);
    }

    if (article.status === 'REJECTED') {
      throw new AppError('Article is already rejected', 400);
    }

    article.status = 'REJECTED';
    article.rejectedReason = rejectedReason;
    await article.save();

    const articleObj = await Article.findById(id)
      .populate('author', 'fullName avatar')
      .lean();

    res.json({
      success: true,
      data: articleObj,
      message: 'Article rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  toggleLike,
  deleteArticle,
  uploadImage,
  approveArticle,
  rejectArticle,
};
