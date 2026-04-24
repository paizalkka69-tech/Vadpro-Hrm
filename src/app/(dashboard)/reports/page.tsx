'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, TextField, Button, Chip,
  MenuItem, InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search, Download, People, Payments, AccessTime, EventBusy,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface EmpRow { empCode: string; nameEn: string; department?: string; designation?: string; branch?: string; nationality?: string; gender?: string; doj: string; basicSalary: number; totalSalary: number; status?: string; email?: string; mobile?: string; }
interface PayrollRow { department?: string; employeeCount: number; totalBasic: number; totalAllowances: number; totalEarnings: number; totalDeductions: number; totalNetPay: number; }
interface AttRow { empCode: string; nameEn: string; department?: string; totalDays: number; presentDays: number; absentDays: number; lateDays: number; totalOTHours: number; attendancePercentage: number; }
interface LeaveRow { empCode: string; nameEn: string; department?: string; leaveType: string; entitled: number; taken: number; balance: number; }
interface LookupItem { id: number; nameEn: string; }

const fmtNum = (v: number) => v?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';
const fmtDate = (d?: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—';

const dgSx = { border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: '#2E6B4A', color: '#fff', '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 } }, '& .MuiDataGrid-cell': { py: 0.5 } };

function useDepartments() {
  const [depts, setDepts] = useState<LookupItem[]>([]);
  useEffect(() => { api.get<ApiResponse<LookupItem[]>>('/lookups/departments').then(r => setDepts(r.data.data || [])).catch(() => {}); }, []);
  return depts;
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function ReportsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Reports</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<People />} label="Employees" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<Payments />} label="Payroll" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<AccessTime />} label="Attendance" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<EventBusy />} label="Leave" iconPosition="start" sx={{ minHeight: 48 }} />
      </Tabs>

      {tab === 0 && <EmployeeReport />}
      {tab === 1 && <PayrollReport />}
      {tab === 2 && <AttendanceReport />}
      {tab === 3 && <LeaveReport />}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPLOYEE REPORT
// ═══════════════════════════════════════════════════════════

