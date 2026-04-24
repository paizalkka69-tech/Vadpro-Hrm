const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function write(relPath, content) {
  const fullPath = path.join(srcDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trimStart(), 'utf8');
  console.log(`  ${relPath}`);
}

console.log('Generating frontend files...\n');

// ============================================================
// 1. API Client
// ============================================================
write('lib/api.ts', `
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5020';

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hrms_token');
    if (token) config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  errors?: string[];
}
`);

// ============================================================
// 2. Types
// ============================================================
write('types/index.ts', `
export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  companyId: number;
  branchId?: number;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Employee {
  id: number;
  empCode: string;
  nameEn: string;
  nameAr?: string;
  departmentName?: string;
  branchName?: string;
  designationName?: string;
  gradeName?: string;
  statusName?: string;
  statusId: number;
  doj: string;
  gender?: string;
  phone?: string;
  basicSalary: number;
  totalSalary: number;
}

export interface EmployeeDetail extends Employee {
  dob?: string;
  maritalStatus?: string;
  nationalityName?: string;
  religionName?: string;
  email?: string;
  personalEmail?: string;
  mobile?: string;
  address1?: string;
  city?: string;
  photoPath?: string;
  companyId: number;
  branchId: number;
  departmentId?: number;
  sectionId?: number;
  designationId?: number;
  gradeId?: number;
  categoryId?: number;
  nationalityId?: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  absentToday: number;
  newHiresThisMonth: number;
  departmentDistribution: { departmentName: string; count: number }[];
  expiringDocuments: { employeeName: string; documentType: string; expiryDate: string }[];
}

export interface LookupItem {
  id: number;
  nameEn: string;
  nameAr?: string;
  [key: string]: unknown;
}
`);

// ============================================================
// 3. Redux Store
// ============================================================
write('store/store.ts', `
'use client';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`);

write('store/authSlice.ts', `
'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('hrms_token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hrms_user') || 'null') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('hrms_token') : false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('hrms_token', action.payload.token);
      localStorage.setItem('hrms_user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
`);

write('store/hooks.ts', `
'use client';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
`);

// ============================================================
// 4. MUI Theme
// ============================================================
write('theme/theme.ts', `
'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1565C0', light: '#42A5F5', dark: '#0D47A1' },
    secondary: { main: '#00897B', light: '#4DB6AC', dark: '#00695C' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
    error: { main: '#D32F2F' },
    warning: { main: '#FF8F00' },
    success: { main: '#2E7D32' },
    info: { main: '#0288D1' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiCard: {
      styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
  },
});

export default theme;
`);

// ============================================================
// 5. Providers Wrapper
// ============================================================
write('components/providers/AppProviders.tsx', `
'use client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { store } from '@/store/store';
import theme from '@/theme/theme';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}
`);

// ============================================================
// 6. Layout Components
// ============================================================
const sidebarMenuItems = `
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
  { divider: true },
  { text: 'Branches', icon: <BusinessIcon />, path: '/organization/branches' },
  { text: 'Departments', icon: <AccountTreeIcon />, path: '/organization/departments' },
  { text: 'Designations', icon: <BadgeIcon />, path: '/organization/designations' },
  { text: 'Sections', icon: <WorkspacesIcon />, path: '/organization/sections' },
  { text: 'Grades', icon: <GradeIcon />, path: '/organization/grades' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/organization/categories' },
  { divider: true },
  { text: 'Attendance', icon: <AccessTimeIcon />, path: '/attendance' },
  { text: 'Leave', icon: <EventBusyIcon />, path: '/leave' },
  { text: 'Payroll', icon: <PaymentsIcon />, path: '/payroll' },
  { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
] as const;`;

write('components/layout/Sidebar.tsx', `
'use client';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Toolbar, Box, Typography, IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, People as PeopleIcon, Business as BusinessIcon,
  AccountTree as AccountTreeIcon, Badge as BadgeIcon, Workspaces as WorkspacesIcon,
  Grade as GradeIcon, Category as CategoryIcon, AccessTime as AccessTimeIcon,
  EventBusy as EventBusyIcon, Payments as PaymentsIcon, Description as DescriptionIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

${sidebarMenuItems}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" color="primary" fontWeight={700}>VADPRO</Typography>
          <Typography variant="caption" color="text.secondary">HRMS</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><ChevronLeftIcon /></IconButton>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 0.5 }}>
        {menuItems.map((item, i) =>
          'divider' in item ? (
            <Divider key={i} sx={{ my: 1 }} />
          ) : (
            <ListItemButton
              key={item.path}
              selected={pathname === item.path}
              onClick={() => router.push(item.path)}
              sx={{ borderRadius: 1, mb: 0.25, '&.Mui-selected': { bgcolor: 'primary.light', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } } }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem' }} />
            </ListItemButton>
          )
        )}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
`);

