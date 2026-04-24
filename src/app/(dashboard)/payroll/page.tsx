'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, TextField, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, MenuItem, Skeleton,
  FormControlLabel, Checkbox, Tooltip, LinearProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search, Add, Edit, Delete, Payments, Category, AccountBalanceWallet,
  RequestQuote, PlayArrow, CheckCircle, Cancel, Block, PriceCheck,
  Visibility,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface SalaryHead { id: number; headCode: string; nameEn: string; nameAr?: string; headType: number; headTypeName: string; calculationType: string; defaultPercentage?: number; defaultAmount?: number; isProRata: boolean; affectsEOS: boolean; affectsLeave: boolean; affectsOvertime: boolean; affectsGOSI: boolean; isTaxable: boolean; sortOrder: number; isSystem: boolean; isFixed: boolean; isActive: boolean; }
interface PayrollSummary { totalPayrollRuns: number; draftRuns: number; processedRuns: number; paidRuns: number; totalNetPaid: number; activeSalaryHeads: number; pendingAdvances: number; }
interface PayrollRun { id: number; payrollNo: string; payrollMonth: string; periodFrom: string; periodTo: string; totalEarnings: number; totalDeductions: number; totalNetPay: number; totalEmployees: number; status: string; processedDate?: string; approvedDate?: string; paidDate?: string; paymentMode?: string; remarks?: string; }
interface PayrollDetailRow { id: number; payrollHeaderId: number; employeeId: number; employeeCode: string; employeeName: string; departmentName?: string; basicSalary: number; totalAllowances: number; totalDays: number; workedDays: number; absentDays: number; leaveDays: number; otAmountNormal: number; otAmountHoliday: number; grossEarnings: number; totalDeductions: number; advanceDeduction: number; loanDeduction: number; netPayable: number; isHeld: boolean; holdReason?: string; }
interface SalaryStructureRow { id: number; employeeId: number; employeeCode: string; employeeName: string; salaryHeadId: number; salaryHeadName: string; headType: number; amount: number; percentage?: number; effectiveFrom: string; effectiveTo?: string; isActive: boolean; }
interface AdvanceRow { id: number; employeeId: number; employeeCode: string; employeeName: string; advanceDate: string; amount: number; reason?: string; recoveryMonth: string; recoveryInstallments: number; recoveryPerInstallment: number; recoveredAmount: number; balanceAmount: number; status: string; remarks?: string; }
interface EmpOption { id: number; empCode: string; nameEn: string; }

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }
function fmtMonth(d: string) { return dayjs(d).format('MMM YYYY'); }
function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function statusChip(status: string) {
  const map: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = { Draft: 'default', Processed: 'info', Approved: 'warning', Paid: 'success', Pending: 'warning', Rejected: 'error', Recovered: 'success' };
  return <Chip label={status} size="small" color={map[status] || 'default'} />;
}

