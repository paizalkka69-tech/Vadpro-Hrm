'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Chip, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Tooltip, InputAdornment, CircularProgress, Tab, Tabs,
  Switch, FormControlLabel, Checkbox, LinearProgress,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add, Edit, Delete, Search, Refresh, People, Security,
  History, SwapVert, FilterList, LockReset, Upload, Download,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import api, { type ApiResponse } from '@/lib/api';

// ── Types ──
interface UserRow {
  id: number; username: string; email: string; fullName: string;
  roleId: number; roleName: string; companyId: number | null;
  branchId: number | null; employeeId: number | null;
  isActive: boolean; lastLoginDate: string | null; createdDate: string;
}
interface RoleOption { id: number; roleName: string; }
interface RoleRow {
  id: number; roleName: string; description: string | null;
  isActive: boolean; userCount: number; permissions: string[];
}
interface AuditRow {
  id: number; userName: string | null; tableName: string; actionType: string;
  recordId: number | null; oldValues: string | null; newValues: string | null;
  actionDate: string; ipAddress: string | null;
}
interface ImportResult {
  totalRows: number; successCount: number; errorCount: number; errors: string[];
}

const PERMISSION_MODULES = [
  'Dashboard', 'Employees', 'Organization', 'Attendance', 'Leave',
  'Documents', 'Contracts', 'Payroll', 'Loans', 'EOS', 'Insurance',
  'Reports', 'Settings',
];
const PERMISSION_TYPES = ['View', 'Create', 'Edit', 'Delete'];

// ── Main Page ──
export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Settings</Typography>
          <Typography variant="body2" color="text.secondary">Manage users, roles, permissions, and system configuration</Typography>
        </Box>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<People />} label="Users" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<Security />} label="Roles & Permissions" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<History />} label="Audit Log" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<SwapVert />} label="Import / Export" iconPosition="start" sx={{ minHeight: 48 }} />
      </Tabs>
      {tab === 0 && <UsersTab />}
      {tab === 1 && <RolesTab />}
      {tab === 2 && <AuditLogTab />}
      {tab === 3 && <ImportExportTab />}
    </Box>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 1: USERS