write('components/layout/TopBar.tsx', `
'use client';
import { AppBar, Toolbar, IconButton, Typography, Box, Chip, Menu, MenuItem } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Logout as LogoutIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { DRAWER_WIDTH } from './Sidebar';

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: sidebarOpen ? \`calc(100% - \${DRAWER_WIDTH}px)\` : '100%',
        ml: sidebarOpen ? \`\${DRAWER_WIDTH}px\` : 0,
        transition: 'width 0.2s, margin-left 0.2s',
      }}
    >
      <Toolbar>
        {!sidebarOpen && (
          <IconButton edge="start" onClick={onToggleSidebar} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          VADPRO HRMS
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={user?.role || 'User'} size="small" color="primary" variant="outlined" />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <AccountCircle />
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.fullName}</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
`);

write('components/layout/MainLayout.tsx', `
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import TopBar from './TopBar';
import { useAppSelector } from '@/store/hooks';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(true)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: sidebarOpen ? \`calc(100% - \${DRAWER_WIDTH}px)\` : '100%',
          ml: sidebarOpen ? 0 : 0,
          transition: 'width 0.2s',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
`);

// ============================================================
// 7. Root Layout (replace default)
// ============================================================
write('app/layout.tsx', `
import type { Metadata } from 'next';
import AppProviders from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'VADPRO HRMS',
  description: 'VADPRO Human Resource Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
`);

// ============================================================
// 8. Login Page
// ============================================================
write('app/login/page.tsx', `
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F4F8' }}>
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>VADPRO HRMS</Typography>
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
`);

// ============================================================
// 9. Dashboard Layout (with sidebar)
// ============================================================
write('app/(dashboard)/layout.tsx', `
import MainLayout from '@/components/layout/MainLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
`);

// ============================================================
// 10. Dashboard Page
// ============================================================
write('app/(dashboard)/page.tsx', `
'use client';
import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import {
  People as PeopleIcon, CheckCircle as PresentIcon,
  EventBusy as LeaveIcon, PersonOff as AbsentIcon,
  TrendingUp as NewHiresIcon,
} from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { DashboardStats } from '@/types';

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ bgcolor: color + '15', borderRadius: 2, p: 1.5, display: 'flex' }}>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ p: 3 }}>{[1,2,3,4].map(i => <Skeleton key={i} height={100} sx={{ mb: 2 }} />)}</Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Employees" value={stats?.totalEmployees || 0} icon={<PeopleIcon />} color="#1565C0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Present Today" value={stats?.presentToday || 0} icon={<PresentIcon />} color="#2E7D32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="On Leave" value={stats?.onLeaveToday || 0} icon={<LeaveIcon />} color="#FF8F00" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Absent" value={stats?.absentToday || 0} icon={<AbsentIcon />} color="#D32F2F" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Employees" value={stats?.activeEmployees || 0} icon={<PeopleIcon />} color="#00897B" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="New Hires (Month)" value={stats?.newHiresThisMonth || 0} icon={<NewHiresIcon />} color="#7B1FA2" />
        </Grid>
      </Grid>

      {stats?.departmentDistribution && stats.departmentDistribution.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Department Distribution</Typography>
            {stats.departmentDistribution.map((dept) => (
              <Box key={dept.departmentName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2">{dept.departmentName}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: Math.max(dept.count * 30, 20), height: 8, bgcolor: 'primary.main', borderRadius: 1 }} />
                  <Typography variant="body2" fontWeight={600}>{dept.count}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
`);

