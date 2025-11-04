import api from '../utils/api';

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    fullName: string;
    phone: string;
    email?: string;
    avatar?: any;
    roles: string[];
    isActive: boolean;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    // Backend có thể trả về { token, user } hoặc { success: true, data: { token, user } }
    const data = response.data.data || response.data;
    return {
      token: data.token,
      user: data.user,
    };
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

