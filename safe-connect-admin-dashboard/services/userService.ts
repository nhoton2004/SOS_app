import api from '../utils/api';

export interface UserFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'suspended';
  role?: string;
  search?: string;
}

export interface UpdateUserData {
  isActive?: boolean;
  roles?: string[];
}

export const userService = {
  async getUsers(filters: UserFilters = {}) {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  async getUserById(id: string) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, data: UpdateUserData) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};