// ============================================================
// 11. Employee List Page
// ============================================================
write('app/(dashboard)/employees/page.tsx', `
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, TextField, Card, CardContent, Chip,
  InputAdornment, MenuItem, Select, FormControl, InputLabel, SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { Employee, LookupItem } from '@/types';

export default function EmployeesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState<LookupItem[]>([]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1),
        pageSize: String(paginationModel.pageSize),
      });
      if (search) params.set('search', search);
      if (deptFilter) params.set('departmentId', deptFilter);
      const res = await api.get<ApiResponse<Employee[]>>(\`/employees?\${params}\`);
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [paginationModel, search, deptFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => {
    api.get<ApiResponse<LookupItem[]>>('/lookups/departments').then(r => setDepartments(r.data.data || []));
  }, []);

  const columns: GridColDef[] = [
    { field: 'empCode', headerName: 'Code', width: 110 },
    { field: 'nameEn', headerName: 'Name', flex: 1, minWidth: 180 },
    { field: 'departmentName', headerName: 'Department', width: 160 },
    { field: 'designationName', headerName: 'Designation', width: 160 },
    { field: 'branchName', headerName: 'Branch', width: 160 },
    {
      field: 'statusName', headerName: 'Status', width: 100,
      renderCell: (params) => <Chip label={params.value || 'N/A'} size="small" color={params.row.statusId === 1 ? 'success' : 'default'} />,
    },
    { field: 'doj', headerName: 'Joined', width: 110, valueFormatter: (value: string) => value ? new Date(value).toLocaleDateString() : '' },
    { field: 'basicSalary', headerName: 'Basic Salary', width: 120, type: 'number', valueFormatter: (value: number) => value?.toLocaleString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Employees</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/employees/add')}>
          Add Employee
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, pb: '16px !important' }}>
          <TextField
            placeholder="Search by name or code..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select value={deptFilter} label="Department" onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={totalCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          onRowClick={(params) => router.push(\`/employees/\${params.id}\`)}
          sx={{ border: 0, minHeight: 400, '& .MuiDataGrid-row': { cursor: 'pointer' } }}
          disableRowSelectionOnClick
        />
      </Card>
    </Box>
  );
}
`);

// ============================================================
// 12. Employee Detail Page
// ============================================================
write('app/(dashboard)/employees/[id]/page.tsx', `
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Skeleton, Divider, Tab, Tabs,
} from '@mui/material';
import { ArrowBack, Edit as EditIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { EmployeeDetail } from '@/types';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    api.get<ApiResponse<EmployeeDetail>>(\`/employees/\${id}\`)
      .then((r) => setEmp(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box>{[1,2,3].map(i => <Skeleton key={i} height={80} sx={{ mb: 2 }} />)}</Box>;
  if (!emp) return <Typography>Employee not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/employees')}>Back</Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>{emp.nameEn}</Typography>
          <Typography variant="body2" color="text.secondary">{emp.empCode} | {emp.designationName}</Typography>
        </Box>
        <Chip label={emp.statusName || 'Active'} color={emp.statusId === 1 ? 'success' : 'default'} />
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => router.push(\`/employees/\${id}/edit\`)}>Edit</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Personal" />
        <Tab label="Employment" />
        <Tab label="Salary" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Full Name (English)" value={emp.nameEn} />
                <InfoRow label="Full Name (Arabic)" value={emp.nameAr} />
                <InfoRow label="Gender" value={emp.gender === 'M' ? 'Male' : 'Female'} />
                <InfoRow label="Date of Birth" value={emp.dob ? new Date(emp.dob).toLocaleDateString() : undefined} />
                <InfoRow label="Marital Status" value={emp.maritalStatus === 'S' ? 'Single' : emp.maritalStatus === 'M' ? 'Married' : emp.maritalStatus} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Nationality" value={emp.nationalityName} />
                <InfoRow label="Email" value={emp.email} />
                <InfoRow label="Personal Email" value={emp.personalEmail} />
                <InfoRow label="Phone" value={emp.phone} />
                <InfoRow label="Mobile" value={emp.mobile} />
                <InfoRow label="Address" value={emp.address1} />
                <InfoRow label="City" value={emp.city} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Employee Code" value={emp.empCode} />
                <InfoRow label="Date of Joining" value={emp.doj ? new Date(emp.doj).toLocaleDateString() : undefined} />
                <InfoRow label="Department" value={emp.departmentName} />
                <InfoRow label="Designation" value={emp.designationName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Branch" value={emp.branchName} />
                <InfoRow label="Grade" value={emp.gradeName} />
                <InfoRow label="Status" value={emp.statusName} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Basic Salary" value={emp.basicSalary?.toLocaleString()} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Total Salary" value={emp.totalSalary?.toLocaleString()} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
`);

