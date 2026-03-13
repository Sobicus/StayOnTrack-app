const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4800/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: ApiErrorBody | null,
  ) {
    super(`API Error ${status}`);
  }

  get messages(): string[] {
    if (!this.data) return ['Unknown error'];
    if (Array.isArray(this.data.message)) return this.data.message;
    return [this.data.message];
  }
}

// ---- Shared response types ----

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  weightKg: number | null;
  heightCm: number | null;
  goal: string | null;
  visibility: string;
  locale: string;
  streakShieldsRemaining: number;
  dayEndHour: number;
  currency: string;
  weekStartDay: string;
  onboardingCompleted: boolean;
  monthlySavingsGoal: number | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface Habit {
  id: string;
  title: string;
  emoji: string;
  category: string;
  habitType: string;
  caloriesPerOccurrence: number;
  pricePerOccurrence: number;
  frequencyType: string;
  occurrencesPerWeek: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: string;
  portionRatio: number;
  savedCalories: number;
  savedMoney: number;
  habit?: { title: string; emoji: string };
}

export interface DaySummary {
  date: string;
  logs: HabitLog[];
  totalSavedCalories: number;
  totalSavedMoney: number;
}

export interface Stats {
  totalSavedCalories: number;
  totalSavedMoney: number;
  potentialWeightAvoidedKg: number;
  totalCheckIns: number;
  totalDaysTracked: number;
}

export interface LiveStats {
  pastCalories: number;
  pastMoney: number;
  pastWeightKg: number;
  todayCalories: number;
  todayMoney: number;
  todayExpectedCalories: number;
  todayExpectedMoney: number;
  startedAt: string;
  dayEndHour: number;
}

export interface EffortEquivalent {
  activitySlug: string;
  activityName: string;
  amount: number;
  unit: string;
}

export interface WeeklyTrendPoint {
  week: string;
  savedCalories: number;
  savedMoney: number;
}

export interface Streak {
  currentStreak: number;
  bestStreak: number;
  streakShieldsRemaining: number;
  isShieldActive: boolean;
}

export interface Achievement {
  id: string;
  category: string;
  title: string;
  description: string;
  emoji: string;
  threshold: number;
  unit: string;
  progress: number;
  unlocked: boolean;
  progressPercent: number;
}

export interface AchievementsSummary {
  total: number;
  unlocked: number;
  achievements: Achievement[];
  recentlyUnlocked?: Achievement[];
}

export interface Friend {
  id: string;
  friendId: string;
  username: string;
  avatarUrl: string | null;
  since: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  toUsername: string;
  status: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  value: number;
  rank: number;
}

export interface Challenge {
  id: string;
  creatorUserId: string;
  creatorUsername: string;
  title: string;
  description: string | null;
  type: string;
  targetValue: number;
  habitId: string | null;
  startDate: string;
  endDate: string;
  status: string;
  winnerId: string | null;
  winnerUsername: string | null;
  participants: ChallengeParticipant[];
  createdAt: string;
}

export interface ChallengeParticipant {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  status: string;
  currentValue: number;
}

export interface Activity {
  id: string;
  slug: string;
  name: string;
  met: number;
  unit: string;
  caloriesPerUnit: number;
}

export interface FrequencyStatus {
  habitId: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface UpdateProfileData {
  username?: string;
  avatarUrl?: string;
  weightKg?: number;
  heightCm?: number;
  goal?: string;
  visibility?: string;
  locale?: string;
  dayEndHour?: number;
  currency?: string;
  weekStartDay?: string;
  onboardingCompleted?: boolean;
  monthlySavingsGoal?: number;
}

export interface CreateHabitData {
  title: string;
  emoji: string;
  category: string;
  caloriesPerOccurrence: number;
  pricePerOccurrence: number;
  frequencyType: string;
  occurrencesPerWeek?: number;
  occurrencesPerMonth?: number;
}

export interface CheckinData {
  habitId: string;
  status: string;
  date?: string;
  portionRatio?: number;
}

export interface CreateChallengeData {
  title: string;
  type: string;
  targetValue: number;
  startDate: string;
  endDate: string;
  inviteUsername: string;
  description?: string;
  habitId?: string;
}

// ---- Request function with retry ----

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const doFetch = async (): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new ApiError(res.status, data);
    }

    return data as T;
  };

  try {
    return await doFetch();
  } catch (err) {
    // Retry once on network errors (not API errors)
    if (err instanceof ApiError) throw err;
    return doFetch();
  }
}

// ---- API client ----

