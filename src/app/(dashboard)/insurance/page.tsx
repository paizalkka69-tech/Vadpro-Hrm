'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, TextField, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, MenuItem, Skeleton,
  FormControlLabel, Switch, Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search, Add, Edit, Delete, HealthAndSafety, AccountBalance,
  CheckCircle, Send,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface InsurancePolicy {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  insuranceType: string; provider: string; policyNo: string; memberNo: string;
  insuranceClass: string; startDate: string; endDate: string;
  premiumAmount: number; paidBy: string; coversDependents: boolean; status: string;
}
interface InsuranceSummary {
  totalPolicies: number; activePolicies: number; expiringIn30Days: number;
  expired: number; totalPremium: number; coveredEmployees: number;
}
interface GosiRecord {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  registrationNo: string; schemeType: string; contributionMonth: string;
  contributorySalary: number; employeeRate: number; employerRate: number;
  hazardsRate: number; employeeShare: number; employerShare: number;
  hazardsShare: number; totalContribution: number; status: string;
}
interface GosiSummary {
  totalRecords: number; calculatedCount: number; submittedCount: number;
  confirmedCount: number; totalEmployeeShare: number; totalEmployerShare: number;
}
interface EmpOption { id: number; empCode: string; nameEn: string; }

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }
function fmtMonth(d: string) { return dayjs(d).format('MMM YYYY'); }
function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function statusChip(status: string) {
  const map: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
    Active: 'success', Expired: 'error', Current: 'success',
    Calculated: 'default', Submitted: 'info', Confirmed: 'success',
  };
  return <Chip label={status} size="small" color={map[status] || 'default'} />;
}

function StatCard({ title, value, color, prefix }: { title: string; value: number | string; color: string; prefix?: string }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ color }}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
      </CardContent>
    </Card>
  );
}

const dgSx = {
  border: 0, minHeight: 400,
  '& .MuiDataGrid-columnHeaders': { bgcolor: '#2E6B4A', color: '#fff' },
  '& .MuiDataGrid-columnHeader': { bgcolor: '#2E6B4A', color: '#fff' },
  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, color: '#fff' },
  '& .MuiDataGrid-sortIcon': { color: '#fff' },
  '& .MuiDataGrid-menuIconButton': { color: '#fff' },
  '& .MuiDataGrid-iconButtonContainer .MuiSvgIcon-root': { color: '#fff' },
  '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.3)' },
  '& .MuiDataGrid-filler': { bgcolor: '#2E6B4A' },
  '& .MuiDataGrid-row:hover': { bgcolor: '#F0FDF4 !important' },
  '& .MuiDataGrid-cell': { fontSize: '0.85rem', py: 0.5 },
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function InsurancePage() {
  const [tab, setTab] = useState(0);
  const [insSummary, setInsSummary] = useState<InsuranceSummary | null>(null);
  const [gosiSummary, setGosiSummary] = useState<GosiSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const p1 = api.get<ApiResponse<InsuranceSummary>>('/insurance/summary').then(r => setInsSummary(r.data.data)).catch(() => {});
    const p2 = api.get<ApiResponse<GosiSummary>>('/insurance/gosi/summary').then(r => setGosiSummary(r.data.data)).catch(() => {});
    Promise.all([p1, p2]).finally(() => setLoading(false));
  }, [tab]);

  if (loading) return <Box sx={{ p: 3 }}>{[1, 2, 3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}</Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Insurance & GOSI</Typography>

      {tab === 0 && insSummary && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <StatCard title="Total Policies" value={insSummary.totalPolicies} color="#1565C0" />
          <StatCard title="Active" value={insSummary.activePolicies} color="#2E6B4A" />
          <StatCard title="Expiring in 30d" value={insSummary.expiringIn30Days} color="#E65100" />
          <StatCard title="Expired" value={insSummary.expired} color="#D32F2F" />
          <StatCard title="Total Premium" value={fmtNum(insSummary.totalPremium)} color="#6A1B9A" prefix="SAR " />
          <StatCard title="Covered Employees" value={insSummary.coveredEmployees} color="#00695C" />
        </Box>
      )}

      {tab === 1 && gosiSummary && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <StatCard title="Total Records" value={gosiSummary.totalRecords} color="#1565C0" />
          <StatCard title="Calculated" value={gosiSummary.calculatedCount} color="#757575" />
          <StatCard title="Submitted" value={gosiSummary.submittedCount} color="#0288D1" />
          <StatCard title="Confirmed" value={gosiSummary.confirmedCount} color="#2E6B4A" />
          <StatCard title="Total Emp Share" value={fmtNum(gosiSummary.totalEmployeeShare)} color="#6A1B9A" prefix="SAR " />
          <StatCard title="Total Empr Share" value={fmtNum(gosiSummary.totalEmployerShare)} color="#D32F2F" prefix="SAR " />
        </Box>
      )}

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab icon={<HealthAndSafety />} iconPosition="start" label="Medical Insurance" />
          <Tab icon={<AccountBalance />} iconPosition="start" label="GOSI Contributions" />
        </Tabs>
        <CardContent>
          {tab === 0 && <InsuranceTab />}
          {tab === 1 && <GosiTab />}
        </CardContent>
      </Card>
    </Box>
  );
}