// ============================================================
// 13. Add Employee Page
// ============================================================
write('app/(dashboard)/employees/add/page.tsx', `
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  MenuItem, Alert, CircularProgress,
} from '@mui/material';
import { ArrowBack, Save as SaveIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { LookupItem } from '@/types';

export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lookups
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [branches, setBranches] = useState<LookupItem[]>([]);
  const [designations, setDesignations] = useState<LookupItem[]>([]);
  const [grades, setGrades] = useState<LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<LookupItem[]>([]);

  // Form
  const [form, setForm] = useState({
    empCode: '', nameEn: '', nameAr: '', gender: 'M', dob: '', maritalStatus: 'S',
    doj: new Date().toISOString().split('T')[0],
    companyId: 1, branchId: '', departmentId: '', sectionId: '',
    designationId: '', gradeId: '', categoryId: '', nationalityId: '',
    phone: '', mobile: '', email: '', basicSalary: '', totalSalary: '',
  });

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<LookupItem[]>>('/lookups/departments'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/branches'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/designations'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/grades'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/nationalities'),
    ]).then(([depts, br, desig, gr, nat]) => {
      setDepartments(depts.data.data || []);
      setBranches(br.data.data || []);
      setDesignations(desig.data.data || []);
      setGrades(gr.data.data || []);
      setNationalities(nat.data.data || []);
    });
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const payload = {
        ...form,
        companyId: Number(form.companyId),
        branchId: Number(form.branchId) || undefined,
        departmentId: Number(form.departmentId) || undefined,
        designationId: Number(form.designationId) || undefined,
        gradeId: Number(form.gradeId) || undefined,
        nationalityId: Number(form.nationalityId) || undefined,
        basicSalary: Number(form.basicSalary) || 0,
        totalSalary: Number(form.totalSalary) || 0,
        dob: form.dob || undefined,
      };
      const res = await api.post<ApiResponse<{ id: number }>>('/employees', payload);
      if (res.data.success) {
        setSuccess('Employee created successfully');
        setTimeout(() => router.push('/employees'), 1000);
      } else {
        setError(res.data.message);
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create employee');
    } finally { setLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/employees')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>Add Employee</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Employee Code" value={form.empCode} onChange={handleChange('empCode')} required /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Name (English)" value={form.nameEn} onChange={handleChange('nameEn')} required /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Name (Arabic)" value={form.nameAr} onChange={handleChange('nameAr')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Gender" value={form.gender} onChange={handleChange('gender')}><MenuItem value="M">Male</MenuItem><MenuItem value="F">Female</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Date of Birth" type="date" value={form.dob} onChange={handleChange('dob')} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Marital Status" value={form.maritalStatus} onChange={handleChange('maritalStatus')}><MenuItem value="S">Single</MenuItem><MenuItem value="M">Married</MenuItem><MenuItem value="D">Divorced</MenuItem><MenuItem value="W">Widowed</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Nationality" value={form.nationalityId} onChange={handleChange('nationalityId')}><MenuItem value="">Select</MenuItem>{nationalities.map(n => <MenuItem key={n.id} value={n.id}>{n.nameEn}</MenuItem>)}</TextField></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Employment Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Date of Joining" type="date" value={form.doj} onChange={handleChange('doj')} InputLabelProps={{ shrink: true }} required /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Branch" value={form.branchId} onChange={handleChange('branchId')} required><MenuItem value="">Select</MenuItem>{branches.map(b => <MenuItem key={b.id} value={b.id}>{b.nameEn}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Department" value={form.departmentId} onChange={handleChange('departmentId')}><MenuItem value="">Select</MenuItem>{departments.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Designation" value={form.designationId} onChange={handleChange('designationId')}><MenuItem value="">Select</MenuItem>{designations.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Grade" value={form.gradeId} onChange={handleChange('gradeId')}><MenuItem value="">Select</MenuItem>{grades.map(g => <MenuItem key={g.id} value={g.id}>{g.nameEn}</MenuItem>)}</TextField></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Contact & Salary</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Phone" value={form.phone} onChange={handleChange('phone')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Mobile" value={form.mobile} onChange={handleChange('mobile')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }} />
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Basic Salary" type="number" value={form.basicSalary} onChange={handleChange('basicSalary')} required /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Total Salary" type="number" value={form.totalSalary} onChange={handleChange('totalSalary')} required /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push('/employees')}>Cancel</Button>
          <Button variant="contained" type="submit" startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />} disabled={loading}>
            Save Employee
          </Button>
        </Box>
      </form>
    </Box>
  );
}
`);