export const api = {
  auth: {
    register: (data: { email: string; password: string; username: string }) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: data }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: data }),
    refresh: (refreshToken: string) =>
      request<AuthResponse>('/auth/refresh', { method: 'POST', body: { refreshToken } }),
    logout: (token: string) =>
      request<void>('/auth/logout', { method: 'POST', token }),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token, newPassword } }),
    me: (token: string) =>
      request<UserProfile>('/auth/me', { token }),
  },

  users: {
    updateProfile: (token: string, data: UpdateProfileData) =>
      request<UserProfile>('/users/me', { method: 'PATCH', body: data, token }),
    deleteAccount: (token: string) =>
      request<void>('/users/me', { method: 'DELETE', token }),
    exportData: (token: string) =>
      request<Record<string, unknown>>('/users/me/export', { token }),
  },

  habits: {
    list: (token: string) =>
      request<Habit[]>('/habits', { token }),
    create: (token: string, data: CreateHabitData) =>
      request<Habit>('/habits', { method: 'POST', body: data, token }),
    update: (token: string, id: string, data: Partial<CreateHabitData>) =>
      request<Habit>(`/habits/${id}`, { method: 'PATCH', body: data, token }),
    delete: (token: string, id: string) =>
      request<void>(`/habits/${id}`, { method: 'DELETE', token }),
  },

  habitLogs: {
    checkin: (token: string, data: CheckinData) =>
      request<HabitLog>('/habit-logs', { method: 'POST', body: data, token }),
    today: async (token: string): Promise<HabitLog[]> => {
      const summary = await request<DaySummary>('/habit-logs/day', { token });
      return summary.logs || [];
    },
    history: (token: string, habitId: string, start?: string, end?: string) => {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const query = params.toString() ? `?${params}` : '';
      return request<HabitLog[]>(`/habit-logs/habit/${habitId}${query}`, { token });
    },
    range: (token: string, start: string, end: string) =>
      request<HabitLog[]>(`/habit-logs/range?start=${start}&end=${end}`, { token }),
    daySummary: (token: string, date: string) =>
      request<DaySummary>(`/habit-logs/day?date=${date}`, { token }),
    frequencyStatus: (token: string) =>
      request<FrequencyStatus[]>('/habit-logs/frequency-status', { token }),
  },

  stats: {
    get: (token: string) =>
      request<Stats>('/stats', { token }),
    equivalents: (token: string, weight?: number) => {
      const query = weight ? `?weight=${weight}` : '';
      return request<EffortEquivalent[]>(`/stats/equivalents${query}`, { token });
    },
    live: (token: string) =>
      request<LiveStats>('/stats/live', { token }),
    trends: (token: string, months?: number) => {
      const query = months ? `?months=${months}` : '';
      return request<WeeklyTrendPoint[]>(`/stats/trends${query}`, { token });
    },
  },

  streaks: {
    get: (token: string) =>
      request<Streak>('/streaks', { token }),
  },

  achievements: {
    get: (token: string) =>
      request<AchievementsSummary>('/achievements', { token }),
  },

  friends: {
    list: (token: string) =>
      request<Friend[]>('/friends', { token }),
    sendRequest: (token: string, username: string) =>
      request<FriendRequest>('/friends/requests', { method: 'POST', body: { username }, token }),
    incomingRequests: (token: string) =>
      request<FriendRequest[]>('/friends/requests/incoming', { token }),
    outgoingRequests: (token: string) =>
      request<FriendRequest[]>('/friends/requests/outgoing', { token }),
    acceptRequest: (token: string, id: string) =>
      request<void>(`/friends/requests/${id}/accept`, { method: 'PATCH', token }),
    declineRequest: (token: string, id: string) =>
      request<void>(`/friends/requests/${id}/decline`, { method: 'PATCH', token }),
    remove: (token: string, friendId: string) =>
      request<void>(`/friends/${friendId}`, { method: 'DELETE', token }),
    leaderboard: (token: string, metric?: string) => {
      const query = metric ? `?metric=${metric}` : '';
      return request<LeaderboardEntry[]>(`/friends/leaderboard${query}`, { token });
    },
  },

  challenges: {
    list: (token: string) =>
      request<Challenge[]>('/challenges', { token }),
    get: (token: string, id: string) =>
      request<Challenge>(`/challenges/${id}`, { token }),
    create: (token: string, data: CreateChallengeData) =>
      request<Challenge>('/challenges', { method: 'POST', body: data, token }),
    invitations: (token: string) =>
      request<Challenge[]>('/challenges/invitations', { token }),
    accept: (token: string, id: string) =>
      request<void>(`/challenges/${id}/accept`, { method: 'PATCH', token }),
    decline: (token: string, id: string) =>
      request<void>(`/challenges/${id}/decline`, { method: 'PATCH', token }),
    cancel: (token: string, id: string) =>
      request<void>(`/challenges/${id}/cancel`, { method: 'PATCH', token }),
  },

  activities: {
    list: (token: string) =>
      request<Activity[]>('/activities', { token }),
    seed: (token: string) =>
      request<{ message: string }>('/activities/seed', { method: 'POST', token }),
  },
};
