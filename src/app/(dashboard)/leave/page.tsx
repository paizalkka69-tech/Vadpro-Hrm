'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  TextField, MenuItem, Select, FormControl, InputLabel, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tooltip,
  InputAdornment, CircularProgress, Tab, Tabs, FormControlLabel, Checkbox,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add, Edit, Delete, Search, Refresh,
  CheckCircle, Cancel, HourglassEmpty, EventBusy,
  People, FilterList, ThumbUp, ThumbDown, DoNotDisturb,
  BeachAccess, AccountBalance,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import api, { type ApiResponse } from '@/lib/api';

// ── Types ──
interface LeaveAppRow {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeColor: string;
  applicationDate: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType: string | null;
  status: string;
  reason: string | null;
  approvedByName: string | null;
  approvedDate: string | null;
}

interface LeaveSummary {
  totalApplications: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  onLeaveToday: number;
  totalDaysTaken: number;
}

interface LeaveTypeRow {
  id: number;
  leaveCode: string;
  nameEn: string;
  nameAr: string | null;
  isPaid: boolean;
  isCarryForward: boolean;
  maxCarryDays: number | null;
  isEncashable: boolean;
  deductsFromBalance: boolean;
  includesWeekends: boolean;
  includesHolidays: boolean;
  requiresAttachment: boolean;
  maxConsecutiveDays: number | null;
  minAdvanceDays: number | null;
  allowNegativeBalance: boolean;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface LeaveBalanceRow {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeColor: string | null;
  year: number;
  openingBalance: number;
  accrued: number;
  taken: number;
  adjusted: number;
  encashed: number;
  lapsed: number;
  closingBalance: number | null;
}

interface LeavePolicyRow {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  applicableGender: string | null;
  applicableCategoryId: number | null;
  categoryName: string | null;
  applicableGradeId: number | null;
  gradeName: string | null;
  minServiceMonths: number;
  annualEntitlement: number;
  accrualMethod: string;
  serviceYearsThreshold: number | null;
  entitlementAfterThreshold: number | null;
  proRataOnJoining: boolean;
  proRataOnLeaving: boolean;
  maxAccumulation: number | null;
  isActive: boolean;
}

// ── Summary Card ──
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
        <Box sx={{ bgcolor: `${color}15`, borderRadius: 2, p: 1, display: 'flex' }}>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Status helpers ──
const statusColorMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  Approved: 'success', Rejected: 'error', Pending: 'warning', Draft: 'default', Cancelled: 'default', Resumed: 'info',
};

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function LeavePage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Leave Management</Typography>
          <Typography variant="body2" color="text.secondary">Applications, balances, types, and policies</Typography>
        </Box>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Applications" />
        <Tab label="Balances" />
        <Tab label="Leave Types" />
        <Tab label="Policies" />
      </Tabs>
      {tab === 0 && <ApplicationsTab />}
      {tab === 1 && <BalancesTab />}
      {tab === 2 && <LeaveTypesTab />}
      {tab === 3 && <PoliciesTab />}
    </Box>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 1: LEAVE APPLICATIONS
