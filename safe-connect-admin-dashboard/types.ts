export enum CaseStatus {
  PENDING = "Đang tìm kiếm",
  ASSIGNED = "Đã tiếp nhận",
  COMPLETED = "Hoàn thành",
}

export enum VolunteerType {
  INDIVIDUAL = "Cá nhân",
  ORGANIZATION = "Tổ chức",
}

export enum ApprovalStatus {
  PENDING = "Chờ xác thực",
  APPROVED = "Đã phê duyệt",
  REJECTED = "Bị từ chối",
}

export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  registrationDate: string;
  status: UserStatus;
  email?: string;
  roles?: string[];
}

export interface SOSCase {
  id: string;
  user: User;
  location: { lat: number; lng: number; address: string };
  timestamp: string;
  status: CaseStatus;
  volunteer?: User;
  chatHistory: { sender: string; message: string; time: string }[];
}

export interface VolunteerApplication {
  id: string;
  name: string;
  type: VolunteerType;
  submissionDate: string;
  status: ApprovalStatus;
  details: {
    phone: string;
    address: string;
    idCardUrlFront: string;
    idCardUrlBack: string;
    skills: string[];
    organizationDocsUrl?: string;
    reason?: string;
  };
}

export interface CommunityPost {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  timestamp: string;
  status: ApprovalStatus;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  author: User; // Admin user
  publishedDate: string;
}