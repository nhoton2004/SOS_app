import { User } from '../types';

// Map backend user format to frontend user format
export const mapBackendUserToFrontendUser = (backendUser: any): User => {
  return {
    id: backendUser._id || backendUser.id,
    name: backendUser.fullName || backendUser.name,
    avatar: backendUser.avatar?.url || backendUser.avatar || 'https://i.pravatar.cc/150',
    phone: backendUser.phone,
    registrationDate: backendUser.createdAt || new Date().toISOString(),
    status: backendUser.isActive !== false ? 'active' : 'suspended',
  };
};

