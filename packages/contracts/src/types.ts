import {
  ProfileVisibility,
  HabitCategory,
  HabitType,
  HabitFrequencyType,
  HabitLogStatus,
  ActivityCategory,
  ActivityUnit,
  FriendRequestStatus,
  ChallengeType,
  ChallengeStatus,
  ChallengeParticipantStatus,
  ChallengeVisibility,
  Locale,
} from './enums';

export interface IUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  weightKg?: number;
  heightCm?: number;
  goal?: string;
  visibility: ProfileVisibility;
  locale: Locale;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHabit {
  id: string;
  userId: string;
  title: string;
  category: HabitCategory;
  habitType: HabitType;
  caloriesPerOccurrence: number;
  pricePerOccurrence: number;
  frequencyType: HabitFrequencyType;
  occurrencesPerWeek?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  status: HabitLogStatus;
  portionRatio: number;
  savedCalories: number;
  savedMoney: number;
  createdAt: Date;
}

export interface IActivityEquivalent {
  id: string;
  slug: string;
  name: string;
  category: ActivityCategory;
  unit: ActivityUnit;
  met?: number;
  caloriesPerUnitBase: number;
  baseWeightKg: number;
  isActive: boolean;
}

export interface IFriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
}

export interface IFriendship {
  id: string;
  userId: string;
  friendId: string;
  createdAt: Date;
}

export interface IChallenge {
  id: string;
  creatorUserId: string;
  title: string;
  description?: string;
  type: ChallengeType;
  visibility: ChallengeVisibility;
  targetValue: number;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  createdAt: Date;
}

export interface IChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  status: ChallengeParticipantStatus;
  currentValue: number;
  joinedAt?: Date;
}

export interface IUserStats {
  totalSavedCalories: number;
  totalSavedMoney: number;
  totalWeightAvoidedKg: number;
  currentStreak: number;
  bestStreak: number;
  streakShieldsRemaining: number;
}
