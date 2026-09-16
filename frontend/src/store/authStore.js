import { create } from 'zustand';

// Safely retrieve stored user and token from localStorage
const storedToken = localStorage.getItem('token');
let storedUser = null;
try {
  const userJson = localStorage.getItem('user');
  if (userJson) storedUser = JSON.parse(userJson);
} catch (e) {
  console.error('Failed to parse stored user', e);
}

export const useAuthStore = create((set) => ({
  token: storedToken || null,
  user: storedUser || null,
  isAuthenticated: !!storedToken && !!storedUser,

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  }
}));
