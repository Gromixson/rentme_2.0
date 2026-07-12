export type UserRole = 'SEEKER' | 'PROVIDER';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TIMEOUT';
export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  roles: UserRole[];
  activeRole: UserRole;
}

export interface ProviderProfile {
  userId: string;
  name: string;
  hourlyRate: number;
  bio?: string;
  isOnline: boolean;
  averageRating: number;
  ratingCount: number;
  categories: string[];
}

export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  onlineCount?: number;
}

export interface ServiceRequest {
  id: string;
  seekerId: string;
  providerId: string;
  categoryId: string;
  message: string;
  status: RequestStatus;
  expiresAt: string;
  createdAt: string;
  seekerName?: string;
}

export interface Booking {
  id: string;
  requestId: string;
  providerId: string;
  seekerId: string;
  categoryId: string;
  status: BookingStatus;
  createdAt: string;
  startTime?: string;
  endTime?: string;
}

export interface ProviderListItem {
  id: string;
  userId: string;
  name: string;
  hourlyRate: number;
  bio: string;
  isOnline: boolean;
  averageRating: number;
  ratingCount: number;
  categories: string[];
}
