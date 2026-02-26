import {
  User,
  Trip,
  TripParticipant,
  Activity,
  Hotel,
  Expense,
  ExpenseParticipant,
} from '@prisma/client';

// Extended Types with Relations
export type TripWithRelations = Trip & {
  createdBy: User;
  participants: TripParticipant[];
  activities: Activity[];
  hotels: Hotel[];
  expenses: Expense[];
};

export type TripParticipantWithUser = TripParticipant & {
  user: User | null;
};

export type ActivityWithTrip = Activity & {
  trip: Trip;
};

export type ExpenseWithDetails = Expense & {
  createdBy: User;
  participants: Array<{
    id: string;
    participantId: string;
    amount: number;
    participant: TripParticipant;
  }>;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// UI Component Props
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Session Types
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface ExtendedSession {
  user?: SessionUser;
  expires: string;
}
