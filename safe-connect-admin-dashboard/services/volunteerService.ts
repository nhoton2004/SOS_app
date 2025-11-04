import api from '../utils/api';

export interface VolunteerFilters {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  type?: 'CN' | 'TC';
}

export const volunteerService = {
  async getVolunteers(filters: VolunteerFilters = {}) {
    const response = await api.get('/admin/volunteers', { params: filters });
    return response.data;
  },

  async getVolunteerById(id: string) {
    const response = await api.get(`/admin/volunteers/${id}`);
    return response.data;
  },

  async approveVolunteer(id: string) {
    const response = await api.post(`/admin/volunteers/${id}/approve`);
    return response.data;
  },

  async rejectVolunteer(id: string, reviewNotes: string) {
    const response = await api.post(`/admin/volunteers/${id}/reject`, { reviewNotes });
    return response.data;
  },

  async updateVolunteer(id: string, data: { ready?: boolean; skills?: string[]; reviewNotes?: string }) {
    const response = await api.put(`/admin/volunteers/${id}`, data);
    return response.data;
  },
};

