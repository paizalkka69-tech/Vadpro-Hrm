'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  TextField, MenuItem, Select, FormControl, InputLabel, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tooltip,
  InputAdornment, CircularProgress,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import {
  Add, Edit, Delete, Search, Refresh,
  CheckCircle, Cancel, Schedule, TrendingDown, Timer,
  People, FilterList,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import api, { type ApiResponse } from '@/lib/api';

// ── Types ──
interface AttendanceRow {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  companyId: number;
  branchId: number;
  branchName: string;
  attendanceDate: string;
  shiftId: number | null;
  shiftName: string;
  timeIn1: string | null;
  timeOut1: string | null;
  minutes1: number | null;
  totalMinutes: number | null;
  workedDays: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  otMinutesNormal: number;
  otMinutesHoliday: number;
  status: string;
  source: string;
}

interface AttendanceSummary {
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  onLeaveCount: number;
  earlyExitCount: number;
  averageWorkedHours: number;
  totalOTMinutes: number;
  date: string;
}

interface ShiftOption {
  id: number;
  shiftCode: string;
  nameEn: string;
  timeIn: string;
  timeOut: string;
}

interface BranchOption {
  id: number;
  nameEn: string;
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

// ── Columns ──
const columns: GridColDef[] = [
  { field: 'employeeCode', headerName: 'Emp Code', width: 100 },
  { field: 'employeeName', headerName: 'Employee', width: 160, flex: 1 },
  { field: 'branchName', headerName: 'Branch', width: 140 },
  { field: 'shiftName', headerName: 'Shift', width: 120 },
  {
    field: 'attendanceDate', headerName: 'Date', width: 110,
    valueFormatter: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : '',
  },
  {
    field: 'timeIn1', headerName: 'Time In', width: 90,
    valueFormatter: (value: string) => value ? dayjs(value).format('HH:mm') : '—',
  },
  {
    field: 'timeOut1', headerName: 'Time Out', width: 90,
    valueFormatter: (value: string) => value ? dayjs(value).format('HH:mm') : '—',
  },
  {
    field: 'totalMinutes', headerName: 'Hours', width: 80, type: 'number',
    valueFormatter: (value: number) => value ? `${(value / 60).toFixed(1)}h` : '—',
  },
  {
    field: 'lateMinutes', headerName: 'Late', width: 70, type: 'number',
    renderCell: (params) => params.value > 0
      ? <Chip label={`${params.value}m`} size="small" color="warning" variant="outlined" />
      : <Typography variant="body2" color="text.secondary">—</Typography>,
  },
  {
    field: 'status', headerName: 'Status', width: 100,
    renderCell: (params) => {
      const colorMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
        Present: 'success', Absent: 'error', Late: 'warning', OnLeave: 'info', HalfDay: 'warning',
      };
      return <Chip label={params.value} size="small" color={colorMap[params.value as string] || 'default'} />;
    },
  },
  {
    field: 'source', headerName: 'Source', width: 90,
    renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
  },
];

// ── Main Page ──
export default function AttendancePage() {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState<Dayjs | null>(dayjs('2026-02-25'));
  const [filterBranch, setFilterBranch] = useState<number | ''>('');
  const [filterShift, setFilterShift] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    attendanceDate: dayjs('2026-02-25'),
    shiftId: '' as number | '',
    timeIn1: null as Dayjs | null,
    timeOut1: null as Dayjs | null,
    status: 'Present',
    source: 'Manual',
    remarks: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Load lookups ──
  useEffect(() => {
    api.get<ApiResponse<ShiftOption[]>>('/attendances/shifts').then(r => setShifts(r.data.data));
    api.get<ApiResponse<BranchOption[]>>('/organization/branches').then(r => {
      const list = r.data.data || [];
      setBranches(list.map((b: BranchOption & { name?: string }) => ({ id: b.id, nameEn: b.nameEn || b.name || '' })));
    }).catch(() => {});
  }, []);

  // ── Fetch attendance ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      };
      if (search) params.search = search;
      if (filterDate) params.startDate = params.endDate = filterDate.format('YYYY-MM-DD');
      if (filterBranch) params.branchId = filterBranch;
      if (filterShift) params.shiftId = filterShift;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get<ApiResponse<AttendanceRow[]>>('/attendances', { params });
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load attendance';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, filterDate, filterBranch, filterShift, filterStatus, enqueueSnackbar]);

  // ── Fetch summary ──
  const fetchSummary = useCallback(async () => {
    try {
      const params: Record<string, string | number> = {};
      if (filterDate) params.date = filterDate.format('YYYY-MM-DD');
      if (filterBranch) params.branchId = filterBranch;
      const res = await api.get<ApiResponse<AttendanceSummary>>('/attendances/summary', { params });
      setSummary(res.data.data);
    } catch { /* ignore */ }
  }, [filterDate, filterBranch]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // ── Create / Update ──
  const handleSave = async () => {
    if (!formData.employeeId) { setFormError('Employee ID is required'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        employeeId: Number(formData.employeeId),
        companyId: 1,
        branchId: Number(filterBranch) || 1,
        attendanceDate: formData.attendanceDate.format('YYYY-MM-DD'),
        shiftId: formData.shiftId || null,
        timeIn1: formData.timeIn1 ? formData.attendanceDate.format('YYYY-MM-DD') + 'T' + formData.timeIn1.format('HH:mm:ss') : null,
        timeOut1: formData.timeOut1 ? formData.attendanceDate.format('YYYY-MM-DD') + 'T' + formData.timeOut1.format('HH:mm:ss') : null,
        status: formData.status,
        source: formData.source,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        await api.put(`/attendances/${editingId}`, { ...payload, isManualOverride: true });
        enqueueSnackbar('Attendance updated', { variant: 'success' });
      } else {
        await api.post('/attendances', payload);
        enqueueSnackbar('Attendance created', { variant: 'success' });
      }
      setDialogOpen(false);
      fetchData();
      fetchSummary();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/attendances/${id}`);
      enqueueSnackbar('Attendance deleted', { variant: 'success' });
      fetchData();
      fetchSummary();
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to delete', { variant: 'error' });
    }
  };

  // ── Open dialog ──
  const openCreate = () => {
    setEditingId(null);
    setFormData({ employeeId: '', attendanceDate: filterDate || dayjs(), shiftId: '', timeIn1: null, timeOut1: null, status: 'Present', source: 'Manual', remarks: '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (row: AttendanceRow) => {
    setEditingId(row.id);
    setFormData({
      employeeId: String(row.employeeId),
      attendanceDate: dayjs(row.attendanceDate),
      shiftId: row.shiftId || '',
      timeIn1: row.timeIn1 ? dayjs(row.timeIn1) : null,
      timeOut1: row.timeOut1 ? dayjs(row.timeOut1) : null,
      status: row.status,
      source: row.source,
      remarks: '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  // Action column
  const actionColumn: GridColDef = {
    field: 'actions', headerName: '', width: 90, sortable: false,
    renderCell: (params) => (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(params.row)}><Edit fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><Delete fontSize="small" /></IconButton></Tooltip>
      </Box>
    ),
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Attendance Management</Typography>
          <Typography variant="body2" color="text.secondary">Daily attendance tracking and management</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Attendance</Button>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard icon={<People />} label="Total Employees" value={summary.totalEmployees} color="#1565C0" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard icon={<CheckCircle />} label="Present" value={summary.presentCount} color="#2E6B4A" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard icon={<Cancel />} label="Absent" value={summary.absentCount} color="#C62828" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard icon={<Schedule />} label="Late" value={summary.lateCount} color="#E65100" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard icon={<TrendingDown />} label="Early Exit" value={summary.earlyExitCount} color="#6A1B9A" />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard icon={<Timer />} label="Avg Hours" value={summary.averageWorkedHours} color="#00695C" />
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <FilterList color="action" />
        <DatePicker
          label="Date"
          value={filterDate}
          onAccept={(d) => setFilterDate(d)}
          onChange={(d) => { if (d && d.isValid()) setFilterDate(d); }}
          slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
        />
        <TextField
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 180 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Branch</InputLabel>
          <Select value={filterBranch} label="Branch" onChange={(e) => setFilterBranch(e.target.value as number | '')}>
            <MenuItem value="">All</MenuItem>
            {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.nameEn}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Shift</InputLabel>
          <Select value={filterShift} label="Shift" onChange={(e) => setFilterShift(e.target.value as number | '')}>
            <MenuItem value="">All</MenuItem>
            {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.nameEn}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Present">Present</MenuItem>
            <MenuItem value="Absent">Absent</MenuItem>
            <MenuItem value="Late">Late</MenuItem>
            <MenuItem value="OnLeave">On Leave</MenuItem>
            <MenuItem value="HalfDay">Half Day</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton onClick={() => { fetchData(); fetchSummary(); }}><Refresh /></IconButton>
        </Tooltip>
      </Paper>

      {/* Data Grid */}
      <Paper variant="outlined" sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={[...columns, actionColumn]}
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
        <DialogTitle>{editingId ? 'Edit Attendance' : 'Add Attendance'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Employee ID"
              value={formData.employeeId}
              onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))}
              size="small"
              type="number"
              required
              disabled={!!editingId}
            />
            <DatePicker
              label="Attendance Date"
              value={formData.attendanceDate}
              onAccept={(d) => d && setFormData(p => ({ ...p, attendanceDate: d }))}
              onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, attendanceDate: d })); }}
              slotProps={{ textField: { size: 'small' } }}
            />
            <FormControl size="small">
              <InputLabel>Shift</InputLabel>
              <Select value={formData.shiftId} label="Shift" onChange={(e) => setFormData(p => ({ ...p, shiftId: e.target.value as number | '' }))}>
                <MenuItem value="">None</MenuItem>
                {shifts.map(s => <MenuItem key={s.id} value={s.id}>{s.nameEn} ({s.timeIn}–{s.timeOut})</MenuItem>)}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TimePicker
                label="Time In"
                value={formData.timeIn1}
                onAccept={(d) => setFormData(p => ({ ...p, timeIn1: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, timeIn1: d })); }}
                ampm={false}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <TimePicker
                label="Time Out"
                value={formData.timeOut1}
                onAccept={(d) => setFormData(p => ({ ...p, timeOut1: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, timeOut1: d })); }}
                ampm={false}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Box>
            <Box display="flex" gap={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}>
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                  <MenuItem value="OnLeave">On Leave</MenuItem>
                  <MenuItem value="HalfDay">Half Day</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Source</InputLabel>
                <Select value={formData.source} label="Source" onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}>
                  <MenuItem value="Manual">Manual</MenuItem>
                  <MenuItem value="Biometric">Biometric</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="Mobile">Mobile</MenuItem>
                  <MenuItem value="System">System</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
              size="small"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
