const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4800/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`API Error ${status}`);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
}

// Auth
export const api = {
  auth: {
    register: (data: { email: string; password: string; username: string }) =>
      request<{ accessToken: string; user: any }>('/auth/register', { method: 'POST', body: data }),
    login: (data: { email: string; password: string }) =>
      request<{ accessToken: string; user: any }>('/auth/login', { method: 'POST', body: data }),
    me: (token: string) =>
      request<any>('/auth/me', { token }),
  },

  users: {
    updateProfile: (token: string, data: any) =>
      request<any>('/users/me', { method: 'PATCH', body: data, token }),
  },

  habits: {
    list: (token: string) =>
      request<any[]>('/habits', { token }),
    create: (token: string, data: any) =>
      request<any>('/habits', { method: 'POST', body: data, token }),
    update: (token: string, id: string, data: any) =>
      request<any>(`/habits/${id}`, { method: 'PATCH', body: data, token }),
    delete: (token: string, id: string) =>
      request<void>(`/habits/${id}`, { method: 'DELETE', token }),
  },

  habitLogs: {
    checkin: (token: string, data: any) =>
      request<any>('/habit-logs', { method: 'POST', body: data, token }),
    today: async (token: string) => {
      const summary = await request<{ logs: any[] }>('/habit-logs/day', { token });
      return summary.logs || [];
    },
    history: (token: string, habitId: string, start?: string, end?: string) => {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const query = params.toString() ? `?${params}` : '';
      return request<any[]>(`/habit-logs/habit/${habitId}${query}`, { token });
    },
    range: (token: string, start: string, end: string) =>
      request<any[]>(`/habit-logs/range?start=${start}&end=${end}`, { token }),
    daySummary: (token: string, date: string) =>
      request<any>(`/habit-logs/day?date=${date}`, { token }),
  },

  stats: {
    get: (token: string) =>
      request<any>('/stats', { token }),
    equivalents: (token: string, weight?: number) => {
      const query = weight ? `?weight=${weight}` : '';
      return request<any[]>(`/stats/equivalents${query}`, { token });
    },
  },

  streaks: {
    get: (token: string) =>
      request<any>('/streaks', { token }),
  },

  achievements: {
    get: (token: string) =>
      request<any>('/achievements', { token }),
  },

  activities: {
    list: (token: string) =>
      request<any[]>('/activities', { token }),
    seed: (token: string) =>
      request<any>('/activities/seed', { method: 'POST', token }),
  },
};