function useEmployees() {
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  useEffect(() => { api.get<ApiResponse<EmpOption[]>>('/employees/lookup').then(r => setEmployees(r.data.data || [])).catch(() => {}); }, []);
  return employees;
}

// ═══════════════════════════════════════════════════════════
// TAB 0: MEDICAL INSURANCE
// ═══════════════════════════════════════════════════════════

function InsuranceTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const employees = useEmployees();
  const [rows, setRows] = useState<InsurancePolicy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InsurancePolicy | null>(null);
  const defaultForm = {
    employeeId: 0,
    insuranceType: 'Medical',
    provider: '',
    policyNo: '',
    memberNo: '',
    insuranceClass: '',
    startDate: dayjs() as Dayjs | null,
    endDate: dayjs().add(1, 'year') as Dayjs | null,
    premiumAmount: 0,
    paidBy: 'Company',
    coversDependents: false,
  };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<InsurancePolicy[]>>('/insurance', {
      params: { page: page + 1, pageSize, search: search || undefined, insuranceType: typeFilter || undefined },
    })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: InsurancePolicy) => {
    if (row) {
      setEditing(row);
      setForm({
        employeeId: row.employeeId,
        insuranceType: row.insuranceType,
        provider: row.provider,
        policyNo: row.policyNo,
        memberNo: row.memberNo,
        insuranceClass: row.insuranceClass,
        startDate: dayjs(row.startDate),
        endDate: dayjs(row.endDate),
        premiumAmount: row.premiumAmount,
        paidBy: row.paidBy,
        coversDependents: row.coversDependents,
      });
    } else {
      setEditing(null);
      setForm(defaultForm);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        ...form,
        startDate: form.startDate?.format('YYYY-MM-DD'),
        endDate: form.endDate?.format('YYYY-MM-DD'),
      };
      if (editing) await api.put(`/insurance/${editing.id}`, body);
      else await api.post('/insurance', body);
      enqueueSnackbar(editing ? 'Policy updated' : 'Policy created', { variant: 'success' });
      setOpen(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this insurance policy?')) return;
    try {
      await api.delete(`/insurance/${id}`);
      enqueueSnackbar('Policy deleted', { variant: 'success' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'insuranceType', headerName: 'Type', width: 90 },
    { field: 'provider', headerName: 'Provider', width: 130 },
    { field: 'policyNo', headerName: 'Policy No', width: 120 },
    { field: 'startDate', headerName: 'Start', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'endDate', headerName: 'End', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'premiumAmount', headerName: 'Premium', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value ?? 0) },
    { field: 'paidBy', headerName: 'Paid By', width: 90 },
    { field: 'status', headerName: 'Status', width: 95, renderCell: (p) => {
      const endDate = (p.row as InsurancePolicy).endDate;
      const isExpired = dayjs(endDate).isBefore(dayjs(), 'day');
      return <Chip label={isExpired ? 'Expired' : 'Current'} size="small" color={isExpired ? 'error' : 'success'} />;
    }},
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        {can('Insurance:Edit') && <IconButton size="small" onClick={() => handleOpen(p.row as InsurancePolicy)}><Edit fontSize="small" /></IconButton>}
        {can('Insurance:Delete') && <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>}
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search employee..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 250 }} />
        <TextField select size="small" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0); }} sx={{ width: 140 }} label="Type">
          <MenuItem value="">All Types</MenuItem>
          {['Medical', 'Dental', 'Life', 'Travel'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        {can('Insurance:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Policy</Button>}
      </Box>

      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25, 50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
        sx={dgSx} disableRowSelectionOnClick />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Insurance Policy' : 'New Insurance Policy'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Insurance Type" size="small" fullWidth value={form.insuranceType} onChange={e => setForm(p => ({ ...p, insuranceType: e.target.value }))}>
              {['Medical', 'Dental', 'Life', 'Travel'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Provider" size="small" fullWidth value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Policy No" size="small" fullWidth value={form.policyNo} onChange={e => setForm(p => ({ ...p, policyNo: e.target.value }))} />
            <TextField label="Member No" size="small" fullWidth value={form.memberNo} onChange={e => setForm(p => ({ ...p, memberNo: e.target.value }))} />
          </Box>
          <TextField label="Insurance Class" size="small" value={form.insuranceClass} onChange={e => setForm(p => ({ ...p, insuranceClass: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Start Date" value={form.startDate} onAccept={d => setForm(p => ({ ...p, startDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, startDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="End Date" value={form.endDate} onAccept={d => setForm(p => ({ ...p, endDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, endDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Premium Amount" size="small" type="number" fullWidth value={form.premiumAmount || ''} onChange={e => setForm(p => ({ ...p, premiumAmount: Number(e.target.value) }))}
              InputProps={{ startAdornment: <InputAdornment position="start">SAR</InputAdornment> }} />
            <TextField select label="Paid By" size="small" fullWidth value={form.paidBy} onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))}>
              {['Company', 'Employee', 'Both'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
          </Box>
          <FormControlLabel
            control={<Switch checked={form.coversDependents} onChange={e => setForm(p => ({ ...p, coversDependents: e.target.checked }))} />}
            label="Covers Dependents"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.policyNo || !form.provider}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: GOSI CONTRIBUTIONS
// ═══════════════════════════════════════════════════════════

function GosiTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const employees = useEmployees();
  const [rows, setRows] = useState<GosiRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GosiRecord | null>(null);
  const defaultForm = {
    employeeId: 0,
    registrationNo: '',
    schemeType: 'Annuity',
    contributionMonth: dayjs().startOf('month') as Dayjs | null,
    contributorySalary: 0,
    employeeRate: 9.75,
    employerRate: 11.75,
    hazardsRate: 2.0,
  };
  const [form, setForm] = useState(defaultForm);

  const calcEmployeeShare = form.contributorySalary * (form.employeeRate / 100);
  const calcEmployerShare = form.contributorySalary * (form.employerRate / 100);
  const calcHazardsShare = form.contributorySalary * (form.hazardsRate / 100);
  const calcTotal = calcEmployeeShare + calcEmployerShare + calcHazardsShare;

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<GosiRecord[]>>('/insurance/gosi', {
      params: { page: page + 1, pageSize, search: search || undefined, status: statusFilter || undefined },
    })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: GosiRecord) => {
    if (row) {
      setEditing(row);
      setForm({
        employeeId: row.employeeId,
        registrationNo: row.registrationNo,
        schemeType: row.schemeType,
        contributionMonth: dayjs(row.contributionMonth),
        contributorySalary: row.contributorySalary,
        employeeRate: row.employeeRate,
        employerRate: row.employerRate,
        hazardsRate: row.hazardsRate,
      });
    } else {
      setEditing(null);
      setForm(defaultForm);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        ...form,
        contributionMonth: form.contributionMonth?.format('YYYY-MM-DD'),
        employeeShare: calcEmployeeShare,
        employerShare: calcEmployerShare,
        hazardsShare: calcHazardsShare,
        totalContribution: calcTotal,
      };
      if (editing) await api.put(`/insurance/gosi/${editing.id}`, body);
      else await api.post('/insurance/gosi', body);
      enqueueSnackbar(editing ? 'GOSI record updated' : 'GOSI record created', { variant: 'success' });
      setOpen(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this GOSI record?')) return;
    try {
      await api.delete(`/insurance/gosi/${id}`);
      enqueueSnackbar('GOSI record deleted', { variant: 'success' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleStatusAction = async (id: number, action: string) => {
    try {
      await api.put(`/insurance/gosi/${id}/${action}`);
      enqueueSnackbar(`Record ${action === 'submit' ? 'submitted' : 'confirmed'}`, { variant: 'success' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'registrationNo', headerName: 'Reg No', width: 110 },
    { field: 'contributionMonth', headerName: 'Month', width: 100, renderCell: (p) => fmtMonth(p.value) },
    { field: 'contributorySalary', headerName: 'Salary', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'employeeShare', headerName: 'Emp Share', width: 105, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'employerShare', headerName: 'Empr Share', width: 105, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'hazardsShare', headerName: 'Hazards', width: 95, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalContribution', headerName: 'Total', width: 110, align: 'right', renderCell: (p) => (
      <Typography variant="body2" fontWeight={700} color="primary.main">{fmtNum(p.value)}</Typography>
    )},
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => statusChip(p.value) },
    { field: 'actions', headerName: '', width: 140, sortable: false, renderCell: (p) => {
      const r = p.row as GosiRecord;
      return (
        <>
          {can('Insurance:Edit') && r.status === 'Calculated' && (
            <Tooltip title="Submit">
              <IconButton size="small" color="info" onClick={() => handleStatusAction(r.id, 'submit')}><Send fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {can('Insurance:Edit') && r.status === 'Submitted' && (
            <Tooltip title="Confirm">
              <IconButton size="small" color="success" onClick={() => handleStatusAction(r.id, 'confirm')}><CheckCircle fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {can('Insurance:Edit') && r.status !== 'Confirmed' && (
            <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
          )}
          {can('Insurance:Delete') && r.status === 'Calculated' && (
            <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
          )}
        </>
      );
    }},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search employee..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 250 }} />
        <TextField select size="small" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ width: 140 }} label="Status">
          <MenuItem value="">All</MenuItem>
          {['Calculated', 'Submitted', 'Confirmed'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        {can('Insurance:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add GOSI Record</Button>}
      </Box>

      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25, 50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
        sx={dgSx} disableRowSelectionOnClick />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit GOSI Record' : 'New GOSI Record'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Registration No" size="small" fullWidth value={form.registrationNo} onChange={e => setForm(p => ({ ...p, registrationNo: e.target.value }))} />
            <TextField select label="Scheme Type" size="small" fullWidth value={form.schemeType} onChange={e => setForm(p => ({ ...p, schemeType: e.target.value }))}>
              {['Annuity', 'Hazards', 'Both'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Box>
          <DatePicker label="Contribution Month" value={form.contributionMonth} views={['month', 'year']}
            onAccept={d => setForm(p => ({ ...p, contributionMonth: d }))}
            onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, contributionMonth: d })); }}
            slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <TextField label="Contributory Salary" size="small" type="number" value={form.contributorySalary || ''} onChange={e => setForm(p => ({ ...p, contributorySalary: Number(e.target.value) }))}
            InputProps={{ startAdornment: <InputAdornment position="start">SAR</InputAdornment> }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Employee Rate (%)" size="small" type="number" fullWidth value={form.employeeRate} onChange={e => setForm(p => ({ ...p, employeeRate: Number(e.target.value) }))}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
            <TextField label="Employer Rate (%)" size="small" type="number" fullWidth value={form.employerRate} onChange={e => setForm(p => ({ ...p, employerRate: Number(e.target.value) }))}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
            <TextField label="Hazards Rate (%)" size="small" type="number" fullWidth value={form.hazardsRate} onChange={e => setForm(p => ({ ...p, hazardsRate: Number(e.target.value) }))}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
          </Box>
          {form.contributorySalary > 0 && (
            <Card variant="outlined" sx={{ bgcolor: '#F5F5F5' }}>
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Calculated Shares</Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Employee Share</Typography>
                    <Typography variant="body2" fontWeight={600}>SAR {fmtNum(calcEmployeeShare)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Employer Share</Typography>
                    <Typography variant="body2" fontWeight={600}>SAR {fmtNum(calcEmployerShare)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hazards</Typography>
                    <Typography variant="body2" fontWeight={600}>SAR {fmtNum(calcHazardsShare)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">SAR {fmtNum(calcTotal)}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.registrationNo || form.contributorySalary <= 0}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
