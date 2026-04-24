import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hrms_user') || 'null') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('hrms_token') : false,
  permissions: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hrms_permissions') || '[]') : [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hrms_token', action.payload.token);
        localStorage.setItem('hrms_user', JSON.stringify(action.payload.user));
      }
    },
    setPermissions(state, action: PayloadAction<string[]>) {
      state.permissions = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hrms_permissions', JSON.stringify(action.payload));
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.permissions = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        localStorage.removeItem('hrms_permissions');
      }
    },
  },
});

export const { setCredentials, setPermissions, logout } = authSlice.actions;
export default authSlice.reducer;