function StatCard({ title, value, color }: { title: string; value: number | string; color: string }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ color }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function PayrollPage() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse<PayrollSummary>>('/payroll/summary')
      .then(r => setSummary(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [tab]);

  if (loading) return <Box sx={{ p: 3 }}>{[1,2,3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}</Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Payroll Management</Typography>
      {summary && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <StatCard title="Payroll Runs" value={summary.totalPayrollRuns} color="#1565C0" />
          <StatCard title="Draft" value={summary.draftRuns} color="#757575" />
          <StatCard title="Processed" value={summary.processedRuns} color="#0288D1" />
          <StatCard title="Paid" value={summary.paidRuns} color="#2E6B4A" />
          <StatCard title="Salary Heads" value={summary.activeSalaryHeads} color="#6A1B9A" />
        </Box>
      )}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab icon={<Payments />} iconPosition="start" label="Payroll Runs" />
          <Tab icon={<Category />} iconPosition="start" label="Salary Heads" />
          <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Salary Structure" />
          <Tab icon={<RequestQuote />} iconPosition="start" label="Advances" />
        </Tabs>
        <CardContent>
          {tab === 0 && <PayrollRunsTab />}
          {tab === 1 && <SalaryHeadsTab />}
          {tab === 2 && <SalaryStructureTab />}
          {tab === 3 && <AdvancesTab />}
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
// TAB 0: PAYROLL RUNS
// ═══════════════════════════════════════════════════════════

function PayrollRunsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const [rows, setRows] = useState<PayrollRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRows, setDetailRows] = useState<PayrollDetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const defaultForm = { payrollNo: '', payrollMonth: dayjs().startOf('month') as Dayjs | null, periodFrom: dayjs().startOf('month') as Dayjs | null, periodTo: dayjs().endOf('month') as Dayjs | null, paymentMode: 'Bank Transfer', remarks: '' };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<PayrollRun[]>>('/payroll', { params: { page: page + 1, pageSize, status: statusFilter || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      const body = { ...form, payrollMonth: form.payrollMonth?.format('YYYY-MM-DD'), periodFrom: form.periodFrom?.format('YYYY-MM-DD'), periodTo: form.periodTo?.format('YYYY-MM-DD') };
      await api.post('/payroll', body);
      enqueueSnackbar('Payroll draft created', { variant: 'success' });
      setOpen(false); setForm(defaultForm); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      await api.put(`/payroll/${id}/${action}`);
      enqueueSnackbar(`Payroll ${action === 'pay' ? 'paid' : action + 'd'}`, { variant: 'success' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payroll run?')) return;
    try { await api.delete(`/payroll/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const viewDetails = async (run: PayrollRun) => {
    setSelectedRun(run);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const r = await api.get<ApiResponse<PayrollDetailRow[]>>(`/payroll/${run.id}/details?page=1&pageSize=200`);
      setDetailRows(r.data.data || []);
    } catch { enqueueSnackbar('Failed to load details', { variant: 'error' }); }
    finally { setDetailLoading(false); }
  };

  const columns: GridColDef[] = [
    { field: 'payrollNo', headerName: 'Payroll No', width: 120 },
    { field: 'payrollMonth', headerName: 'Month', width: 100, renderCell: (p) => fmtMonth(p.value) },
    { field: 'periodFrom', headerName: 'From', width: 95, renderCell: (p) => fmtDate(p.value) },
    { field: 'periodTo', headerName: 'To', width: 95, renderCell: (p) => fmtDate(p.value) },
    { field: 'totalEmployees', headerName: 'Emp.', width: 60, align: 'center' },
    { field: 'totalEarnings', headerName: 'Earnings', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalDeductions', headerName: 'Deductions', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalNetPay', headerName: 'Net Pay', width: 120, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={700} color="success.main">{fmtNum(p.value)}</Typography> },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => statusChip(p.value) },
    { field: 'actions', headerName: '', width: 180, sortable: false, renderCell: (p) => {
      const r = p.row as PayrollRun;
      return (
        <>
          {r.totalEmployees > 0 && <Tooltip title="View Details"><IconButton size="small" onClick={() => viewDetails(r)}><Visibility fontSize="small" /></IconButton></Tooltip>}
          {can('Payroll:Edit') && r.status === 'Draft' && <Tooltip title="Process"><IconButton size="small" color="primary" onClick={() => handleAction(r.id, 'process')}><PlayArrow fontSize="small" /></IconButton></Tooltip>}
          {can('Payroll:Edit') && r.status === 'Processed' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleAction(r.id, 'approve')}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
          {can('Payroll:Edit') && r.status === 'Approved' && <Tooltip title="Mark as Paid"><IconButton size="small" color="info" onClick={() => handleAction(r.id, 'pay')}><PriceCheck fontSize="small" /></IconButton></Tooltip>}
          {can('Payroll:Delete') && r.status !== 'Paid' && <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>}
        </>
      );
    }},
  ];

  const detailColumns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 140 },
    { field: 'departmentName', headerName: 'Dept', width: 100, renderCell: (p) => p.value || '—' },
    { field: 'basicSalary', headerName: 'Basic', width: 90, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalAllowances', headerName: 'Allowances', width: 100, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'workedDays', headerName: 'Days', width: 55, align: 'center' },
    { field: 'grossEarnings', headerName: 'Gross', width: 100, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalDeductions', headerName: 'Deductions', width: 100, align: 'right', renderCell: (p) => <Typography variant="body2" color="error.main">{fmtNum(p.value)}</Typography> },
    { field: 'netPayable', headerName: 'Net Pay', width: 110, align: 'right', renderCell: (p) => <Typography variant="body2" fontWeight={700} color="success.main">{fmtNum(p.value)}</Typography> },
    { field: 'isHeld', headerName: 'Held', width: 60, renderCell: (p) => p.value ? <Chip label="Held" size="small" color="warning" /> : null },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField select size="small" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ width: 130 }} label="Status">
          <MenuItem value="">All</MenuItem>
          {['Draft','Processed','Approved','Paid'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        {can('Payroll:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpen(true)}>New Payroll</Button>}
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Payroll Run</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Payroll No" size="small" value={form.payrollNo} onChange={e => setForm(p => ({ ...p, payrollNo: e.target.value }))} placeholder="e.g. PAY-2025-07" />
          <DatePicker label="Payroll Month" value={form.payrollMonth} views={['month', 'year']} onAccept={d => setForm(p => ({ ...p, payrollMonth: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, payrollMonth: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Period From" value={form.periodFrom} onAccept={d => setForm(p => ({ ...p, periodFrom: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, periodFrom: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Period To" value={form.periodTo} onAccept={d => setForm(p => ({ ...p, periodTo: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, periodTo: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <TextField select label="Payment Mode" size="small" value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))}>
            {['Bank Transfer','Cash','Cheque','WPS'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.payrollNo || !form.payrollMonth}>Create Draft</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Payroll Details — {selectedRun?.payrollNo} ({selectedRun ? fmtMonth(selectedRun.payrollMonth) : ''})</DialogTitle>
        <DialogContent>
          {detailLoading ? <LinearProgress /> : (
            <DataGrid rows={detailRows} columns={detailColumns} autoHeight density="compact"
              pageSizeOptions={[50,100]} initialState={{ pagination: { paginationModel: { pageSize: 50 } } }} />
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1: SALARY HEADS
// ═══════════════════════════════════════════════════════════

function SalaryHeadsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const [rows, setRows] = useState<SalaryHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryHead | null>(null);
  const defaultForm = { headCode: '', nameEn: '', nameAr: '', headType: 1 as number, calculationType: 'Fixed', defaultPercentage: null as number | null, defaultAmount: null as number | null, isProRata: true, affectsEOS: false, affectsLeave: false, affectsOvertime: false, affectsGOSI: false, isTaxable: false, sortOrder: 0, isFixed: false, isActive: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<SalaryHead[]>>('/payroll/salary-heads').then(r => setRows(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: SalaryHead) => {
    if (row) { setEditing(row); setForm({ headCode: row.headCode, nameEn: row.nameEn, nameAr: row.nameAr || '', headType: row.headType, calculationType: row.calculationType, defaultPercentage: row.defaultPercentage || null, defaultAmount: row.defaultAmount || null, isProRata: row.isProRata, affectsEOS: row.affectsEOS, affectsLeave: row.affectsLeave, affectsOvertime: row.affectsOvertime, affectsGOSI: row.affectsGOSI, isTaxable: row.isTaxable, sortOrder: row.sortOrder, isFixed: row.isFixed, isActive: row.isActive }); }
    else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await api.put(`/payroll/salary-heads/${editing.id}`, form);
      else await api.post('/payroll/salary-heads', form);
      enqueueSnackbar(editing ? 'Updated' : 'Created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this salary head?')) return;
    try { await api.delete(`/payroll/salary-heads/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const boolIcon = (v: boolean) => v ? <CheckCircle fontSize="small" color="primary" /> : <Cancel fontSize="small" color="disabled" />;

  const columns: GridColDef[] = [
    { field: 'headCode', headerName: 'Code', width: 80 },
    { field: 'nameEn', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'headType', headerName: 'Type', width: 90, renderCell: (p) => p.value === 1 ? <Chip label="Earning" size="small" color="success" /> : <Chip label="Deduction" size="small" color="error" /> },
    { field: 'calculationType', headerName: 'Calc.', width: 85 },
    { field: 'defaultAmount', headerName: 'Default Amt', width: 100, align: 'right', renderCell: (p) => p.value ? fmtNum(p.value) : '—' },
    { field: 'affectsEOS', headerName: 'EOS', width: 50, renderCell: (p) => boolIcon(p.value) },
    { field: 'affectsGOSI', headerName: 'GOSI', width: 50, renderCell: (p) => boolIcon(p.value) },
    { field: 'isProRata', headerName: 'ProRata', width: 65, renderCell: (p) => boolIcon(p.value) },
    { field: 'isSystem', headerName: 'Sys', width: 50, renderCell: (p) => p.value ? <Chip label="SYS" size="small" variant="outlined" /> : null },
    { field: 'sortOrder', headerName: 'Order', width: 55, align: 'center' },
    { field: 'isActive', headerName: 'Active', width: 65, renderCell: (p) => p.value ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" /> },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => p.row.isSystem ? null : (
      <>
        {can('Payroll:Edit') && <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>}
        {can('Payroll:Delete') && <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>}
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {can('Payroll:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Salary Head</Button>}
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        pageSizeOptions={[25,50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Salary Head' : 'New Salary Head'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Head Code" size="small" fullWidth value={form.headCode} onChange={e => setForm(p => ({ ...p, headCode: e.target.value }))} />
            <TextField select label="Type" size="small" fullWidth value={form.headType} onChange={e => setForm(p => ({ ...p, headType: Number(e.target.value) }))}>
              <MenuItem value={1}>Earning</MenuItem>
              <MenuItem value={2}>Deduction</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Name (EN)" size="small" fullWidth value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} />
            <TextField label="Name (AR)" size="small" fullWidth value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Calculation" size="small" fullWidth value={form.calculationType} onChange={e => setForm(p => ({ ...p, calculationType: e.target.value }))}>
              {['Fixed','Percentage','Formula'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField label="Sort Order" size="small" type="number" fullWidth value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Default Amount" size="small" type="number" fullWidth value={form.defaultAmount || ''} onChange={e => setForm(p => ({ ...p, defaultAmount: e.target.value ? Number(e.target.value) : null }))} />
            <TextField label="Default %" size="small" type="number" fullWidth value={form.defaultPercentage || ''} onChange={e => setForm(p => ({ ...p, defaultPercentage: e.target.value ? Number(e.target.value) : null }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControlLabel control={<Checkbox checked={form.isProRata} onChange={e => setForm(p => ({ ...p, isProRata: e.target.checked }))} size="small" />} label="Pro-Rata" />
            <FormControlLabel control={<Checkbox checked={form.affectsEOS} onChange={e => setForm(p => ({ ...p, affectsEOS: e.target.checked }))} size="small" />} label="Affects EOS" />
            <FormControlLabel control={<Checkbox checked={form.affectsLeave} onChange={e => setForm(p => ({ ...p, affectsLeave: e.target.checked }))} size="small" />} label="Affects Leave" />
            <FormControlLabel control={<Checkbox checked={form.affectsOvertime} onChange={e => setForm(p => ({ ...p, affectsOvertime: e.target.checked }))} size="small" />} label="Affects OT" />
            <FormControlLabel control={<Checkbox checked={form.affectsGOSI} onChange={e => setForm(p => ({ ...p, affectsGOSI: e.target.checked }))} size="small" />} label="Affects GOSI" />
            <FormControlLabel control={<Checkbox checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} size="small" />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.headCode || !form.nameEn}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: SALARY STRUCTURE
// ═══════════════════════════════════════════════════════════

function SalaryStructureTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const employees = useEmployees();
  const [salaryHeads, setSalaryHeads] = useState<SalaryHead[]>([]);
  const [rows, setRows] = useState<SalaryStructureRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [empFilter, setEmpFilter] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryStructureRow | null>(null);
  const defaultForm = { employeeId: 0, salaryHeadId: 0, amount: 0, percentage: null as number | null, effectiveFrom: dayjs() as Dayjs | null, effectiveTo: null as Dayjs | null, isActive: true };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => { api.get<ApiResponse<SalaryHead[]>>('/payroll/salary-heads').then(r => setSalaryHeads(r.data.data || [])).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<SalaryStructureRow[]>>('/payroll/salary-structure', { params: { page: page + 1, pageSize, employeeId: empFilter || undefined, search: search || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, empFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: SalaryStructureRow) => {
    if (row) { setEditing(row); setForm({ employeeId: row.employeeId, salaryHeadId: row.salaryHeadId, amount: row.amount, percentage: row.percentage || null, effectiveFrom: dayjs(row.effectiveFrom), effectiveTo: row.effectiveTo ? dayjs(row.effectiveTo) : null, isActive: row.isActive }); }
    else { setEditing(null); setForm({ ...defaultForm, employeeId: typeof empFilter === 'number' ? empFilter : 0 }); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = { ...form, effectiveFrom: form.effectiveFrom?.format('YYYY-MM-DD'), effectiveTo: form.effectiveTo?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/payroll/salary-structure/${editing.id}`, body);
      else await api.post('/payroll/salary-structure', body);
      enqueueSnackbar(editing ? 'Updated' : 'Created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    try { await api.delete(`/payroll/salary-structure/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 140 },
    { field: 'salaryHeadName', headerName: 'Salary Head', width: 160 },
    { field: 'headType', headerName: 'Type', width: 90, renderCell: (p) => p.value === 1 ? <Chip label="Earn" size="small" color="success" variant="outlined" /> : <Chip label="Ded" size="small" color="error" variant="outlined" /> },
    { field: 'amount', headerName: 'Amount', width: 110, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'effectiveFrom', headerName: 'From', width: 95, renderCell: (p) => fmtDate(p.value) },
    { field: 'effectiveTo', headerName: 'To', width: 95, renderCell: (p) => fmtDate(p.value) },
    { field: 'isActive', headerName: 'Active', width: 65, renderCell: (p) => p.value ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" /> },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        {can('Payroll:Edit') && <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>}
        {can('Payroll:Delete') && <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>}
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search employee..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 250 }} />
        <TextField select size="small" value={empFilter} onChange={e => { setEmpFilter(e.target.value ? Number(e.target.value) : ''); setPage(0); }} sx={{ width: 200 }} label="Employee">
          <MenuItem value="">All Employees</MenuItem>
          {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        {can('Payroll:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Entry</Button>}
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[50,100]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Salary Entry' : 'New Salary Entry'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <TextField select label="Salary Head" size="small" value={form.salaryHeadId || ''} onChange={e => setForm(p => ({ ...p, salaryHeadId: Number(e.target.value) }))}>
            <MenuItem value="">Select...</MenuItem>
            {salaryHeads.filter(h => h.isActive).map(h => <MenuItem key={h.id} value={h.id}>{h.headCode} - {h.nameEn} ({h.headTypeName})</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Amount" size="small" type="number" fullWidth value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} />
            <TextField label="Percentage" size="small" type="number" fullWidth value={form.percentage || ''} onChange={e => setForm(p => ({ ...p, percentage: e.target.value ? Number(e.target.value) : null }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Effective From" value={form.effectiveFrom} onAccept={d => setForm(p => ({ ...p, effectiveFrom: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, effectiveFrom: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Effective To" value={form.effectiveTo} onAccept={d => setForm(p => ({ ...p, effectiveTo: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, effectiveTo: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <FormControlLabel control={<Checkbox checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.salaryHeadId || form.amount <= 0}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 3: SALARY ADVANCES
// ═══════════════════════════════════════════════════════════

function AdvancesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermissions();
  const employees = useEmployees();
  const [rows, setRows] = useState<AdvanceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const defaultForm = { employeeId: 0, advanceDate: dayjs() as Dayjs | null, amount: 0, reason: '', recoveryMonth: dayjs().add(1, 'month').startOf('month') as Dayjs | null, recoveryInstallments: 1, remarks: '' };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<AdvanceRow[]>>('/payroll/advances', { params: { page: page + 1, pageSize, search: search || undefined, status: statusFilter || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      const body = { ...form, advanceDate: form.advanceDate?.format('YYYY-MM-DD'), recoveryMonth: form.recoveryMonth?.format('YYYY-MM-DD') };
      await api.post('/payroll/advances', body);
      enqueueSnackbar('Advance created', { variant: 'success' });
      setOpen(false); setForm(defaultForm); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      await api.put(`/payroll/advances/${id}/${action}`);
      enqueueSnackbar(`Advance ${action}d`, { variant: 'success' }); load();
    } catch { enqueueSnackbar('Action failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this advance?')) return;
    try { await api.delete(`/payroll/advances/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 140 },
    { field: 'advanceDate', headerName: 'Date', width: 95, renderCell: (p) => fmtDate(p.value) },
    { field: 'amount', headerName: 'Amount', width: 100, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'recoveryInstallments', headerName: 'Inst.', width: 55, align: 'center' },
    { field: 'recoveryPerInstallment', headerName: 'Per Inst.', width: 90, align: 'right', renderCell: (p) => fmtNum(p.value) },
    { field: 'recoveredAmount', headerName: 'Recovered', width: 100, align: 'right', renderCell: (p) => <Typography variant="body2" color="success.main">{fmtNum(p.value)}</Typography> },
    { field: 'balanceAmount', headerName: 'Balance', width: 100, align: 'right', renderCell: (p) => <Typography variant="body2" color={p.value > 0 ? 'error.main' : 'success.main'} fontWeight={600}>{fmtNum(p.value)}</Typography> },
    { field: 'status', headerName: 'Status', width: 95, renderCell: (p) => statusChip(p.value) },
    { field: 'actions', headerName: '', width: 130, sortable: false, renderCell: (p) => {
      const r = p.row as AdvanceRow;
      return (
        <>
          {can('Payroll:Edit') && r.status === 'Pending' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleAction(r.id, 'approve')}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
          {can('Payroll:Edit') && r.status === 'Pending' && <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleAction(r.id, 'reject')}><Block fontSize="small" /></IconButton></Tooltip>}
          {can('Payroll:Delete') && <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>}
        </>
      );
    }},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search employee..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 250 }} />
        <TextField select size="small" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ width: 130 }} label="Status">
          <MenuItem value="">All</MenuItem>
          {['Pending','Approved','Rejected','Recovered'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        {can('Payroll:Create') && <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpen(true)}>New Advance</Button>}
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Salary Advance</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Amount" size="small" type="number" fullWidth value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} />
            <TextField label="Installments" size="small" type="number" fullWidth value={form.recoveryInstallments} onChange={e => setForm(p => ({ ...p, recoveryInstallments: Number(e.target.value) }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Advance Date" value={form.advanceDate} onAccept={d => setForm(p => ({ ...p, advanceDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, advanceDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Recovery Start Month" value={form.recoveryMonth} onAccept={d => setForm(p => ({ ...p, recoveryMonth: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, recoveryMonth: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <TextField label="Reason" size="small" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || form.amount <= 0}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
