'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, TextField, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, MenuItem, Skeleton,
  FormControlLabel, Checkbox, Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search, Add, Edit, Delete, RequestQuote, Category, Receipt,
  CheckCircle, Cancel, Block, Close,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface LoanType { id: number; typeCode: string; nameEn: string; nameAr?: string; maxAmount?: number; maxInstallments?: number; maxMultiplier?: number; requiresGuarantor: boolean; minServiceMonths: number; isActive: boolean; }
interface LoanSummary { totalLoans: number; activeLoans: number; pendingApproval: number; fullyRepaid: number; totalDisbursed: number; totalRecovered: number; totalOutstanding: number; }
interface LoanRow { id: number; employeeId: number; employeeCode: string; employeeName: string; loanTypeId: number; loanTypeName: string; loanNo: string; loanDate: string; loanAmount: number; totalRepayable: number; installmentCount: number; installmentAmount: number; recoveryStartMonth: string; recoveredAmount: number; balanceAmount: number; guarantorName?: string; disbursementDate?: string; status: string; remarks?: string; }
interface RecoveryRow { id: number; loanId: number; loanNo: string; employeeId: number; employeeCode: string; employeeName: string; recoveryDate: string; installmentNo: number; amount: number; principalAmount: number; source: string; remarks?: string; }
interface EmpOption { id: number; empCode: string; nameEn: string; }

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }
function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function statusChip(status: string) {
  const map: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = { Pending: 'warning', Active: 'info', Closed: 'success', Rejected: 'error' };
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

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function LoansPage() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse<LoanSummary>>('/loans/summary')
      .then(r => setSummary(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  if (loading) return <Box sx={{ p: 3 }}>{[1,2,3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}</Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Loan Management</Typography>

      {summary && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <StatCard title="Total Loans" value={summary.totalLoans} color="#1565C0" />
          <StatCard title="Active" value={summary.activeLoans} color="#2E6B4A" />
          <StatCard title="Pending Approval" value={summary.pendingApproval} color="#E65100" />
          <StatCard title="Fully Repaid" value={summary.fullyRepaid} color="#6A1B9A" />
          <StatCard title="Outstanding" value={fmtNum(summary.totalOutstanding)} color="#D32F2F" />
        </Box>
      )}

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab icon={<RequestQuote />} iconPosition="start" label="Loans" />
          <Tab icon={<Receipt />} iconPosition="start" label="Recoveries" />
          <Tab icon={<Category />} iconPosition="start" label="Loan Types" />
        </Tabs>
        <CardContent>
          {tab === 0 && <LoansTab />}
          {tab === 1 && <RecoveriesTab />}
          {tab === 2 && <LoanTypesTab />}
        </CardContent>
      </Card>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER: employees + loan types
// ═══════════════════════════════════════════════════════════

function useEmployees() {
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  useEffect(() => { api.get<ApiResponse<EmpOption[]>>('/employees/lookup').then(r => setEmployees(r.data.data || [])).catch(() => {}); }, []);
  return employees;
}

function useLoanTypes() {
  const [types, setTypes] = useState<LoanType[]>([]);
  useEffect(() => { api.get<ApiResponse<LoanType[]>>('/loans/types').then(r => setTypes(r.data.data || [])).catch(() => {}); }, []);
  return types;
}

// ═══════════════════════════════════════════════════════════
// TAB 0: LOANS
// ═══════════════════════════════════════════════════════════

function LoansTab() {
  const { enqueueSnackbar } = useSnackbar();
  const employees = useEmployees();
  const loanTypes = useLoanTypes();
  const [rows, setRows] = useState<LoanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoanRow | null>(null);
  const defaultForm = { employeeId: 0, loanTypeId: 0, loanNo: '', loanDate: dayjs() as Dayjs | null, loanAmount: 0, totalRepayable: 0, installmentCount: 12, installmentAmount: 0, recoveryStartMonth: dayjs().add(1, 'month').startOf('month') as Dayjs | null, guarantorId: null as number | null, remarks: '' };
  const [form, setForm] = useState(defaultForm);

  // Recovery dialog
  const [recovOpen, setRecovOpen] = useState(false);
  const [recovLoan, setRecovLoan] = useState<LoanRow | null>(null);
  const [recovForm, setRecovForm] = useState({ installmentNo: 1, amount: 0, recoveryDate: dayjs() as Dayjs | null, source: 'Manual', remarks: '' });

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<LoanRow[]>>('/loans', { params: { page: page + 1, pageSize, search: search || undefined, status: statusFilter || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: LoanRow) => {
    if (row) {
      setEditing(row);
      setForm({ employeeId: row.employeeId, loanTypeId: row.loanTypeId, loanNo: row.loanNo, loanDate: dayjs(row.loanDate), loanAmount: row.loanAmount, totalRepayable: row.totalRepayable, installmentCount: row.installmentCount, installmentAmount: row.installmentAmount, recoveryStartMonth: dayjs(row.recoveryStartMonth), guarantorId: null, remarks: row.remarks || '' });
    } else {
      setEditing(null);
      setForm(defaultForm);
    }
    setOpen(true);
  };

  // Auto-calculate installment amount when loan amount or count changes
  const updateAmount = (loanAmount: number, count: number) => {
    const installmentAmount = count > 0 ? Math.round((loanAmount / count) * 100) / 100 : 0;
    setForm(p => ({ ...p, loanAmount, totalRepayable: loanAmount, installmentCount: count, installmentAmount }));
  };

  const handleSave = async () => {
    try {
      const body = { ...form, loanDate: form.loanDate?.format('YYYY-MM-DD'), recoveryStartMonth: form.recoveryStartMonth?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/loans/${editing.id}`, body);
      else await api.post('/loans', body);
      enqueueSnackbar(editing ? 'Loan updated' : 'Loan application created', { variant: 'success' });
      setOpen(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'approve') await api.put(`/loans/${id}/approve`, { approvedById: 1 });
      else if (action === 'reject') await api.put(`/loans/${id}/reject`);
      else if (action === 'close') await api.put(`/loans/${id}/close`);
      enqueueSnackbar(`Loan ${action}d`, { variant: 'success' });
      load();
    } catch { enqueueSnackbar(`Action failed`, { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this loan?')) return;
    try { await api.delete(`/loans/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const openRecovery = (row: LoanRow) => {
    setRecovLoan(row);
    setRecovForm({ installmentNo: 1, amount: row.installmentAmount, recoveryDate: dayjs(), source: 'Manual', remarks: '' });
    setRecovOpen(true);
  };

  const handleRecoverySave = async () => {
    if (!recovLoan) return;
    try {
      const body = { ...recovForm, recoveryDate: recovForm.recoveryDate?.format('YYYY-MM-DD') };
      await api.post(`/loans/${recovLoan.id}/recoveries`, body);
      enqueueSnackbar('Recovery recorded', { variant: 'success' });
      setRecovOpen(false); load();
    } catch { enqueueSnackbar('Recovery failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 75 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 130 },
    { field: 'loanTypeName', headerName: 'Type', width: 110 },
    { field: 'loanNo', headerName: 'Loan No', width: 100 },
    { field: 'loanDate', headerName: 'Date', width: 95, renderCell: (p) => fmtDate(p.value) },
    { field: 'loanAmount', headerName: 'Amount', width: 100, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'installmentAmount', headerName: 'EMI', width: 85, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'installmentCount', headerName: 'Inst.', width: 55, align: 'center' },
    { field: 'recoveredAmount', headerName: 'Recovered', width: 100, align: 'right', renderCell: (p) => <Typography variant="body2" color="success.main">{fmtNum(p.value)}</Typography> },
    { field: 'balanceAmount', headerName: 'Balance', width: 100, align: 'right', renderCell: (p) => <Typography variant="body2" color={p.value > 0 ? 'error.main' : 'success.main'} fontWeight={600}>{fmtNum(p.value)}</Typography> },
    { field: 'status', headerName: 'Status', width: 95, renderCell: (p) => statusChip(p.value) },
    { field: 'actions', headerName: '', width: 170, sortable: false, renderCell: (p) => {
      const r = p.row as LoanRow;
      return (
        <>
          {r.status === 'Active' && <Tooltip title="Add Recovery"><IconButton size="small" color="success" onClick={() => openRecovery(r)}><Receipt fontSize="small" /></IconButton></Tooltip>}
          {r.status === 'Pending' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleAction(r.id, 'approve')}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
          {r.status === 'Pending' && <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleAction(r.id, 'reject')}><Block fontSize="small" /></IconButton></Tooltip>}
          {r.status === 'Active' && <Tooltip title="Close Loan"><IconButton size="small" onClick={() => handleAction(r.id, 'close')}><Close fontSize="small" /></IconButton></Tooltip>}
          {r.status === 'Pending' && <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>}
          {r.status !== 'Active' && <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>}
        </>
      );
    }},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search employee/loan..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 250 }} />
        <TextField select size="small" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ width: 130 }} label="Status">
          <MenuItem value="">All</MenuItem>
          {['Pending','Active','Closed','Rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>New Loan</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      {/* Create/Edit Loan Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Loan' : 'New Loan Application'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Loan Type" size="small" fullWidth value={form.loanTypeId || ''} onChange={e => setForm(p => ({ ...p, loanTypeId: Number(e.target.value) }))}>
              <MenuItem value="">Select...</MenuItem>
              {loanTypes.filter(t => t.isActive).map(t => <MenuItem key={t.id} value={t.id}>{t.nameEn}{t.maxAmount ? ` (max: ${fmtNum(t.maxAmount)})` : ''}</MenuItem>)}
            </TextField>
            <TextField label="Loan No" size="small" fullWidth value={form.loanNo} onChange={e => setForm(p => ({ ...p, loanNo: e.target.value }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Loan Date" value={form.loanDate} onAccept={d => setForm(p => ({ ...p, loanDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, loanDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Recovery Start" value={form.recoveryStartMonth} onAccept={d => setForm(p => ({ ...p, recoveryStartMonth: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, recoveryStartMonth: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Loan Amount" size="small" type="number" fullWidth value={form.loanAmount || ''} onChange={e => updateAmount(Number(e.target.value), form.installmentCount)} />
            <TextField label="Installments" size="small" type="number" fullWidth value={form.installmentCount || ''} onChange={e => updateAmount(form.loanAmount, Number(e.target.value))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="EMI Amount" size="small" type="number" fullWidth value={form.installmentAmount} InputProps={{ readOnly: true }} />
            <TextField label="Total Repayable" size="small" type="number" fullWidth value={form.totalRepayable} InputProps={{ readOnly: true }} />
          </Box>
          <TextField select label="Guarantor (optional)" size="small" value={form.guarantorId || ''} onChange={e => setForm(p => ({ ...p, guarantorId: e.target.value ? Number(e.target.value) : null }))}>
            <MenuItem value="">None</MenuItem>
            {employees.filter(e => e.id !== form.employeeId).map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.loanTypeId || !form.loanNo || form.loanAmount <= 0}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Recovery Dialog */}
      <Dialog open={recovOpen} onClose={() => setRecovOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Recovery — {recovLoan?.loanNo}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Employee: {recovLoan?.employeeName} | Balance: {fmtNum(recovLoan?.balanceAmount || 0)}
          </Typography>
          <TextField label="Installment No" size="small" type="number" value={recovForm.installmentNo} onChange={e => setRecovForm(p => ({ ...p, installmentNo: Number(e.target.value) }))} />
          <TextField label="Amount" size="small" type="number" value={recovForm.amount} onChange={e => setRecovForm(p => ({ ...p, amount: Number(e.target.value) }))} />
          <DatePicker label="Recovery Date" value={recovForm.recoveryDate} onAccept={d => setRecovForm(p => ({ ...p, recoveryDate: d }))} onChange={d => { if (d && d.isValid()) setRecovForm(p => ({ ...p, recoveryDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <TextField select label="Source" size="small" value={recovForm.source} onChange={e => setRecovForm(p => ({ ...p, source: e.target.value }))}>
            {['Manual','Payroll','Settlement'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Remarks" size="small" value={recovForm.remarks} onChange={e => setRecovForm(p => ({ ...p, remarks: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecovOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRecoverySave} disabled={recovForm.amount <= 0}>Record</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: RECOVERIES
// ═══════════════════════════════════════════════════════════

function RecoveriesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<RecoveryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<RecoveryRow[]>>('/loans/all-recoveries', { params: { page: page + 1, pageSize } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this recovery? Loan balance will be restored.')) return;
    try { await api.delete(`/loans/recoveries/${id}`); enqueueSnackbar('Recovery deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'loanNo', headerName: 'Loan No', width: 100 },
    { field: 'installmentNo', headerName: 'Inst #', width: 65, align: 'center' },
    { field: 'recoveryDate', headerName: 'Date', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'amount', headerName: 'Amount', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'source', headerName: 'Source', width: 90 },
    { field: 'remarks', headerName: 'Remarks', flex: 1, minWidth: 120, renderCell: (p) => p.value || '—' },
    { field: 'actions', headerName: '', width: 60, sortable: false, renderCell: (p) => (
      <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
    )},
  ];

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>All loan recovery transactions across all employees.</Typography>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: LOAN TYPES
// ═══════════════════════════════════════════════════════════

function LoanTypesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<LoanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoanType | null>(null);
  const defaultForm = { typeCode: '', nameEn: '', nameAr: '', maxAmount: null as number | null, maxInstallments: null as number | null, maxMultiplier: null as number | null, requiresGuarantor: false, minServiceMonths: 0, isActive: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<LoanType[]>>('/loans/types').then(r => setRows(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: LoanType) => {
    if (row) { setEditing(row); setForm({ typeCode: row.typeCode, nameEn: row.nameEn, nameAr: row.nameAr || '', maxAmount: row.maxAmount || null, maxInstallments: row.maxInstallments || null, maxMultiplier: row.maxMultiplier || null, requiresGuarantor: row.requiresGuarantor, minServiceMonths: row.minServiceMonths, isActive: row.isActive }); }
    else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await api.put(`/loans/types/${editing.id}`, form);
      else await api.post('/loans/types', form);
      enqueueSnackbar(editing ? 'Updated' : 'Created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this loan type?')) return;
    try { await api.delete(`/loans/types/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'typeCode', headerName: 'Code', width: 100 },
    { field: 'nameEn', headerName: 'Name (EN)', flex: 1, minWidth: 150 },
    { field: 'nameAr', headerName: 'Name (AR)', flex: 1, minWidth: 120, renderCell: (p) => p.value || '—' },
    { field: 'maxAmount', headerName: 'Max Amount', width: 120, align: 'right', renderCell: (p) => p.value ? fmtNum(p.value) : 'No limit' },
    { field: 'maxInstallments', headerName: 'Max Inst.', width: 90, align: 'center', renderCell: (p) => p.value || '—' },
    { field: 'requiresGuarantor', headerName: 'Guarantor', width: 90, renderCell: (p) => p.value ? <CheckCircle fontSize="small" color="warning" /> : <Cancel fontSize="small" color="disabled" /> },
    { field: 'minServiceMonths', headerName: 'Min Service', width: 100, renderCell: (p) => p.value ? `${p.value} months` : '—' },
    { field: 'isActive', headerName: 'Active', width: 70, renderCell: (p) => p.value ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" /> },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Loan Type</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        pageSizeOptions={[25,50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Loan Type' : 'New Loan Type'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Type Code" size="small" fullWidth value={form.typeCode} onChange={e => setForm(p => ({ ...p, typeCode: e.target.value }))} />
            <TextField label="Name (EN)" size="small" fullWidth value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} />
          </Box>
          <TextField label="Name (AR)" size="small" value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Max Amount" size="small" type="number" fullWidth value={form.maxAmount || ''} onChange={e => setForm(p => ({ ...p, maxAmount: e.target.value ? Number(e.target.value) : null }))} />
            <TextField label="Max Installments" size="small" type="number" fullWidth value={form.maxInstallments || ''} onChange={e => setForm(p => ({ ...p, maxInstallments: e.target.value ? Number(e.target.value) : null }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Max Multiplier (xSalary)" size="small" type="number" fullWidth value={form.maxMultiplier || ''} onChange={e => setForm(p => ({ ...p, maxMultiplier: e.target.value ? Number(e.target.value) : null }))} />
            <TextField label="Min Service (months)" size="small" type="number" fullWidth value={form.minServiceMonths} onChange={e => setForm(p => ({ ...p, minServiceMonths: Number(e.target.value) }))} />
          </Box>
          <FormControlLabel control={<Checkbox checked={form.requiresGuarantor} onChange={e => setForm(p => ({ ...p, requiresGuarantor: e.target.checked }))} />} label="Requires Guarantor" />
          <FormControlLabel control={<Checkbox checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.typeCode || !form.nameEn}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
