import api from '../utils/api';

export interface SosCaseFilters {
  page?: number;
  limit?: number;
  status?: string;
  emergencyType?: string;
  reporterId?: string;
  acceptedBy?: string;
}

export const sosService = {
  async getSosCases(filters: SosCaseFilters = {}) {
    const response = await api.get('/sos', { params: filters });
    // Backend trả về { success: true, data: [...], pagination: {...} }
    // Hoặc có thể trả về trực tiếp array
    return response.data;
  },

  async getSosCaseById(id: string) {
    const response = await api.get(`/sos/${id}`);
    return response.data;
  },

  async cancelSosCase(id: string, cancelReason: string) {
    const response = await api.post(`/sos/${id}/cancel`, { cancelReason });
    return response.data;
  },

  async deleteSosCase(id: string) {
    const response = await api.delete(`/admin/sos-cases/${id}`);
    return response.data;
  },
};

