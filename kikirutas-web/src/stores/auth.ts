import { defineStore } from 'pinia';

type Role = 'user' | 'admin' | null;
type AuthState = {
  isAuth: boolean;
  role: Role;
  displayName: string | null;
};

const STORAGE_KEY = 'auth_state';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuth: false,
    role: null,
    displayName: null,
  }),

  getters: {
    isAdmin: (s) => s.isAuth && s.role === 'admin',
    isUser:  (s) => s.isAuth && s.role === 'user',
  },

  actions: {
    loginAs(role: 'user' | 'admin', displayName?: string) {
      this.isAuth = true;
      this.role = role;
      this.displayName = displayName ?? (role === 'admin' ? 'Administración' : 'Usuaria');
      this.saveToStorage();
    },

    logout() {
      this.$reset();
      localStorage.removeItem(STORAGE_KEY);
    },

    saveToStorage() {
      const data = {
        isAuth: this.isAuth,
        role: this.role,
        displayName: this.displayName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        this.isAuth = !!data.isAuth;
        this.role = (data.role ?? null) as Role;
        this.displayName = data.displayName ?? null;
      } catch {
        this.$reset();
      }
    },
  },
});