function EmployeeReport() {
  const { enqueueSnackbar } = useSnackbar();
  const depts = useDepartments();
  const [rows, setRows] = useState<EmpRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page + 1), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      if (deptFilter) params.set('departmentId', deptFilter);
      if (statusFilter) params.set('statusId', statusFilter);
      const res = await api.get<ApiResponse<EmpRow[]>>(`/reports/employees?${params}`);
      setRows(res.data.data || []);
      setTotal(res.data.pagination?.totalCount || 0);
    } catch { enqueueSnackbar('Failed to load report', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, pageSize, search, deptFilter, statusFilter, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (deptFilter) params.set('departmentId', deptFilter);
      if (statusFilter) params.set('statusId', statusFilter);
      const res = await api.get(`/reports/employees/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'employees-report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { enqueueSnackbar('Export failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'empCode', headerName: 'Code', width: 90 },
    { field: 'nameEn', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'department', headerName: 'Department', width: 130 },
    { field: 'designation', headerName: 'Designation', width: 130 },
    { field: 'branch', headerName: 'Branch', width: 120 },
    { field: 'nationality', headerName: 'Nationality', width: 100 },
    { field: 'gender', headerName: 'Gender', width: 70 },
    { field: 'doj', headerName: 'Joined', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'basicSalary', headerName: 'Basic', width: 100, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalSalary', headerName: 'Total Salary', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'status', headerName: 'Status', width: 90, renderCell: (p) => <Chip label={p.value || 'N/A'} size="small" color={p.value === 'Active' ? 'success' : 'default'} /> },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 220 }} />
        <TextField select size="small" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(0); }} sx={{ width: 160 }} label="Department">
          <MenuItem value="">All</MenuItem>
          {depts.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ width: 120 }} label="Status">
          <MenuItem value="">All</MenuItem>
          <MenuItem value="1">Active</MenuItem>
          <MenuItem value="2">On Leave</MenuItem>
          <MenuItem value="3">Terminated</MenuItem>
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        getRowId={(r) => r.empCode}
        paginationMode="server" rowCount={total} pageSizeOptions={[50, 100]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
        sx={dgSx} disableRowSelectionOnClick />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// PAYROLL REPORT
// ═══════════════════════════════════════════════════════════

function PayrollReport() {
  const { enqueueSnackbar } = useSnackbar();
  const depts = useDepartments();
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (year) params.set('year', year);
      if (month) params.set('month', month);
      if (deptFilter) params.set('departmentId', deptFilter);
      const res = await api.get<ApiResponse<PayrollRow[]>>(`/reports/payroll?${params}`);
      setRows(res.data.data || []);
    } catch { enqueueSnackbar('Failed to load report', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [year, month, deptFilter, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (year) params.set('year', year);
      if (month) params.set('month', month);
      if (deptFilter) params.set('departmentId', deptFilter);
      const res = await api.get(`/reports/payroll/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'payroll-report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { enqueueSnackbar('Export failed', { variant: 'error' }); }
  };

  const totals = rows.reduce((acc, r) => ({
    employees: acc.employees + r.employeeCount,
    basic: acc.basic + r.totalBasic,
    allowances: acc.allowances + r.totalAllowances,
    earnings: acc.earnings + r.totalEarnings,
    deductions: acc.deductions + r.totalDeductions,
    netPay: acc.netPay + r.totalNetPay,
  }), { employees: 0, basic: 0, allowances: 0, earnings: 0, deductions: 0, netPay: 0 });

  const columns: GridColDef[] = [
    { field: 'department', headerName: 'Department', flex: 1, minWidth: 150 },
    { field: 'employeeCount', headerName: 'Employees', width: 100, align: 'center' },
    { field: 'totalBasic', headerName: 'Basic', width: 120, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalAllowances', headerName: 'Allowances', width: 120, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalEarnings', headerName: 'Earnings', width: 120, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={600}>{fmtNum(p.value)}</Typography> },
    { field: 'totalDeductions', headerName: 'Deductions', width: 120, align: 'right', renderCell: (p) => <Typography variant="body2" color="error.main">{fmtNum(p.value)}</Typography> },
    { field: 'totalNetPay', headerName: 'Net Pay', width: 130, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={700} color="success.main">{fmtNum(p.value)}</Typography> },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" type="number" value={year} onChange={e => setYear(e.target.value)} sx={{ width: 100 }} label="Year" />
        <TextField select size="small" value={month} onChange={e => setMonth(e.target.value)} sx={{ width: 120 }} label="Month">
          <MenuItem value="">All</MenuItem>
          {Array.from({ length: 12 }, (_, i) => <MenuItem key={i + 1} value={i + 1}>{dayjs().month(i).format('MMMM')}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} sx={{ width: 160 }} label="Department">
          <MenuItem value="">All</MenuItem>
          {depts.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
      </Box>

      {!loading && rows.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Employees', value: totals.employees.toString(), color: '#1976d2' },
            { label: 'Total Earnings', value: fmtNum(totals.earnings), color: '#2e6b4a' },
            { label: 'Total Deductions', value: fmtNum(totals.deductions), color: '#d32f2f' },
            { label: 'Total Net Pay', value: fmtNum(totals.netPay), color: '#2E6B4A' },
          ].map(c => (
            <Card key={c.label} sx={{ flex: 1, minWidth: 180 }}>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: c.color }}>{c.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        getRowId={(r) => r.department || 'Unassigned'}
        pageSizeOptions={[25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        sx={dgSx} disableRowSelectionOnClick />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ATTENDANCE REPORT
// ═══════════════════════════════════════════════════════════

function AttendanceReport() {
  const { enqueueSnackbar } = useSnackbar();
  const depts = useDepartments();
  const [rows, setRows] = useState<AttRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [dateTo, setDateTo] = useState<Dayjs | null>(dayjs());
  const [deptFilter, setDeptFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page + 1), pageSize: String(pageSize) });
      if (dateFrom) params.set('dateFrom', dateFrom.format('YYYY-MM-DD'));
      if (dateTo) params.set('dateTo', dateTo.format('YYYY-MM-DD'));
      if (deptFilter) params.set('departmentId', deptFilter);
      const res = await api.get<ApiResponse<AttRow[]>>(`/reports/attendance?${params}`);
      setRows(res.data.data || []);
      setTotal(res.data.pagination?.totalCount || 0);
    } catch { enqueueSnackbar('Failed to load report', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, pageSize, dateFrom, dateTo, deptFilter, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom.format('YYYY-MM-DD'));
      if (dateTo) params.set('dateTo', dateTo.format('YYYY-MM-DD'));
      if (deptFilter) params.set('departmentId', deptFilter);
      const res = await api.get(`/reports/attendance/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'attendance-report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { enqueueSnackbar('Export failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'empCode', headerName: 'Code', width: 90 },
    { field: 'nameEn', headerName: 'Employee', flex: 1, minWidth: 160 },
    { field: 'department', headerName: 'Department', width: 130 },
    { field: 'totalDays', headerName: 'Total Days', width: 90, align: 'center' },
    { field: 'presentDays', headerName: 'Present', width: 80, align: 'center', renderCell: (p) => <Chip label={p.value} size="small" color="success" variant="outlined" /> },
    { field: 'absentDays', headerName: 'Absent', width: 80, align: 'center', renderCell: (p) => p.value > 0 ? <Chip label={p.value} size="small" color="error" variant="outlined" /> : <Typography variant="body2">0</Typography> },
    { field: 'lateDays', headerName: 'Late', width: 70, align: 'center', renderCell: (p) => p.value > 0 ? <Chip label={p.value} size="small" color="warning" variant="outlined" /> : <Typography variant="body2">0</Typography> },
    { field: 'totalOTHours', headerName: 'OT Hours', width: 90, align: 'right', renderCell: (p) => p.value > 0 ? <Typography variant="body2" color="info.main">{p.value}</Typography> : '0' },
    { field: 'attendancePercentage', headerName: 'Attendance %', width: 110, align: 'center', renderCell: (p) => {
      const v = p.value as number;
      return <Chip label={`${v}%`} size="small" color={v >= 90 ? 'success' : v >= 75 ? 'warning' : 'error'} />;
    }},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <DatePicker label="From" value={dateFrom} onChange={setDateFrom} slotProps={{ textField: { size: 'small', sx: { width: 150 } } }} />
        <DatePicker label="To" value={dateTo} onChange={setDateTo} slotProps={{ textField: { size: 'small', sx: { width: 150 } } }} />
        <TextField select size="small" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(0); }} sx={{ width: 160 }} label="Department">
          <MenuItem value="">All</MenuItem>
          {depts.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        getRowId={(r) => r.empCode}
        paginationMode="server" rowCount={total} pageSizeOptions={[50, 100]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
        sx={dgSx} disableRowSelectionOnClick />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// LEAVE REPORT
// ═══════════════════════════════════════════════════════════

function LeaveReport() {
  const { enqueueSnackbar } = useSnackbar();
  const depts = useDepartments();
  const [leaveTypes, setLeaveTypes] = useState<LookupItem[]>([]);
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    api.get<ApiResponse<LookupItem[]>>('/lookups/leave-types').then(r => setLeaveTypes(r.data.data || [])).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page + 1), pageSize: String(pageSize) });
      if (year) params.set('year', year);
      if (deptFilter) params.set('departmentId', deptFilter);
      if (typeFilter) params.set('leaveTypeId', typeFilter);
      const res = await api.get<ApiResponse<LeaveRow[]>>(`/reports/leave?${params}`);
      setRows(res.data.data || []);
      setTotal(res.data.pagination?.totalCount || 0);
    } catch { enqueueSnackbar('Failed to load report', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, pageSize, year, deptFilter, typeFilter, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (year) params.set('year', year);
      if (deptFilter) params.set('departmentId', deptFilter);
      if (typeFilter) params.set('leaveTypeId', typeFilter);
      const res = await api.get(`/reports/leave/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'leave-report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { enqueueSnackbar('Export failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'empCode', headerName: 'Code', width: 90 },
    { field: 'nameEn', headerName: 'Employee', flex: 1, minWidth: 160 },
    { field: 'department', headerName: 'Department', width: 130 },
    { field: 'leaveType', headerName: 'Leave Type', width: 140 },
    { field: 'entitled', headerName: 'Entitled', width: 90, align: 'center' },
    { field: 'taken', headerName: 'Taken', width: 80, align: 'center', renderCell: (p) => p.value > 0 ? <Typography variant="body2" color="error.main" fontWeight={600}>{p.value}</Typography> : '0' },
    { field: 'balance', headerName: 'Balance', width: 90, align: 'center', renderCell: (p) => <Chip label={p.value} size="small" color={p.value > 5 ? 'success' : p.value > 0 ? 'warning' : 'error'} /> },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" type="number" value={year} onChange={e => { setYear(e.target.value); setPage(0); }} sx={{ width: 100 }} label="Year" />
        <TextField select size="small" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(0); }} sx={{ width: 160 }} label="Department">
          <MenuItem value="">All</MenuItem>
          {depts.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} sx={{ width: 160 }} label="Leave Type">
          <MenuItem value="">All</MenuItem>
          {leaveTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.nameEn}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        getRowId={(r) => `${r.empCode}-${r.leaveType}`}
        paginationMode="server" rowCount={total} pageSizeOptions={[50, 100]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
        sx={dgSx} disableRowSelectionOnClick />
    </>
  );
}
