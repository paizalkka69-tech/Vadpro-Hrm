'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, TextField, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, MenuItem, Skeleton,
  FormControlLabel, Switch, Tooltip, LinearProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add, Edit, Delete, Calculate, ListAlt, AccountBalanceWallet,
  CheckCircle, Cancel, PriceCheck, Search, Visibility,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface EosSummary { totalSettlements: number; draftCount: number; approvedCount: number; paidCount: number; totalEOSAmount: number; totalNetSettlement: number; }
interface EosRow { id: number; employeeId: number; employeeCode: string; employeeName: string; reasonName: string; settlementDate: string; lastWorkingDate: string; serviceYears: number; totalEOS: number; eosPercentage: number; finalEOS: number; pendingSalary: number; leaveSalary: number; overtimeAmount: number; otherAdditions: number; loanBalance: number; advanceBalance: number; absenceDeduction: number; otherDeductions: number; netSettlement: number; status: string; remarks?: string; }
interface EosReason { id: number; reasonCode: string; nameEn: string; nameAr?: string; eosPercentage: number; lawArticle?: string; appliesTo: string; isSystem: boolean; isActive: boolean; }
interface ProvisionRow { id: number; provisionNo: string; provisionMonth: string; provisionDate: string; totalAmount: number; totalEmployees: number; status: string; remarks?: string; }
interface ProvisionDetailRow { id: number; employeeId: number; employeeCode: string; employeeName: string; serviceMonths: number; monthlySalary: number; provisionAmount: number; cumulativeProvision: number; }
interface EmpOption { id: number; empCode: string; nameEn: string; }

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }
function fmtMonth(d: string) { return dayjs(d).format('MMM YYYY'); }
function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function statusChip(status: string) {
  const map: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = { Calculated: 'info', Approved: 'warning', Paid: 'success', Cancelled: 'error', Draft: 'default', Posted: 'success' };
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
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function EOSPage() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<EosSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse<EosSummary>>('/eos/summary')
      .then(r => setSummary(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [tab]);

  if (loading) return <Box sx={{ p: 3 }}>{[1,2,3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}</Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>End of Service (EOS)</Typography>

      {summary && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <StatCard title="Total Settlements" value={summary.totalSettlements} color="#1565C0" />
          <StatCard title="Draft" value={summary.draftCount} color="#757575" />
          <StatCard title="Approved" value={summary.approvedCount} color="#E65100" />
          <StatCard title="Paid" value={summary.paidCount} color="#2E6B4A" />
          <StatCard title="Total EOS" value={fmtNum(summary.totalEOSAmount)} color="#6A1B9A" prefix="SAR " />
          <StatCard title="Total Net Settlement" value={fmtNum(summary.totalNetSettlement)} color="#D32F2F" prefix="SAR " />
        </Box>
      )}

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab icon={<Calculate />} iconPosition="start" label="Settlements" />
          <Tab icon={<ListAlt />} iconPosition="start" label="EOS Reasons" />
          <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Provisions" />
        </Tabs>
        <CardContent>
          {tab === 0 && <SettlementsTab />}
          {tab === 1 && <ReasonsTab />}
          {tab === 2 && <ProvisionsTab />}
        </CardContent>
      </Card>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function useEmployees() {
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  useEffect(() => { api.get<ApiResponse<EmpOption[]>>('/employees/lookup').then(r => setEmployees(r.data.data || [])).catch(() => {}); }, []);
  return employees;
}

function useEosReasons() {
  const [reasons, setReasons] = useState<EosReason[]>([]);
  useEffect(() => { api.get<ApiResponse<EosReason[]>>('/eos/reasons').then(r => setReasons(r.data.data || [])).catch(() => {}); }, []);
  return reasons;
}

// ═══════════════════════════════════════════════════════════
// TAB 0: SETTLEMENTS
// ═══════════════════════════════════════════════════════════

function SettlementsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const employees = useEmployees();
  const reasons = useEosReasons();
  const [rows, setRows] = useState<EosRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const defaultForm = {
    employeeId: 0, eosReasonId: 0,
    settlementDate: dayjs() as Dayjs | null, lastWorkingDate: dayjs() as Dayjs | null,
    pendingSalary: 0, overtimeAmount: 0, otherAdditions: 0, otherDeductions: 0,
    ticketProvided: false, ticketAmount: 0, remarks: '',
  };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<EosRow[]>>('/eos', { params: { page: page + 1, pageSize, search: search || undefined, status: statusFilter || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = () => {
    setForm(defaultForm);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = {
        ...form,
        settlementDate: form.settlementDate?.format('YYYY-MM-DD'),
        lastWorkingDate: form.lastWorkingDate?.format('YYYY-MM-DD'),
      };
      await api.post('/eos', body);
      enqueueSnackbar('Settlement created', { variant: 'success' });
      setOpen(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      await api.put(`/eos/${id}/${action}`);
      enqueueSnackbar(`Settlement ${action === 'pay' ? 'paid' : action + 'd'}`, { variant: 'success' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this settlement?')) return;
    try { await api.delete(`/eos/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 140, renderCell: (p) => <Box><Typography variant="body2" fontWeight={600}>{p.value}</Typography><Typography variant="caption" color="text.secondary">{p.row.employeeCode}</Typography></Box> },
    { field: 'reasonName', headerName: 'Reason', width: 130 },
    { field: 'settlementDate', headerName: 'Settlement Date', width: 110, renderCell: (p) => fmtDate(p.value) },
    { field: 'serviceYears', headerName: 'Service Yrs', width: 90, align: 'center', renderCell: (p) => p.value?.toFixed(1) },
    { field: 'finalEOS', headerName: 'EOS Amount', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'additions', headerName: 'Additions', width: 100, align: 'right', renderCell: (p) => { const r = p.row as EosRow; return <Typography variant="body2" color="success.main">{fmtNum(r.pendingSalary + r.leaveSalary + r.overtimeAmount + r.otherAdditions)}</Typography>; } },
    { field: 'deductions', headerName: 'Deductions', width: 100, align: 'right', renderCell: (p) => { const r = p.row as EosRow; return <Typography variant="body2" color="error.main">{fmtNum(r.loanBalance + r.advanceBalance + r.absenceDeduction + r.otherDeductions)}</Typography>; } },
    { field: 'netSettlement', headerName: 'Net Settlement', width: 120, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={700} color="primary.main">{fmtNum(p.value)}</Typography> },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => statusChip(p.value) },
    { field: 'actions', headerName: '', width: 140, sortable: false, renderCell: (p) => {
      const r = p.row as EosRow;
      return (
        <>
          {can('EOS:Edit') && r.status === 'Calculated' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleAction(r.id, 'approve')}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
          {can('EOS:Edit') && r.status === 'Approved' && <Tooltip title="Mark as Paid"><IconButton size="small" color="info" onClick={() => handleAction(r.id, 'pay')}><PriceCheck fontSize="small" /></IconButton></Tooltip>}
          {can('EOS:Edit') && (r.status === 'Calculated' || r.status === 'Approved') && <Tooltip title="Cancel"><IconButton size="small" color="error" onClick={() => handleAction(r.id, 'cancel')}><Cancel fontSize="small" /></IconButton></Tooltip>}
          {can('EOS:Delete') && (r.status === 'Calculated' || r.status === 'Cancelled') && <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>}
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
          {['Calculated','Approved','Paid','Cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        {can('EOS:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>New Settlement</Button>}
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact" sx={dgSx}
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      {/* Create/Edit Settlement Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New EOS Settlement</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <TextField select label="EOS Reason" size="small" value={form.eosReasonId || ''} onChange={e => setForm(p => ({ ...p, eosReasonId: Number(e.target.value) }))}>
            <MenuItem value="">Select...</MenuItem>
            {reasons.filter(r => r.isActive).map(r => <MenuItem key={r.id} value={r.id}>{r.reasonCode} - {r.nameEn} ({r.eosPercentage}%)</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Settlement Date" value={form.settlementDate} onAccept={d => setForm(p => ({ ...p, settlementDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, settlementDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Last Working Date" value={form.lastWorkingDate} onAccept={d => setForm(p => ({ ...p, lastWorkingDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, lastWorkingDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Pending Salary" size="small" type="number" fullWidth value={form.pendingSalary || ''} onChange={e => setForm(p => ({ ...p, pendingSalary: Number(e.target.value) }))} />
            <TextField label="Overtime Amount" size="small" type="number" fullWidth value={form.overtimeAmount || ''} onChange={e => setForm(p => ({ ...p, overtimeAmount: Number(e.target.value) }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Other Additions" size="small" type="number" fullWidth value={form.otherAdditions || ''} onChange={e => setForm(p => ({ ...p, otherAdditions: Number(e.target.value) }))} />
            <TextField label="Other Deductions" size="small" type="number" fullWidth value={form.otherDeductions || ''} onChange={e => setForm(p => ({ ...p, otherDeductions: Number(e.target.value) }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel control={<Switch checked={form.ticketProvided} onChange={e => setForm(p => ({ ...p, ticketProvided: e.target.checked }))} />} label="Ticket Provided" />
            <TextField label="Ticket Amount" size="small" type="number" fullWidth value={form.ticketAmount || ''} onChange={e => setForm(p => ({ ...p, ticketAmount: Number(e.target.value) }))} disabled={!form.ticketProvided} />
          </Box>
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.eosReasonId}>Calculate & Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: EOS REASONS
// ═══════════════════════════════════════════════════════════

function ReasonsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const [rows, setRows] = useState<EosReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EosReason | null>(null);
  const defaultForm = { reasonCode: '', nameEn: '', nameAr: '', eosPercentage: 100, lawArticle: '', appliesTo: 'Both', isActive: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<EosReason[]>>('/eos/reasons').then(r => setRows(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: EosReason) => {
    if (row) {
      setEditing(row);
      setForm({ reasonCode: row.reasonCode, nameEn: row.nameEn, nameAr: row.nameAr || '', eosPercentage: row.eosPercentage, lawArticle: row.lawArticle || '', appliesTo: row.appliesTo, isActive: row.isActive });
    } else {
      setEditing(null);
      setForm(defaultForm);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await api.put(`/eos/reasons/${editing.id}`, form);
      else await api.post('/eos/reasons', form);
      enqueueSnackbar(editing ? 'Reason updated' : 'Reason created', { variant: 'success' });
      setOpen(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this EOS reason?')) return;
    try { await api.delete(`/eos/reasons/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'reasonCode', headerName: 'Code', width: 100 },
    { field: 'nameEn', headerName: 'Name (En)', flex: 1, minWidth: 180 },
    { field: 'nameAr', headerName: 'Name (Ar)', flex: 1, minWidth: 150, renderCell: (p) => p.value || '—' },
    { field: 'eosPercentage', headerName: 'EOS %', width: 80, align: 'center', renderCell: (p) => <Chip label={`${p.value}%`} size="small" variant="outlined" color={p.value >= 100 ? 'success' : p.value >= 50 ? 'warning' : 'error'} /> },
    { field: 'lawArticle', headerName: 'Law Article', width: 110, renderCell: (p) => p.value || '—' },
    { field: 'appliesTo', headerName: 'Applies To', width: 110, renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" /> },
    { field: 'isActive', headerName: 'Active', width: 70, renderCell: (p) => p.value ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" /> },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => {
      const r = p.row as EosReason;
      if (r.isSystem) return <Chip label="System" size="small" variant="outlined" />;
      return (
        <>
          {can('EOS:Edit') && <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>}
          {can('EOS:Delete') && <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>}
        </>
      );
    }},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {can('EOS:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Reason</Button>}
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact" sx={dgSx}
        pageSizeOptions={[25,50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit EOS Reason' : 'New EOS Reason'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Reason Code" size="small" fullWidth value={form.reasonCode} onChange={e => setForm(p => ({ ...p, reasonCode: e.target.value }))} />
            <TextField label="EOS Percentage" size="small" type="number" fullWidth value={form.eosPercentage} onChange={e => setForm(p => ({ ...p, eosPercentage: Number(e.target.value) }))}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Name (En)" size="small" fullWidth value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} />
            <TextField label="Name (Ar)" size="small" fullWidth value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Law Article" size="small" fullWidth value={form.lawArticle} onChange={e => setForm(p => ({ ...p, lawArticle: e.target.value }))} placeholder="e.g. Art. 84" />
            <TextField select label="Applies To" size="small" fullWidth value={form.appliesTo} onChange={e => setForm(p => ({ ...p, appliesTo: e.target.value }))}>
              {['Employee','Employer','Both','Death'].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
          </Box>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.reasonCode || !form.nameEn}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: PROVISIONS
// ═══════════════════════════════════════════════════════════

function ProvisionsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const [rows, setRows] = useState<ProvisionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [open, setOpen] = useState(false);
  const defaultForm = { provisionMonth: dayjs().startOf('month') as Dayjs | null, remarks: '' };
  const [form, setForm] = useState(defaultForm);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRows, setDetailRows] = useState<ProvisionDetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedProv, setSelectedProv] = useState<ProvisionRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<ProvisionRow[]>>('/eos/provisions', { params: { page: page + 1, pageSize } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      const body = { provisionMonth: form.provisionMonth?.format('YYYY-MM-DD'), remarks: form.remarks };
      await api.post('/eos/provisions', body);
      enqueueSnackbar('Provision run created', { variant: 'success' });
      setOpen(false); setForm(defaultForm); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handlePost = async (id: number) => {
    try {
      await api.put(`/eos/provisions/${id}/post`);
      enqueueSnackbar('Provision posted', { variant: 'success' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Post failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const viewDetails = async (prov: ProvisionRow) => {
    setSelectedProv(prov);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const r = await api.get<ApiResponse<ProvisionDetailRow[]>>(`/eos/provisions/${prov.id}/details`);
      setDetailRows(r.data.data || []);
    } catch { enqueueSnackbar('Failed to load details', { variant: 'error' }); }
    finally { setDetailLoading(false); }
  };

  const columns: GridColDef[] = [
    { field: 'provisionNo', headerName: 'Provision No', width: 130 },
    { field: 'provisionMonth', headerName: 'Month', width: 110, renderCell: (p) => fmtMonth(p.value) },
    { field: 'provisionDate', headerName: 'Date', width: 110, renderCell: (p) => fmtDate(p.value) },
    { field: 'totalAmount', headerName: 'Total Amount', width: 130, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={600}>{fmtNum(p.value)}</Typography> },
    { field: 'totalEmployees', headerName: 'Employees', width: 100, align: 'center' },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => statusChip(p.value) },
    { field: 'remarks', headerName: 'Remarks', flex: 1, minWidth: 120, renderCell: (p) => p.value || '—' },
    { field: 'actions', headerName: '', width: 110, sortable: false, renderCell: (p) => {
      const r = p.row as ProvisionRow;
      return (
        <>
          <Tooltip title="View Details"><IconButton size="small" onClick={() => viewDetails(r)}><Visibility fontSize="small" /></IconButton></Tooltip>
          {can('EOS:Edit') && r.status === 'Draft' && <Tooltip title="Post Provision"><IconButton size="small" color="success" onClick={() => handlePost(r.id)}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
        </>
      );
    }},
  ];

  const detailColumns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'serviceMonths', headerName: 'Service Months', width: 120, align: 'center' },
    { field: 'monthlySalary', headerName: 'Monthly Salary', width: 120, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'provisionAmount', headerName: 'Provision Amount', width: 140, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={600} color="primary.main">{fmtNum(p.value)}</Typography> },
    { field: 'cumulativeProvision', headerName: 'Cumulative', width: 130, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={700}>{fmtNum(p.value)}</Typography> },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {can('EOS:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpen(true)}>New Provision Run</Button>}
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact" sx={dgSx}
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      {/* Create Provision Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New EOS Provision Run</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <DatePicker label="Provision Month" value={form.provisionMonth} views={['month', 'year']} onAccept={d => setForm(p => ({ ...p, provisionMonth: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, provisionMonth: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.provisionMonth}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Provision Details Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Provision Details — {selectedProv?.provisionNo} ({selectedProv ? fmtMonth(selectedProv.provisionMonth) : ''})</DialogTitle>
        <DialogContent>
          {detailLoading ? <LinearProgress /> : (
            <DataGrid rows={detailRows} columns={detailColumns} autoHeight density="compact" sx={dgSx}
              pageSizeOptions={[50,100]} initialState={{ pagination: { paginationModel: { pageSize: 50 } } }} />
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </>
  );
}
