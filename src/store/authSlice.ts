import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
}

// DEMO MODE: auto-authenticate with a fake user so all pages are viewable without a backend.
const demoUser = {
  id: 1,
  empId: 1,
  username: 'demo',
  fullName: 'Demo User',
  role: 'Admin',
  email: 'demo@vadpro.com',
} as unknown as User;

const initialState: AuthState = {
  token: 'demo-token',
  user: demoUser,
  isAuthenticated: true,
  permissions: ['*'],
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