// ============================================================
// 14. Organization CRUD Pages
// ============================================================
function generateOrgPage(name, plural, endpoint, fields) {
  write(`app/(dashboard)/organization/${plural.toLowerCase()}/page.tsx`, `
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import api, { ApiResponse } from '@/lib/api';

interface ${name}Item {
  id: number;
  ${fields.map(f => `${f.field}: ${f.type};`).join('\n  ')}
}

export default function ${plural}Page() {
  const [rows, setRows] = useState<${name}Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<${name}Item[]>>('/lookups/${endpoint}');
      setRows(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: GridColDef[] = [
    ${fields.filter(f => !f.hidden).map(f => {
      if (f.field === 'isActive' || f.field === 'isGCC') return `{ field: '${f.field}', headerName: '${f.header}', width: 100, renderCell: (p) => <Chip label={p.value ? 'Yes' : 'No'} size="small" color={p.value ? 'success' : 'default'} /> }`;
      return `{ field: '${f.field}', headerName: '${f.header}', ${f.flex ? 'flex: 1, minWidth: 150' : `width: ${f.width || 150}`} }`;
    }).join(',\n    ')}
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>${plural}</Typography>
      </Box>
      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50]}
          sx={{ border: 0, minHeight: 400 }}
          disableRowSelectionOnClick
        />
      </Card>
    </Box>
  );
}
`);
}

generateOrgPage('Branch', 'Branches', 'branches', [
  { field: 'branchCode', header: 'Code', type: 'string', width: 120 },
  { field: 'nameEn', header: 'Name (English)', type: 'string', flex: true },
  { field: 'nameAr', header: 'Name (Arabic)', type: 'string', flex: true },
]);

generateOrgPage('Department', 'Departments', 'departments', [
  { field: 'deptCode', header: 'Code', type: 'string', width: 120 },
  { field: 'nameEn', header: 'Name (English)', type: 'string', flex: true },
  { field: 'nameAr', header: 'Name (Arabic)', type: 'string', flex: true },
]);

generateOrgPage('Designation', 'Designations', 'designations', [
  { field: 'desigCode', header: 'Code', type: 'string', width: 120 },
  { field: 'nameEn', header: 'Name (English)', type: 'string', flex: true },
  { field: 'nameAr', header: 'Name (Arabic)', type: 'string', flex: true },
]);

generateOrgPage('Section', 'Sections', 'sections', [
  { field: 'sectionCode', header: 'Code', type: 'string', width: 120 },
  { field: 'nameEn', header: 'Name (English)', type: 'string', flex: true },
  { field: 'nameAr', header: 'Name (Arabic)', type: 'string', flex: true },
  { field: 'departmentId', header: 'Department ID', type: 'number', width: 130 },
]);

generateOrgPage('Grade', 'Grades', 'grades', [
  { field: 'gradeCode', header: 'Code', type: 'string', width: 120 },
  { field: 'nameEn', header: 'Name (English)', type: 'string', flex: true },
  { field: 'nameAr', header: 'Name (Arabic)', type: 'string', flex: true },
]);

generateOrgPage('Category', 'Categories', 'categories', [
  { field: 'categoryCode', header: 'Code', type: 'string', width: 120 },
  { field: 'nameEn', header: 'Name (English)', type: 'string', flex: true },
  { field: 'nameAr', header: 'Name (Arabic)', type: 'string', flex: true },
]);

// ============================================================
// 15. Root page redirect
// ============================================================
write('app/page.tsx', `
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/login');
}
`);

// ============================================================
// 16. Global CSS (minimal)
// ============================================================
write('app/globals.css', `
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

body {
  font-family: 'Inter', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}
`);

// ============================================================
// 17. Environment file
// ============================================================
const envFile = path.join(__dirname, '.env.local');
if (!fs.existsSync(envFile)) {
  fs.writeFileSync(envFile, 'NEXT_PUBLIC_API_URL=http://localhost:5020\n', 'utf8');
  console.log('  .env.local');
}

console.log(`\nDone! Generated all frontend files.`);
console.log('Run: cd vadpro-hrms && npm run dev');