// ════════════════════════════════════════════════════════════
function ApplicationsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<LeaveAppRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [summary, setSummary] = useState<LeaveSummary | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRow[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLeaveType, setFilterLeaveType] = useState<number | ''>('');
  const [filterStartDate, setFilterStartDate] = useState<Dayjs | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Dayjs | null>(null);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '' as number | '',
    fromDate: dayjs() as Dayjs | null,
    toDate: dayjs() as Dayjs | null,
    totalDays: '',
    isHalfDay: false,
    halfDayType: 'First',
    reason: '',
    remarks: '',
    contactNo: '',
    delegateToId: '',
    isTicketRequired: false,
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<LeaveTypeRow[]>>('/leave/types?activeOnly=true').then(r => setLeaveTypes(r.data.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterLeaveType) params.leaveTypeId = filterLeaveType;
      if (filterStartDate) params.startDate = filterStartDate.format('YYYY-MM-DD');
      if (filterEndDate) params.endDate = filterEndDate.format('YYYY-MM-DD');

      const res = await api.get<ApiResponse<LeaveAppRow[]>>('/leave/applications', { params });
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to load leave applications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, filterStatus, filterLeaveType, filterStartDate, filterEndDate, enqueueSnackbar]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<LeaveSummary>>('/leave/summary');
      setSummary(res.data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleSave = async () => {
    if (!formData.employeeId || !formData.leaveTypeId || !formData.fromDate || !formData.toDate) {
      setFormError('Employee ID, Leave Type, From Date, and To Date are required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        employeeId: Number(formData.employeeId),
        companyId: 1,
        leaveTypeId: Number(formData.leaveTypeId),
        fromDate: formData.fromDate.format('YYYY-MM-DD'),
        toDate: formData.toDate.format('YYYY-MM-DD'),
        totalDays: formData.totalDays ? Number(formData.totalDays) : 0,
        isHalfDay: formData.isHalfDay,
        halfDayType: formData.isHalfDay ? formData.halfDayType : null,
        reason: formData.reason || null,
        remarks: formData.remarks || null,
        contactNo: formData.contactNo || null,
        delegateToId: formData.delegateToId ? Number(formData.delegateToId) : null,
        isTicketRequired: formData.isTicketRequired,
      };

      if (editingId) {
        await api.put(`/leave/applications/${editingId}`, payload);
        enqueueSnackbar('Leave application updated', { variant: 'success' });
      } else {
        await api.post('/leave/applications', payload);
        enqueueSnackbar('Leave application submitted', { variant: 'success' });
      }
      setDialogOpen(false);
      fetchData();
      fetchSummary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      // Try to extract API error message
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || msg);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/leave/applications/${id}/approve`, { approvedById: 1 });
      enqueueSnackbar('Leave approved', { variant: 'success' });
      fetchData();
      fetchSummary();
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to approve', { variant: 'error' });
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/leave/applications/${id}/reject`, { approvedById: 1, rejectionReason: reason });
      enqueueSnackbar('Leave rejected', { variant: 'info' });
      fetchData();
      fetchSummary();
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to reject', { variant: 'error' });
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this leave application?')) return;
    try {
      await api.put(`/leave/applications/${id}/cancel`);
      enqueueSnackbar('Leave cancelled', { variant: 'info' });
      fetchData();
      fetchSummary();
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to cancel', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this leave application?')) return;
    try {
      await api.delete(`/leave/applications/${id}`);
      enqueueSnackbar('Leave deleted', { variant: 'success' });
      fetchData();
      fetchSummary();
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to delete', { variant: 'error' });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ employeeId: '', leaveTypeId: '', fromDate: dayjs(), toDate: dayjs(), totalDays: '', isHalfDay: false, halfDayType: 'First', reason: '', remarks: '', contactNo: '', delegateToId: '', isTicketRequired: false });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (row: LeaveAppRow) => {
    setEditingId(row.id);
    setFormData({
      employeeId: String(row.employeeId),
      leaveTypeId: row.leaveTypeId,
      fromDate: dayjs(row.fromDate),
      toDate: dayjs(row.toDate),
      totalDays: String(row.totalDays),
      isHalfDay: row.isHalfDay,
      halfDayType: row.halfDayType || 'First',
      reason: row.reason || '',
      remarks: '',
      contactNo: '',
      delegateToId: '',
      isTicketRequired: false,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Emp Code', width: 100 },
    { field: 'employeeName', headerName: 'Employee', width: 150, flex: 1 },
    { field: 'departmentName', headerName: 'Department', width: 130 },
    {
      field: 'leaveTypeName', headerName: 'Leave Type', width: 130,
      renderCell: (p) => <Chip label={p.value} size="small" sx={{ bgcolor: `${p.row.leaveTypeColor}20`, color: p.row.leaveTypeColor, fontWeight: 600 }} />,
    },
    {
      field: 'fromDate', headerName: 'From', width: 110,
      valueFormatter: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '',
    },
    {
      field: 'toDate', headerName: 'To', width: 110,
      valueFormatter: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '',
    },
    {
      field: 'totalDays', headerName: 'Days', width: 70, type: 'number',
      renderCell: (p) => <Typography variant="body2" fontWeight={600}>{p.value}{p.row.isHalfDay ? ' (½)' : ''}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: (p) => <Chip label={p.value} size="small" color={statusColorMap[p.value as string] || 'default'} />,
    },
    { field: 'reason', headerName: 'Reason', width: 160 },
    {
      field: 'actions', headerName: '', width: 140, sortable: false,
      renderCell: (p) => (
        <Box>
          {p.row.status === 'Pending' && (
            <>
              <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(p.row.id)}><ThumbUp fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleReject(p.row.id)}><ThumbDown fontSize="small" /></IconButton></Tooltip>
            </>
          )}
          {(p.row.status === 'Pending' || p.row.status === 'Approved') && (
            <Tooltip title="Cancel"><IconButton size="small" onClick={() => handleCancel(p.row.id)}><DoNotDisturb fontSize="small" /></IconButton></Tooltip>
          )}
          {(p.row.status === 'Draft' || p.row.status === 'Pending') && (
            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p.row)}><Edit fontSize="small" /></IconButton></Tooltip>
          )}
          {p.row.status !== 'Approved' && (
            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton></Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <>
      {summary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}><StatCard icon={<EventBusy />} label="Total Applications" value={summary.totalApplications} color="#1565C0" /></Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}><StatCard icon={<HourglassEmpty />} label="Pending" value={summary.pendingCount} color="#E65100" /></Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}><StatCard icon={<CheckCircle />} label="Approved" value={summary.approvedCount} color="#2E6B4A" /></Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}><StatCard icon={<Cancel />} label="Rejected" value={summary.rejectedCount} color="#C62828" /></Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}><StatCard icon={<People />} label="On Leave Today" value={summary.onLeaveToday} color="#6A1B9A" /></Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}><StatCard icon={<BeachAccess />} label="Days Taken" value={summary.totalDaysTaken} color="#00695C" /></Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <FilterList color="action" />
        <TextField placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 180 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Leave Type</InputLabel>
          <Select value={filterLeaveType} label="Leave Type" onChange={(e) => setFilterLeaveType(e.target.value as number | '')}>
            <MenuItem value="">All</MenuItem>
            {leaveTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.nameEn}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <DatePicker label="From" value={filterStartDate} onAccept={(d) => setFilterStartDate(d)}
          onChange={(d) => { if (d && d.isValid()) setFilterStartDate(d); }}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }} />
        <DatePicker label="To" value={filterEndDate} onAccept={(d) => setFilterEndDate(d)}
          onChange={(d) => { if (d && d.isValid()) setFilterEndDate(d); }}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }} />
        <Tooltip title="Refresh"><IconButton onClick={() => { fetchData(); fetchSummary(); }}><Refresh /></IconButton></Tooltip>
        <Box sx={{ ml: 'auto' }}>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Application</Button>
        </Box>
      </Paper>

      {/* Grid */}
      <Paper variant="outlined" sx={{ height: 480 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={totalCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }}
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Leave Application' : 'New Leave Application'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee ID" value={formData.employeeId} onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))}
              size="small" type="number" required disabled={!!editingId} />
            <FormControl size="small" required>
              <InputLabel>Leave Type</InputLabel>
              <Select value={formData.leaveTypeId} label="Leave Type" onChange={(e) => setFormData(p => ({ ...p, leaveTypeId: e.target.value as number }))}>
                {leaveTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.nameEn}</MenuItem>)}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <DatePicker label="From Date" value={formData.fromDate}
                onAccept={(d) => d && setFormData(p => ({ ...p, fromDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, fromDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              <DatePicker label="To Date" value={formData.toDate}
                onAccept={(d) => d && setFormData(p => ({ ...p, toDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, toDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              <TextField label="Total Days" value={formData.totalDays} onChange={(e) => setFormData(p => ({ ...p, totalDays: e.target.value }))}
                size="small" type="number" sx={{ width: 120 }} helperText="Auto-calculated if empty" />
              <FormControlLabel control={<Checkbox checked={formData.isHalfDay} onChange={(e) => setFormData(p => ({ ...p, isHalfDay: e.target.checked }))} size="small" />} label="Half Day" />
              {formData.isHalfDay && (
                <FormControl size="small" sx={{ width: 120 }}>
                  <InputLabel>Half</InputLabel>
                  <Select value={formData.halfDayType} label="Half" onChange={(e) => setFormData(p => ({ ...p, halfDayType: e.target.value }))}>
                    <MenuItem value="First">First Half</MenuItem>
                    <MenuItem value="Second">Second Half</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
            <TextField label="Reason" value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
              size="small" multiline rows={2} />
            <TextField label="Remarks" value={formData.remarks} onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
              size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingId ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2: LEAVE BALANCES
// ════════════════════════════════════════════════════════════
function BalancesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<LeaveBalanceRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState(2026);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        year: filterYear,
      };
      if (search) params.search = search;
      const res = await api.get<ApiResponse<LeaveBalanceRow[]>>('/leave/balances', { params });
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to load balances', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, filterYear, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Emp Code', width: 100 },
    { field: 'employeeName', headerName: 'Employee', width: 160, flex: 1 },
    {
      field: 'leaveTypeName', headerName: 'Leave Type', width: 140,
      renderCell: (p) => <Chip label={p.value} size="small" sx={{ bgcolor: `${p.row.leaveTypeColor || '#1565C0'}20`, color: p.row.leaveTypeColor || '#1565C0', fontWeight: 600 }} />,
    },
    { field: 'year', headerName: 'Year', width: 70 },
    { field: 'openingBalance', headerName: 'Opening', width: 90, type: 'number' },
    { field: 'accrued', headerName: 'Accrued', width: 90, type: 'number' },
    { field: 'taken', headerName: 'Taken', width: 80, type: 'number', renderCell: (p) => <Typography variant="body2" color={p.value > 0 ? 'error.main' : 'text.primary'}>{p.value}</Typography> },
    { field: 'adjusted', headerName: 'Adjusted', width: 90, type: 'number' },
    { field: 'encashed', headerName: 'Encashed', width: 90, type: 'number' },
    { field: 'lapsed', headerName: 'Lapsed', width: 80, type: 'number' },
    {
      field: 'closingBalance', headerName: 'Balance', width: 90, type: 'number',
      renderCell: (p) => <Typography variant="body2" fontWeight={700} color={p.value > 0 ? 'success.main' : p.value < 0 ? 'error.main' : 'text.primary'}>{p.value}</Typography>,
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <AccountBalance color="action" />
        <TextField placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <FormControl size="small" sx={{ width: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select value={filterYear} label="Year" onChange={(e) => setFilterYear(Number(e.target.value))}>
            <MenuItem value={2024}>2024</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
            <MenuItem value={2026}>2026</MenuItem>
          </Select>
        </FormControl>
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
// TAB 3: LEAVE TYPES
// ════════════════════════════════════════════════════════════
function LeaveTypesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<LeaveTypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    leaveCode: '', nameEn: '', nameAr: '', isPaid: true, isCarryForward: false,
    maxCarryDays: '', isEncashable: false, deductsFromBalance: true,
    includesWeekends: false, includesHolidays: false, requiresAttachment: false,
    maxConsecutiveDays: '', minAdvanceDays: '', allowNegativeBalance: false,
    color: '#4CAF50', sortOrder: '0', isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<LeaveTypeRow[]>>('/leave/types');
      setRows(res.data.data || []);
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to load', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.leaveCode || !formData.nameEn) { setFormError('Code and Name are required'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        companyId: 1, leaveCode: formData.leaveCode, nameEn: formData.nameEn, nameAr: formData.nameAr || null,
        isPaid: formData.isPaid, isCarryForward: formData.isCarryForward,
        maxCarryDays: formData.maxCarryDays ? Number(formData.maxCarryDays) : null,
        isEncashable: formData.isEncashable, deductsFromBalance: formData.deductsFromBalance,
        includesWeekends: formData.includesWeekends, includesHolidays: formData.includesHolidays,
        requiresAttachment: formData.requiresAttachment,
        maxConsecutiveDays: formData.maxConsecutiveDays ? Number(formData.maxConsecutiveDays) : null,
        minAdvanceDays: formData.minAdvanceDays ? Number(formData.minAdvanceDays) : null,
        allowNegativeBalance: formData.allowNegativeBalance,
        color: formData.color, sortOrder: Number(formData.sortOrder) || 0, isActive: formData.isActive,
      };
      if (editingId) {
        await api.put(`/leave/types/${editingId}`, payload);
        enqueueSnackbar('Leave type updated', { variant: 'success' });
      } else {
        await api.post('/leave/types', payload);
        enqueueSnackbar('Leave type created', { variant: 'success' });
      }
      setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this leave type?')) return;
    try {
      await api.delete(`/leave/types/${id}`);
      enqueueSnackbar('Leave type deleted', { variant: 'success' });
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(axiosErr?.response?.data?.message || 'Failed to delete', { variant: 'error' });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ leaveCode: '', nameEn: '', nameAr: '', isPaid: true, isCarryForward: false, maxCarryDays: '', isEncashable: false, deductsFromBalance: true, includesWeekends: false, includesHolidays: false, requiresAttachment: false, maxConsecutiveDays: '', minAdvanceDays: '', allowNegativeBalance: false, color: '#4CAF50', sortOrder: '0', isActive: true });
    setFormError(''); setDialogOpen(true);
  };

  const openEdit = (row: LeaveTypeRow) => {
    setEditingId(row.id);
    setFormData({
      leaveCode: row.leaveCode, nameEn: row.nameEn, nameAr: row.nameAr || '',
      isPaid: row.isPaid, isCarryForward: row.isCarryForward,
      maxCarryDays: row.maxCarryDays != null ? String(row.maxCarryDays) : '',
      isEncashable: row.isEncashable, deductsFromBalance: row.deductsFromBalance,
      includesWeekends: row.includesWeekends, includesHolidays: row.includesHolidays,
      requiresAttachment: row.requiresAttachment,
      maxConsecutiveDays: row.maxConsecutiveDays != null ? String(row.maxConsecutiveDays) : '',
      minAdvanceDays: row.minAdvanceDays != null ? String(row.minAdvanceDays) : '',
      allowNegativeBalance: row.allowNegativeBalance,
      color: row.color || '#4CAF50', sortOrder: String(row.sortOrder), isActive: row.isActive,
    });
    setFormError(''); setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'leaveCode', headerName: 'Code', width: 80 },
    {
      field: 'nameEn', headerName: 'Name', width: 160, flex: 1,
      renderCell: (p) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: p.row.color || '#999' }} />
          <Typography variant="body2">{p.value}</Typography>
        </Box>
      ),
    },
    { field: 'isPaid', headerName: 'Paid', width: 70, type: 'boolean' },
    { field: 'isCarryForward', headerName: 'Carry Fwd', width: 90, type: 'boolean' },
    { field: 'isEncashable', headerName: 'Encashable', width: 100, type: 'boolean' },
    { field: 'deductsFromBalance', headerName: 'Deducts', width: 90, type: 'boolean' },
    { field: 'maxConsecutiveDays', headerName: 'Max Days', width: 90, type: 'number' },
    { field: 'minAdvanceDays', headerName: 'Notice', width: 80, type: 'number' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
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
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Leave Type</Button>
      </Box>
      <Paper variant="outlined" sx={{ height: 480 }}>
        <DataGrid rows={rows} columns={columns} loading={loading}
          disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <TextField label="Code" value={formData.leaveCode} onChange={(e) => setFormData(p => ({ ...p, leaveCode: e.target.value }))} size="small" required sx={{ width: 120 }} />
              <TextField label="Name (English)" value={formData.nameEn} onChange={(e) => setFormData(p => ({ ...p, nameEn: e.target.value }))} size="small" required fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Name (Arabic)" value={formData.nameAr} onChange={(e) => setFormData(p => ({ ...p, nameAr: e.target.value }))} size="small" fullWidth />
              <TextField label="Color" value={formData.color} onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))} size="small" type="color" sx={{ width: 100 }} />
              <TextField label="Sort Order" value={formData.sortOrder} onChange={(e) => setFormData(p => ({ ...p, sortOrder: e.target.value }))} size="small" type="number" sx={{ width: 100 }} />
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              <FormControlLabel control={<Checkbox checked={formData.isPaid} onChange={(e) => setFormData(p => ({ ...p, isPaid: e.target.checked }))} size="small" />} label="Paid" />
              <FormControlLabel control={<Checkbox checked={formData.isCarryForward} onChange={(e) => setFormData(p => ({ ...p, isCarryForward: e.target.checked }))} size="small" />} label="Carry Forward" />
              <FormControlLabel control={<Checkbox checked={formData.isEncashable} onChange={(e) => setFormData(p => ({ ...p, isEncashable: e.target.checked }))} size="small" />} label="Encashable" />
              <FormControlLabel control={<Checkbox checked={formData.deductsFromBalance} onChange={(e) => setFormData(p => ({ ...p, deductsFromBalance: e.target.checked }))} size="small" />} label="Deducts Balance" />
              <FormControlLabel control={<Checkbox checked={formData.includesWeekends} onChange={(e) => setFormData(p => ({ ...p, includesWeekends: e.target.checked }))} size="small" />} label="Incl. Weekends" />
              <FormControlLabel control={<Checkbox checked={formData.includesHolidays} onChange={(e) => setFormData(p => ({ ...p, includesHolidays: e.target.checked }))} size="small" />} label="Incl. Holidays" />
              <FormControlLabel control={<Checkbox checked={formData.requiresAttachment} onChange={(e) => setFormData(p => ({ ...p, requiresAttachment: e.target.checked }))} size="small" />} label="Requires Attachment" />
              <FormControlLabel control={<Checkbox checked={formData.allowNegativeBalance} onChange={(e) => setFormData(p => ({ ...p, allowNegativeBalance: e.target.checked }))} size="small" />} label="Allow Negative" />
              <FormControlLabel control={<Checkbox checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} size="small" />} label="Active" />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Max Carry Days" value={formData.maxCarryDays} onChange={(e) => setFormData(p => ({ ...p, maxCarryDays: e.target.value }))} size="small" type="number" />
              <TextField label="Max Consecutive Days" value={formData.maxConsecutiveDays} onChange={(e) => setFormData(p => ({ ...p, maxConsecutiveDays: e.target.value }))} size="small" type="number" />
              <TextField label="Min Advance Days" value={formData.minAdvanceDays} onChange={(e) => setFormData(p => ({ ...p, minAdvanceDays: e.target.value }))} size="small" type="number" />
            </Box>
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
// TAB 4: LEAVE POLICIES
// ════════════════════════════════════════════════════════════
function PoliciesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<LeavePolicyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeRow[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    leaveTypeId: '' as number | '', applicableGender: '', minServiceMonths: '0',
    annualEntitlement: '', accrualMethod: 'Annual',
    serviceYearsThreshold: '', entitlementAfterThreshold: '',
    proRataOnJoining: true, proRataOnLeaving: true, maxAccumulation: '', isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<LeavePolicyRow[]>>('/leave/policies');
      setRows(res.data.data || []);
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to load', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchData();
    api.get<ApiResponse<LeaveTypeRow[]>>('/leave/types').then(r => setLeaveTypes(r.data.data)).catch(() => {});
  }, [fetchData]);

  const handleSave = async () => {
    if (!formData.leaveTypeId || !formData.annualEntitlement) { setFormError('Leave type and entitlement are required'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        companyId: 1, leaveTypeId: Number(formData.leaveTypeId),
        applicableGender: formData.applicableGender || null,
        minServiceMonths: Number(formData.minServiceMonths) || 0,
        annualEntitlement: Number(formData.annualEntitlement),
        accrualMethod: formData.accrualMethod,
        serviceYearsThreshold: formData.serviceYearsThreshold ? Number(formData.serviceYearsThreshold) : null,
        entitlementAfterThreshold: formData.entitlementAfterThreshold ? Number(formData.entitlementAfterThreshold) : null,
        proRataOnJoining: formData.proRataOnJoining, proRataOnLeaving: formData.proRataOnLeaving,
        maxAccumulation: formData.maxAccumulation ? Number(formData.maxAccumulation) : null,
        isActive: formData.isActive,
      };
      if (editingId) {
        await api.put(`/leave/policies/${editingId}`, payload);
        enqueueSnackbar('Policy updated', { variant: 'success' });
      } else {
        await api.post('/leave/policies', payload);
        enqueueSnackbar('Policy created', { variant: 'success' });
      }
      setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this policy?')) return;
    try {
      await api.delete(`/leave/policies/${id}`);
      enqueueSnackbar('Policy deleted', { variant: 'success' });
      fetchData();
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to delete', { variant: 'error' });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ leaveTypeId: '', applicableGender: '', minServiceMonths: '0', annualEntitlement: '', accrualMethod: 'Annual', serviceYearsThreshold: '', entitlementAfterThreshold: '', proRataOnJoining: true, proRataOnLeaving: true, maxAccumulation: '', isActive: true });
    setFormError(''); setDialogOpen(true);
  };

  const openEdit = (row: LeavePolicyRow) => {
    setEditingId(row.id);
    setFormData({
      leaveTypeId: row.leaveTypeId, applicableGender: row.applicableGender || '',
      minServiceMonths: String(row.minServiceMonths), annualEntitlement: String(row.annualEntitlement),
      accrualMethod: row.accrualMethod,
      serviceYearsThreshold: row.serviceYearsThreshold != null ? String(row.serviceYearsThreshold) : '',
      entitlementAfterThreshold: row.entitlementAfterThreshold != null ? String(row.entitlementAfterThreshold) : '',
      proRataOnJoining: row.proRataOnJoining, proRataOnLeaving: row.proRataOnLeaving,
      maxAccumulation: row.maxAccumulation != null ? String(row.maxAccumulation) : '',
      isActive: row.isActive,
    });
    setFormError(''); setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'leaveTypeName', headerName: 'Leave Type', width: 150, flex: 1 },
    {
      field: 'applicableGender', headerName: 'Gender', width: 90,
      valueFormatter: (v: string | null) => v === 'M' ? 'Male' : v === 'F' ? 'Female' : 'All',
    },
    { field: 'categoryName', headerName: 'Category', width: 120, valueFormatter: (v: string | null) => v || 'All' },
    { field: 'gradeName', headerName: 'Grade', width: 140, valueFormatter: (v: string | null) => v || 'All' },
    { field: 'minServiceMonths', headerName: 'Min Months', width: 100, type: 'number' },
    {
      field: 'annualEntitlement', headerName: 'Days/Year', width: 100, type: 'number',
      renderCell: (p) => <Typography variant="body2" fontWeight={700}>{p.value}</Typography>,
    },
    { field: 'accrualMethod', headerName: 'Accrual', width: 100 },
    { field: 'maxAccumulation', headerName: 'Max Accum.', width: 110, type: 'number', valueFormatter: (v: number | null) => v != null ? String(v) : '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
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
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Policy</Button>
      </Box>
      <Paper variant="outlined" sx={{ height: 480 }}>
        <DataGrid rows={rows} columns={columns} loading={loading}
          disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Leave Policy' : 'Add Leave Policy'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl size="small" required>
              <InputLabel>Leave Type</InputLabel>
              <Select value={formData.leaveTypeId} label="Leave Type" onChange={(e) => setFormData(p => ({ ...p, leaveTypeId: e.target.value as number }))}>
                {leaveTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.nameEn}</MenuItem>)}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ width: 120 }}>
                <InputLabel>Gender</InputLabel>
                <Select value={formData.applicableGender} label="Gender" onChange={(e) => setFormData(p => ({ ...p, applicableGender: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="M">Male</MenuItem>
                  <MenuItem value="F">Female</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Min Service Months" value={formData.minServiceMonths} onChange={(e) => setFormData(p => ({ ...p, minServiceMonths: e.target.value }))} size="small" type="number" fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Annual Entitlement (days)" value={formData.annualEntitlement} onChange={(e) => setFormData(p => ({ ...p, annualEntitlement: e.target.value }))} size="small" type="number" required fullWidth />
              <FormControl size="small" fullWidth>
                <InputLabel>Accrual Method</InputLabel>
                <Select value={formData.accrualMethod} label="Accrual Method" onChange={(e) => setFormData(p => ({ ...p, accrualMethod: e.target.value }))}>
                  <MenuItem value="Annual">Annual</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="ProRata">Pro-Rata</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Service Years Threshold" value={formData.serviceYearsThreshold} onChange={(e) => setFormData(p => ({ ...p, serviceYearsThreshold: e.target.value }))} size="small" type="number" fullWidth />
              <TextField label="Entitlement After Threshold" value={formData.entitlementAfterThreshold} onChange={(e) => setFormData(p => ({ ...p, entitlementAfterThreshold: e.target.value }))} size="small" type="number" fullWidth />
            </Box>
            <TextField label="Max Accumulation" value={formData.maxAccumulation} onChange={(e) => setFormData(p => ({ ...p, maxAccumulation: e.target.value }))} size="small" type="number" />
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              <FormControlLabel control={<Checkbox checked={formData.proRataOnJoining} onChange={(e) => setFormData(p => ({ ...p, proRataOnJoining: e.target.checked }))} size="small" />} label="Pro-Rata on Joining" />
              <FormControlLabel control={<Checkbox checked={formData.proRataOnLeaving} onChange={(e) => setFormData(p => ({ ...p, proRataOnLeaving: e.target.checked }))} size="small" />} label="Pro-Rata on Leaving" />
              <FormControlLabel control={<Checkbox checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} size="small" />} label="Active" />
            </Box>
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
