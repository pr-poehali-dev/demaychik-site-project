import { User, Business, PromoCode, Question, Theme } from '@/types/business';

const STORAGE_KEYS = {
  USERS: 'demaynchik_users',
  BUSINESSES: 'demaynchik_businesses',
  PROMO_CODES: 'demaynchik_promo_codes',
  QUESTIONS: 'demaynchik_questions',
  CURRENT_USER: 'demaynchik_current_user',
  THEME: 'demaynchik_theme',
  IP_REGISTRY: 'demaynchik_ip_registry',
};

const ADMIN_ACCOUNT = {
  username: 'DAMEYNCHEK',
  password: 'F11122233',
  id: 'admin_secret_id',
};

export const storageService = {
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  setUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getBusinesses(): Business[] {
    const data = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
    return data ? JSON.parse(data) : [];
  },

  setBusinesses(businesses: Business[]) {
    localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(businesses));
  },

  getPromoCodes(): PromoCode[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROMO_CODES);
    return data ? JSON.parse(data) : [];
  },

  setPromoCodes(codes: PromoCode[]) {
    localStorage.setItem(STORAGE_KEYS.PROMO_CODES, JSON.stringify(codes));
  },

  getQuestions(): Question[] {
    const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return data ? JSON.parse(data) : [];
  },

  setQuestions(questions: Question[]) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getTheme(): Theme {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return (theme as Theme) || 'business';
  },

  setTheme(theme: Theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  isAdminAccount(username: string, password: string): boolean {
    return username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password;
  },

  getAdminId(): string {
    return ADMIN_ACCOUNT.id;
  },

  checkUserBlocked(user: User): boolean {
    if (user.isPremium) return false;
    if (!user.trialEndsAt) return false;
    
    const trialEnd = new Date(user.trialEndsAt);
    const now = new Date();
    
    return now > trialEnd;
  },

  calculateTrialEnd(): Date {
    const now = new Date();
    return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  },

  getIPRegistry(): Record<string, string> {
    const data = localStorage.getItem(STORAGE_KEYS.IP_REGISTRY);
    return data ? JSON.parse(data) : {};
  },

  setIPRegistry(registry: Record<string, string>) {
    localStorage.setItem(STORAGE_KEYS.IP_REGISTRY, JSON.stringify(registry));
  },

  async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  },

  checkIPLimit(ip: string, userId: string): boolean {
    if (userId === ADMIN_ACCOUNT.id) return true;
    const registry = this.getIPRegistry();
    const existingUserId = registry[ip];
    return !existingUserId || existingUserId === userId;
  },

  registerIP(ip: string, userId: string) {
    if (userId === ADMIN_ACCOUNT.id) return;
    const registry = this.getIPRegistry();
    registry[ip] = userId;
    this.setIPRegistry(registry);
  },
};