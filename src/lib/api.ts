const API_URL = 'https://functions.poehali.dev/6d28bf49-326f-4deb-9a21-ea676cf9a122';

export interface ApiQuestion {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  user_id: number;
  username: string;
  avatar_url: string;
  is_premium: boolean;
  answer_count: number;
}

export interface ApiAnswer {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  avatar_url: string;
  is_premium: boolean;
  like_count: number;
  liked_by: number[];
}

export interface ApiQuestionDetail extends Omit<ApiQuestion, 'answer_count'> {
  answers: ApiAnswer[];
}

export class CommunityApi {
  private userId: number | null = null;

  setUserId(id: number) {
    this.userId = id;
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.userId) {
      headers['X-User-Id'] = String(this.userId);
    }

    const response = await fetch(`${API_URL}?path=${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getQuestions(): Promise<{ questions: ApiQuestion[] }> {
    return this.request('questions', { method: 'GET' });
  }

  async getQuestion(id: number): Promise<ApiQuestionDetail> {
    return this.request(`question/${id}`, { method: 'GET' });
  }

  async createQuestion(data: {
    title: string;
    content: string;
    category: string;
  }): Promise<{ success: boolean; question_id: number; created_at: string }> {
    return this.request('question', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createAnswer(data: {
    question_id: number;
    content: string;
  }): Promise<{ success: boolean; answer_id: number; created_at: string }> {
    return this.request('answer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleLike(answerId: number): Promise<{
    success: boolean;
    action: 'added' | 'removed';
    like_count: number;
  }> {
    return this.request('like', {
      method: 'POST',
      body: JSON.stringify({ answer_id: answerId }),
    });
  }

  async createOrUpdateUser(data: {
    username: string;
    email: string;
    avatar_url?: string;
    is_premium?: boolean;
    ip_address?: string;
  }): Promise<{ success: boolean; user_id: number }> {
    return this.request('user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const communityApi = new CommunityApi();
