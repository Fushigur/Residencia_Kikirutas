import { defineStore } from 'pinia';

type Role = 'user' | 'admin' | null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuth: false,
    role: null as Role
  }),
  actions: {
    loginAs(role: Exclude<Role, null>) {
      this.isAuth = true;
      this.role = role;
    },
    logout() {
      this.isAuth = false;
      this.role = null;
    }
  }
});