// ════════════════════════════════════════════════════════════
function UsersTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<number | ''>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', fullName: '',
    roleId: '' as number | '', companyId: '1', branchId: '', employeeId: '', isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<RoleRow[]>>('/settings/roles').then(r => {
      const list = r.data.data || [];
      setRoles(list.map(rl => ({ id: rl.id, roleName: rl.roleName })));
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: paginationModel.page + 1, pageSize: paginationModel.pageSize,
      };
      if (search) params.search = search;
      if (filterRole) params.roleId = filterRole;
      if (filterActive !== '') params.isActive = filterActive;
      const res = await api.get<ApiResponse<UserRow[]>>('/settings/users', { params });
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load users';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally { setLoading(false); }
  }, [paginationModel, search, filterRole, filterActive, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.username || !formData.email || !formData.fullName || !formData.roleId) {
      setFormError('Username, email, full name, and role are required'); return;
    }
    if (!editingId && !formData.password) { setFormError('Password is required for new users'); return; }
    setSaving(true); setFormError('');
    try {
      if (editingId) {
        await api.put(`/settings/users/${editingId}`, {
          email: formData.email, fullName: formData.fullName, roleId: Number(formData.roleId),
          companyId: formData.companyId ? Number(formData.companyId) : null,
          branchId: formData.branchId ? Number(formData.branchId) : null,
          employeeId: formData.employeeId ? Number(formData.employeeId) : null,
          isActive: formData.isActive,
        });
        enqueueSnackbar('User updated', { variant: 'success' });
      } else {
        await api.post('/settings/users', {
          username: formData.username, email: formData.email, password: formData.password,
          fullName: formData.fullName, roleId: Number(formData.roleId),
          companyId: formData.companyId ? Number(formData.companyId) : null,
          branchId: formData.branchId ? Number(formData.branchId) : null,
          employeeId: formData.employeeId ? Number(formData.employeeId) : null,
          isActive: formData.isActive,
        });
        enqueueSnackbar('User created', { variant: 'success' });
      }
      setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/settings/users/${id}`);
      enqueueSnackbar('User deactivated', { variant: 'success' }); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(axiosErr?.response?.data?.message || 'Failed to delete', { variant: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { enqueueSnackbar('Password must be at least 6 characters', { variant: 'warning' }); return; }
    setResetting(true);
    try {
      await api.put(`/settings/users/${resetUserId}/reset-password`, { newPassword });
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
      setResetOpen(false); setNewPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(axiosErr?.response?.data?.message || 'Failed to reset password', { variant: 'error' });
    } finally { setResetting(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ username: '', email: '', password: '', fullName: '', roleId: '', companyId: '1', branchId: '', employeeId: '', isActive: true });
    setFormError(''); setDialogOpen(true);
  };

  const openEdit = (row: UserRow) => {
    setEditingId(row.id);
    setFormData({
      username: row.username, email: row.email, password: '', fullName: row.fullName,
      roleId: row.roleId, companyId: row.companyId ? String(row.companyId) : '',
      branchId: row.branchId ? String(row.branchId) : '',
      employeeId: row.employeeId ? String(row.employeeId) : '',
      isActive: row.isActive,
    });
    setFormError(''); setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'fullName', headerName: 'Full Name', width: 160, flex: 1 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'roleName', headerName: 'Role', width: 120 },
    {
      field: 'isActive', headerName: 'Active', width: 90,
      renderCell: (p) => <Chip label={p.value ? 'Active' : 'Inactive'} size="small" color={p.value ? 'success' : 'default'} />,
    },
    {
      field: 'lastLoginDate', headerName: 'Last Login', width: 140,
      valueFormatter: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : 'Never',
    },
    {
      field: 'actions', headerName: '', width: 120, sortable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Reset Password"><IconButton size="small" onClick={() => { setResetUserId(p.row.id); setNewPassword(''); setResetOpen(true); }}><LockReset fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <FilterList color="action" />
        <TextField placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Role</InputLabel>
          <Select value={filterRole} label="Role" onChange={(e) => setFilterRole(e.target.value as number | '')}>
            <MenuItem value="">All</MenuItem>
            {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.roleName}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterActive} label="Status" onChange={(e) => setFilterActive(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        <Box sx={{ ml: 'auto' }}><Button variant="contained" startIcon={<Add />} onClick={openCreate}>New User</Button></Box>
      </Paper>
      <Paper variant="outlined" sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={totalCount} loading={loading}
          paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]} disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit User' : 'New User'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <TextField label="Username" value={formData.username} onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                size="small" required fullWidth disabled={!!editingId} />
              <TextField label="Full Name" value={formData.fullName} onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                size="small" required fullWidth />
            </Box>
            <TextField label="Email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              size="small" required type="email" fullWidth />
            {!editingId && (
              <TextField label="Password" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                size="small" required type="password" fullWidth />
            )}
            <FormControl size="small" fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select value={formData.roleId} label="Role" onChange={(e) => setFormData(p => ({ ...p, roleId: e.target.value as number }))}>
                {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.roleName}</MenuItem>)}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField label="Company ID" value={formData.companyId} onChange={(e) => setFormData(p => ({ ...p, companyId: e.target.value }))}
                size="small" type="number" fullWidth />
              <TextField label="Branch ID" value={formData.branchId} onChange={(e) => setFormData(p => ({ ...p, branchId: e.target.value }))}
                size="small" type="number" fullWidth />
              <TextField label="Employee ID" value={formData.employeeId} onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))}
                size="small" type="number" fullWidth />
            </Box>
            <FormControlLabel control={<Switch checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} />}
              label="Active" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Typography variant="body2" color="text.secondary">Enter a new password for this user.</Typography>
            <TextField label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              size="small" type="password" required fullWidth autoFocus />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleResetPassword} disabled={resetting}>
            {resetting ? <CircularProgress size={20} /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2: ROLES & PERMISSIONS
// ════════════════════════════════════════════════════════════
function RolesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ roleName: '', description: '', isActive: true, permissions: [] as string[] });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<RoleRow[]>>('/settings/roles');
      setRows(res.data.data || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load roles';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally { setLoading(false); }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePermission = (perm: string) => {
    setFormData(p => ({
      ...p,
      permissions: p.permissions.includes(perm)
        ? p.permissions.filter(x => x !== perm)
        : [...p.permissions, perm],
    }));
  };

  const handleSave = async () => {
    if (!formData.roleName) { setFormError('Role name is required'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        roleName: formData.roleName, description: formData.description || null,
        isActive: formData.isActive, permissions: formData.permissions,
      };
      if (editingId) {
        await api.put(`/settings/roles/${editingId}`, payload);
        enqueueSnackbar('Role updated', { variant: 'success' });
      } else {
        await api.post('/settings/roles', payload);
        enqueueSnackbar('Role created', { variant: 'success' });
      }
      setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this role?')) return;
    try {
      await api.delete(`/settings/roles/${id}`);
      enqueueSnackbar('Role deleted', { variant: 'success' }); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(axiosErr?.response?.data?.message || 'Failed to delete', { variant: 'error' });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ roleName: '', description: '', isActive: true, permissions: [] });
    setFormError(''); setDialogOpen(true);
  };

  const openEdit = (row: RoleRow) => {
    setEditingId(row.id);
    setFormData({
      roleName: row.roleName, description: row.description || '',
      isActive: row.isActive, permissions: row.permissions || [],
    });
    setFormError(''); setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'roleName', headerName: 'Role Name', width: 160, flex: 1 },
    { field: 'description', headerName: 'Description', width: 220, flex: 1 },
    { field: 'userCount', headerName: 'Users', width: 80, type: 'number' },
    {
      field: 'permissions', headerName: 'Permissions', width: 300,
      renderCell: (p) => {
        const perms: string[] = p.value || [];
        const shown = perms.slice(0, 3);
        const extra = perms.length - 3;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', py: 0.5 }}>
            {shown.map(pr => <Chip key={pr} label={pr} size="small" variant="outlined" />)}
            {extra > 0 && <Chip label={`+${extra} more`} size="small" color="primary" variant="outlined" />}
          </Box>
        );
      },
    },
    {
      field: 'isActive', headerName: 'Active', width: 90,
      renderCell: (p) => <Chip label={p.value ? 'Active' : 'Inactive'} size="small" color={p.value ? 'success' : 'default'} />,
    },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {rows.length} role{rows.length !== 1 ? 's' : ''} configured
        </Typography>
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Role</Button>
      </Paper>
      <Paper variant="outlined" sx={{ height: 400 }}>
        <DataGrid rows={rows} columns={columns} loading={loading}
          disableRowSelectionOnClick density="compact" getRowHeight={() => 'auto'}
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Role' : 'New Role'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <TextField label="Role Name" value={formData.roleName} onChange={(e) => setFormData(p => ({ ...p, roleName: e.target.value }))}
                size="small" required fullWidth />
              <TextField label="Description" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                size="small" fullWidth />
            </Box>
            <FormControlLabel control={<Switch checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} />}
              label="Active" />
            <Typography variant="subtitle2" fontWeight={600}>Permissions</Typography>
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 350, overflow: 'auto' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${PERMISSION_TYPES.length}, 90px)`, gap: 0.5, alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={700}>Module</Typography>
                {PERMISSION_TYPES.map(pt => (
                  <Typography key={pt} variant="caption" fontWeight={700} textAlign="center">{pt}</Typography>
                ))}
                {PERMISSION_MODULES.map(mod => (
                  <Box key={mod} sx={{ display: 'contents' }}>
                    <Typography variant="body2">{mod}</Typography>
                    {PERMISSION_TYPES.map(pt => {
                      const perm = `${mod}:${pt}`;
                      return (
                        <Box key={perm} textAlign="center">
                          <Checkbox size="small" checked={formData.permissions.includes(perm)}
                            onChange={() => togglePermission(perm)} />
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3: AUDIT LOG
// ════════════════════════════════════════════════════════════
function AuditLogTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 });
  const [search, setSearch] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: paginationModel.page + 1, pageSize: paginationModel.pageSize,
      };
      if (search) params.search = search;
      if (filterTable) params.tableName = filterTable;
      if (filterAction) params.actionType = filterAction;
      if (dateFrom) params.dateFrom = dateFrom.format('YYYY-MM-DD');
      if (dateTo) params.dateTo = dateTo.format('YYYY-MM-DD');
      const res = await api.get<ApiResponse<AuditRow[]>>('/settings/audit-log', { params });
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load audit log';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally { setLoading(false); }
  }, [paginationModel, search, filterTable, filterAction, dateFrom, dateTo, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tableOptions = [
    'Employees', 'Users', 'Roles', 'Departments', 'Branches', 'Designations',
    'Attendances', 'LeaveApplications', 'Contracts', 'Payroll', 'Loans', 'Documents',
  ];

  const columns: GridColDef[] = [
    {
      field: 'actionDate', headerName: 'Date', width: 150,
      valueFormatter: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '',
    },
    { field: 'userName', headerName: 'User', width: 130 },
    { field: 'tableName', headerName: 'Table', width: 140 },
    {
      field: 'actionType', headerName: 'Action', width: 100,
      renderCell: (p) => {
        const colorMap: Record<string, 'success' | 'info' | 'error' | 'default'> = {
          Create: 'success', Update: 'info', Delete: 'error',
        };
        return <Chip label={p.value} size="small" color={colorMap[p.value as string] || 'default'} />;
      },
    },
    { field: 'recordId', headerName: 'Record ID', width: 90, type: 'number' },
    {
      field: 'oldValues', headerName: 'Old Values', width: 200, flex: 1,
      renderCell: (p) => (
        <Tooltip title={p.value || ''}>
          <Typography variant="body2" noWrap sx={{ fontSize: 12 }}>{p.value || '—'}</Typography>
        </Tooltip>
      ),
    },
    {
      field: 'newValues', headerName: 'New Values', width: 200, flex: 1,
      renderCell: (p) => (
        <Tooltip title={p.value || ''}>
          <Typography variant="body2" noWrap sx={{ fontSize: 12 }}>{p.value || '—'}</Typography>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <FilterList color="action" />
        <TextField placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 180 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Table</InputLabel>
          <Select value={filterTable} label="Table" onChange={(e) => setFilterTable(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {tableOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Action</InputLabel>
          <Select value={filterAction} label="Action" onChange={(e) => setFilterAction(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Create">Create</MenuItem>
            <MenuItem value="Update">Update</MenuItem>
            <MenuItem value="Delete">Delete</MenuItem>
          </Select>
        </FormControl>
        <DatePicker label="From" value={dateFrom}
          onAccept={(d) => setDateFrom(d)} onChange={(d) => { if (d && d.isValid()) setDateFrom(d); }}
          slotProps={{ textField: { size: 'small', sx: { width: 155 } } }} />
        <DatePicker label="To" value={dateTo}
          onAccept={(d) => setDateTo(d)} onChange={(d) => { if (d && d.isValid()) setDateTo(d); }}
          slotProps={{ textField: { size: 'small', sx: { width: 155 } } }} />
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
      </Paper>
      <Paper variant="outlined" sx={{ height: 520 }}>
        <DataGrid rows={rows} columns={columns} rowCount={totalCount} loading={loading}
          paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]} disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 4: IMPORT / EXPORT
// ════════════════════════════════════════════════════════════
function ImportExportTab() {
  const { enqueueSnackbar } = useSnackbar();

  // Export state
  const [exportEntity, setExportEntity] = useState('Employees');
  const [exporting, setExporting] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewColumns, setPreviewColumns] = useState<GridColDef[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.post('/settings/export', { entity: exportEntity, format: 'csv' }, { responseType: 'blob' });
      const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportEntity.toLowerCase()}-export-${dayjs().format('YYYYMMDD')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar(`${exportEntity} exported successfully`, { variant: 'success' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(axiosErr?.response?.data?.message || 'Export failed', { variant: 'error' });
    } finally { setExporting(false); }
  };

  const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ''; });
      return row;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setPreviewRows(parsed);
      if (parsed.length > 0) {
        const keys = Object.keys(parsed[0]);
        setPreviewColumns(keys.map(k => ({ field: k, headerName: k, width: 130, flex: 1 })));
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewRows.length === 0) { enqueueSnackbar('No data to import', { variant: 'warning' }); return; }
    setImporting(true); setImportResult(null);
    try {
      const res = await api.post<ApiResponse<ImportResult>>('/settings/import/employees', previewRows);
      setImportResult(res.data.data);
      enqueueSnackbar(res.data.message || 'Import completed', { variant: res.data.data.errorCount > 0 ? 'warning' : 'success' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(axiosErr?.response?.data?.message || 'Import failed', { variant: 'error' });
    } finally { setImporting(false); }
  };

  const clearImport = () => {
    setImportFile(null); setPreviewRows([]); setPreviewColumns([]); setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Export Section */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Download color="primary" />
          <Typography variant="h6" fontWeight={600}>Export Data</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select an entity and download its data as a CSV file.
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Entity</InputLabel>
            <Select value={exportEntity} label="Entity" onChange={(e) => setExportEntity(e.target.value)}>
              <MenuItem value="Employees">Employees</MenuItem>
              <MenuItem value="Departments">Departments</MenuItem>
              <MenuItem value="Attendance">Attendance</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <Download />}
            onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Box>
      </Paper>

      {/* Import Section */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Upload color="primary" />
          <Typography variant="h6" fontWeight={600}>Import Employees</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a CSV file with employee data. Required columns: EmpCode, NameEn. Optional: NameAr, Gender, DOJ, BasicSalary, TotalSalary, Email, Mobile.
        </Typography>
        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect}
            style={{ display: 'none' }} id="csv-upload" />
          <label htmlFor="csv-upload">
            <Button variant="outlined" component="span" startIcon={<Upload />}>
              {importFile ? importFile.name : 'Select CSV File'}
            </Button>
          </label>
          {importFile && (
            <>
              <Button variant="contained" startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <Upload />}
                onClick={handleImport} disabled={importing || previewRows.length === 0}>
                {importing ? 'Importing...' : `Import ${previewRows.length} Rows`}
              </Button>
              <Button variant="text" color="secondary" onClick={clearImport}>Clear</Button>
            </>
          )}
        </Box>
        {importing && <LinearProgress sx={{ mb: 2 }} />}

        {/* Import Results */}
        {importResult && (
          <Alert severity={importResult.errorCount > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              Import Complete: {importResult.successCount} of {importResult.totalRows} rows imported successfully.
              {importResult.errorCount > 0 && ` ${importResult.errorCount} errors.`}
            </Typography>
            {importResult.errors.length > 0 && (
              <Box sx={{ mt: 1, maxHeight: 150, overflow: 'auto' }}>
                {importResult.errors.map((e, i) => (
                  <Typography key={i} variant="caption" display="block" color="error">{e}</Typography>
                ))}
              </Box>
            )}
          </Alert>
        )}

        {/* Preview DataGrid */}
        {previewRows.length > 0 && (
          <Paper variant="outlined" sx={{ height: 350 }}>
            <DataGrid
              rows={previewRows.map((r, i) => ({ id: i + 1, ...r }))}
              columns={previewColumns}
              disableRowSelectionOnClick density="compact"
              pageSizeOptions={[25, 50, 100]}
              sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
          </Paper>
        )}
      </Paper>
    </Box>
  );
}
