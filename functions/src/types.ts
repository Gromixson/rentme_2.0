export type UserRole = 'SEEKER' | 'PROVIDER';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TIMEOUT';

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface UserDoc {
  email: string;
  name: string;
  roles: UserRole[];
  activeRole: UserRole;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export interface ProviderDoc {
  userId: string;
  hourlyRate: number;
  bio?: string;
  isOnline: boolean;
  averageRating: number;
  ratingCount: number;
  categories: string[];
  name: string;
  updatedAt?: FirebaseFirestore.Timestamp;
}

export interface CategoryDoc {
  name: string;
  parentId?: string | null;
  onlineCount?: number;
}

export interface RequestDoc {
  seekerId: string;
  providerId: string;
  categoryId: string;
  message: string;
  status: RequestStatus;
  expiresAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  seekerName?: string;
}

export interface BookingDoc {
  requestId: string;
  providerId: string;
  seekerId: string;
  categoryId: string;
  status: BookingStatus;
  createdAt: FirebaseFirestore.Timestamp;
  startTime?: FirebaseFirestore.Timestamp;
  endTime?: FirebaseFirestore.Timestamp;
}

export interface RatingDoc {
  bookingId: string;
  providerId: string;
  seekerId: string;
  rating: number;
  comment?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface InterestDoc {
  seekerId: string;
  seekerName: string;
  categoryId: string;
  createdAt: FirebaseFirestore.Timestamp;
}
