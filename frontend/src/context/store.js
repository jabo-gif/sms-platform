import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      theme:           'dark',

      login: async (email, password) => {
        try {
          const res = await authAPI.login({ email, password });
          const { token, user } = res.data;

          // Save token to localStorage directly
          localStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            theme: user.theme || 'dark',
          });

          document.documentElement.setAttribute('data-theme', user.theme || 'dark');
          toast.success(`Welcome back, ${user.name}! 👋`);
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          toast.error(msg);
          return { success: false, error: msg };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
        toast.success('Logged out');
      },

      toggleTheme: async () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        document.documentElement.setAttribute('data-theme', newTheme);
        try { await authAPI.updateTheme(newTheme); } catch {}
      },

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
    }),
    {
      name: 'sms-store',
      partialize: (s) => ({
        user:            s.user,
        token:           s.token,
        isAuthenticated: s.isAuthenticated,
        theme:           s.theme,
      }),
    }
  )
);

export default useStore;