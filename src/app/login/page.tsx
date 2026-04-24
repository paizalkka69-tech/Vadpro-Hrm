'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, setPermissions } from '@/store/authSlice';
import { LoginResponse } from '@/types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', { username, password });
      if (res.data.success) {
        dispatch(setCredentials({ token: res.data.data.token, user: res.data.data.user }));
        // Fetch user permissions
        try {
          const permRes = await api.get<ApiResponse<string[]>>('/auth/permissions', {
            headers: { Authorization: `Bearer ${res.data.data.token}` },
          });
          if (permRes.data.success) dispatch(setPermissions(permRes.data.data));
        } catch { /* permissions will default to [] */ }
        router.push('/');
      } else {
        setError(res.data.message);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0FDF4' }}>
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>MyDreams HRM</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} required />
            <Button fullWidth variant="contained" type="submit" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Default: admin / Admin@123
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
