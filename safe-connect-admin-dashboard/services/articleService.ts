import api from '../utils/api';

export interface ArticleFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: 'BLOG' | 'COMMUNITY';
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CreateArticleData {
  title: string;
  content: string;
  category?: 'BLOG' | 'COMMUNITY';
  status?: 'DRAFT' | 'PENDING' | 'APPROVED';
}

export const articleService = {
  async getArticles(filters: ArticleFilters = {}) {
    const response = await api.get('/articles', { params: filters });
    return response.data;
  },

  async getArticleById(id: string) {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  },

  async createArticle(data: CreateArticleData, imageFile?: File) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.category) formData.append('category', data.category);
    if (data.status) formData.append('status', data.status);
    if (imageFile) formData.append('image', imageFile);

    const response = await api.post('/articles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateArticle(id: string, data: Partial<CreateArticleData>, imageFile?: File) {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.category) formData.append('category', data.category);
    if (data.status) formData.append('status', data.status);
    if (imageFile) formData.append('image', imageFile);

    const response = await api.put(`/articles/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteArticle(id: string) {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  },

  async approveArticle(id: string) {
    const response = await api.post(`/articles/${id}/approve`);
    return response.data;
  },

  async rejectArticle(id: string, rejectedReason: string) {
    const response = await api.post(`/articles/${id}/reject`, { rejectedReason });
    return response.data;
  },
};

