'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Tooltip, InputAdornment, CircularProgress, Tab, Tabs,
  Rating,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add, Edit, Delete, Search, Refresh, ThumbUp,
  Description, SwapHoriz, TrendingUp, Warning as WarningIcon, PersonOff,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import api, { type ApiResponse } from '@/lib/api';

// ── Types ──
interface ContractRow {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  contractNo: string; contractType: string; startDate: string; endDate: string | null;
  probationEndDate: string | null; basicSalary: number; totalSalary: number;
  workingHoursPerDay: number; workingDaysPerWeek: number; noticePeriodDays: number;
  annualLeaveDays: number; isRenewal: boolean; status: string;
}
interface PromotionRow {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  promotionDate: string; effectiveDate: string; fromDesignation: string | null;
  toDesignation: string; fromGrade: string | null; toGrade: string | null;
  oldBasicSalary: number | null; newBasicSalary: number; oldTotalSalary: number | null;
  newTotalSalary: number; incrementPercent: number | null; reason: string | null; status: string;
}
interface TransferRow {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  transferDate: string; effectiveDate: string; fromBranch: string | null; fromDepartment: string | null;
  fromDesignation: string | null; toBranch: string | null; toDepartment: string | null;
  toDesignation: string | null; transferType: string; reason: string | null; status: string;
}
interface WarningRow {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  warningDate: string; warningType: string; severity: number; reason: string;
  suspensionDays: number | null; salaryDeduction: number | null;
  issuedByName: string | null; status: string;
}
interface TerminationRow {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  terminationDate: string; lastWorkingDate: string; terminationType: string;
  reason: string; eosAmount: number | null; netSettlement: number | null; status: string;
}

const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  Active: 'success', Expired: 'default', Terminated: 'error', Renewed: 'info', Draft: 'default',
  Pending: 'warning', Approved: 'success', Rejected: 'error', Completed: 'info', Cancelled: 'default',
  Issued: 'warning', Acknowledged: 'info', Appealed: 'error', Revoked: 'default', Settled: 'success',
};

export default function ContractsPage() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Contracts & Actions</Typography>
          <Typography variant="body2" color="text.secondary">Contracts, promotions, transfers, warnings, and terminations</Typography>
        </Box>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<Description />} label="Contracts" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<TrendingUp />} label="Promotions" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<SwapHoriz />} label="Transfers" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<WarningIcon />} label="Warnings" iconPosition="start" sx={{ minHeight: 48 }} />
        <Tab icon={<PersonOff />} label="Terminations" iconPosition="start" sx={{ minHeight: 48 }} />
      </Tabs>
      {tab === 0 && <ContractsTab />}
      {tab === 1 && <PromotionsTab />}
      {tab === 2 && <TransfersTab />}
      {tab === 3 && <WarningsTab />}
      {tab === 4 && <TerminationsTab />}
    </Box>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 1: CONTRACTS
// ════════════════════════════════════════════════════════════
function ContractsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '', contractNo: '', contractType: 'Unlimited',
    startDate: dayjs() as Dayjs | null, endDate: null as Dayjs | null,
    probationEndDate: null as Dayjs | null,
    basicSalary: '', totalSalary: '', workingHoursPerDay: '8', workingDaysPerWeek: '6',
    noticePeriodDays: '30', annualLeaveDays: '21', status: 'Active',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: paginationModel.page + 1, pageSize: paginationModel.pageSize };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.contractType = filterType;
      const res = await api.get<ApiResponse<ContractRow[]>>('/contracts', { params });
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (err: unknown) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to load', { variant: 'error' });
    } finally { setLoading(false); }
  }, [paginationModel, search, filterStatus, filterType, enqueueSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.employeeId || !formData.contractNo || !formData.basicSalary) { setFormError('Employee, Contract No, and Salary are required'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        employeeId: Number(formData.employeeId), contractNo: formData.contractNo,
        contractType: formData.contractType,
        startDate: formData.startDate?.format('YYYY-MM-DD'), endDate: formData.endDate?.format('YYYY-MM-DD') || null,
        probationEndDate: formData.probationEndDate?.format('YYYY-MM-DD') || null,
        basicSalary: Number(formData.basicSalary), totalSalary: Number(formData.totalSalary) || Number(formData.basicSalary),
        workingHoursPerDay: Number(formData.workingHoursPerDay), workingDaysPerWeek: Number(formData.workingDaysPerWeek),
        noticePeriodDays: Number(formData.noticePeriodDays), annualLeaveDays: Number(formData.annualLeaveDays),
        status: formData.status,
      };
      if (editingId) {
        await api.put(`/contracts/${editingId}`, payload);
        enqueueSnackbar('Contract updated', { variant: 'success' });
      } else {
        await api.post('/contracts', payload);
        enqueueSnackbar('Contract created', { variant: 'success' });
      }
      setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this contract?')) return;
    try {
      await api.delete(`/contracts/${id}`);
      enqueueSnackbar('Contract deleted', { variant: 'success' }); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      enqueueSnackbar(axiosErr?.response?.data?.message || 'Failed to delete', { variant: 'error' });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ employeeId: '', contractNo: '', contractType: 'Unlimited', startDate: dayjs(), endDate: null, probationEndDate: null, basicSalary: '', totalSalary: '', workingHoursPerDay: '8', workingDaysPerWeek: '6', noticePeriodDays: '30', annualLeaveDays: '21', status: 'Active' });
    setFormError(''); setDialogOpen(true);
  };

  const openEdit = (row: ContractRow) => {
    setEditingId(row.id);
    setFormData({
      employeeId: String(row.employeeId), contractNo: row.contractNo, contractType: row.contractType,
      startDate: dayjs(row.startDate), endDate: row.endDate ? dayjs(row.endDate) : null,
      probationEndDate: row.probationEndDate ? dayjs(row.probationEndDate) : null,
      basicSalary: String(row.basicSalary), totalSalary: String(row.totalSalary),
      workingHoursPerDay: String(row.workingHoursPerDay), workingDaysPerWeek: String(row.workingDaysPerWeek),
      noticePeriodDays: String(row.noticePeriodDays), annualLeaveDays: String(row.annualLeaveDays),
      status: row.status,
    });
    setFormError(''); setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Emp Code', width: 100 },
    { field: 'employeeName', headerName: 'Employee', width: 150, flex: 1 },
    { field: 'contractNo', headerName: 'Contract #', width: 130 },
    { field: 'contractType', headerName: 'Type', width: 100 },
    { field: 'startDate', headerName: 'Start', width: 100, valueFormatter: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '' },
    { field: 'endDate', headerName: 'End', width: 100, valueFormatter: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY') : 'Unlimited' },
    { field: 'basicSalary', headerName: 'Basic', width: 100, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    { field: 'totalSalary', headerName: 'Total', width: 100, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    { field: 'annualLeaveDays', headerName: 'Leave', width: 70, type: 'number' },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => <Chip label={p.value} size="small" color={statusColors[p.value as string] || 'default'} /> },
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
        <TextField placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">All</MenuItem><MenuItem value="Unlimited">Unlimited</MenuItem><MenuItem value="Limited">Limited</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Expired">Expired</MenuItem><MenuItem value="Terminated">Terminated</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        <Box sx={{ ml: 'auto' }}><Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Contract</Button></Box>
      </Paper>
      <Paper variant="outlined" sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={totalCount} loading={loading}
          paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]} disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Contract' : 'New Contract'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <TextField label="Employee ID" value={formData.employeeId} onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))} size="small" type="number" required disabled={!!editingId} />
              <TextField label="Contract No" value={formData.contractNo} onChange={(e) => setFormData(p => ({ ...p, contractNo: e.target.value }))} size="small" required fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <FormControl size="small" fullWidth><InputLabel>Type</InputLabel>
                <Select value={formData.contractType} label="Type" onChange={(e) => setFormData(p => ({ ...p, contractType: e.target.value }))}>
                  <MenuItem value="Unlimited">Unlimited</MenuItem><MenuItem value="Limited">Limited</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth><InputLabel>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}>
                  <MenuItem value="Draft">Draft</MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <DatePicker label="Start Date" value={formData.startDate} onAccept={(d) => d && setFormData(p => ({ ...p, startDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, startDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              <DatePicker label="End Date" value={formData.endDate} onAccept={(d) => setFormData(p => ({ ...p, endDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, endDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Basic Salary" value={formData.basicSalary} onChange={(e) => setFormData(p => ({ ...p, basicSalary: e.target.value }))} size="small" type="number" required fullWidth />
              <TextField label="Total Salary" value={formData.totalSalary} onChange={(e) => setFormData(p => ({ ...p, totalSalary: e.target.value }))} size="small" type="number" fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Hours/Day" value={formData.workingHoursPerDay} onChange={(e) => setFormData(p => ({ ...p, workingHoursPerDay: e.target.value }))} size="small" type="number" />
              <TextField label="Days/Week" value={formData.workingDaysPerWeek} onChange={(e) => setFormData(p => ({ ...p, workingDaysPerWeek: e.target.value }))} size="small" type="number" />
              <TextField label="Notice (days)" value={formData.noticePeriodDays} onChange={(e) => setFormData(p => ({ ...p, noticePeriodDays: e.target.value }))} size="small" type="number" />
              <TextField label="Leave Days" value={formData.annualLeaveDays} onChange={(e) => setFormData(p => ({ ...p, annualLeaveDays: e.target.value }))} size="small" type="number" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={20} /> : editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2: PROMOTIONS
// ════════════════════════════════════════════════════════════
function PromotionsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<PromotionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', toDesigId: '', newBasicSalary: '', newTotalSalary: '', promotionDate: dayjs() as Dayjs | null, effectiveDate: dayjs() as Dayjs | null, reason: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PromotionRow[]>>('/contracts/promotions', { params: { page: paginationModel.page + 1, pageSize: paginationModel.pageSize, search: search || undefined } });
      setRows(res.data.data || []); setTotalCount(res.data.pagination?.totalCount || 0);
    } catch { /* */ } finally { setLoading(false); }
  }, [paginationModel, search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.employeeId || !formData.toDesigId || !formData.newBasicSalary) { setFormError('Employee, Designation, and Salary are required'); return; }
    setSaving(true); setFormError('');
    try {
      await api.post('/contracts/promotions', {
        employeeId: Number(formData.employeeId), toDesigId: Number(formData.toDesigId),
        newBasicSalary: Number(formData.newBasicSalary), newTotalSalary: Number(formData.newTotalSalary) || Number(formData.newBasicSalary),
        promotionDate: formData.promotionDate?.format('YYYY-MM-DD'), effectiveDate: formData.effectiveDate?.format('YYYY-MM-DD'),
        reason: formData.reason || null,
      });
      enqueueSnackbar('Promotion created', { variant: 'success' }); setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleApprove = async (id: number) => {
    try { await api.put(`/contracts/promotions/${id}/approve`, { approvedById: 1 }); enqueueSnackbar('Promoted', { variant: 'success' }); fetchData(); }
    catch (err: unknown) { enqueueSnackbar(err instanceof Error ? err.message : 'Failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 90 },
    { field: 'employeeName', headerName: 'Employee', width: 150, flex: 1 },
    { field: 'promotionDate', headerName: 'Date', width: 100, valueFormatter: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '' },
    { field: 'fromDesignation', headerName: 'From', width: 130, valueFormatter: (v: string | null) => v || '—' },
    { field: 'toDesignation', headerName: 'To', width: 130 },
    { field: 'oldBasicSalary', headerName: 'Old Salary', width: 100, type: 'number', valueFormatter: (v: number | null) => v?.toLocaleString() || '—' },
    { field: 'newBasicSalary', headerName: 'New Salary', width: 100, type: 'number', valueFormatter: (v: number) => v?.toLocaleString() },
    { field: 'incrementPercent', headerName: 'Inc %', width: 70, type: 'number', valueFormatter: (v: number | null) => v != null ? `${v}%` : '—' },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => <Chip label={p.value} size="small" color={statusColors[p.value as string] || 'default'} /> },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: (p) => (
        <Box>
          {p.row.status === 'Pending' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(p.row.id)}><ThumbUp fontSize="small" /></IconButton></Tooltip>}
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (confirm('Delete?')) { await api.delete(`/contracts/promotions/${p.row.id}`); fetchData(); } }}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        <Box sx={{ ml: 'auto' }}><Button variant="contained" startIcon={<Add />} onClick={() => { setFormData({ employeeId: '', toDesigId: '', newBasicSalary: '', newTotalSalary: '', promotionDate: dayjs(), effectiveDate: dayjs(), reason: '' }); setFormError(''); setDialogOpen(true); }}>New Promotion</Button></Box>
      </Paper>
      <Paper variant="outlined" sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={totalCount} loading={loading}
          paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50]} disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Promotion</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee ID" value={formData.employeeId} onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))} size="small" type="number" required />
            <TextField label="To Designation ID" value={formData.toDesigId} onChange={(e) => setFormData(p => ({ ...p, toDesigId: e.target.value }))} size="small" type="number" required />
            <Box display="flex" gap={2}>
              <DatePicker label="Date" value={formData.promotionDate} onAccept={(d) => d && setFormData(p => ({ ...p, promotionDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, promotionDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              <DatePicker label="Effective" value={formData.effectiveDate} onAccept={(d) => d && setFormData(p => ({ ...p, effectiveDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, effectiveDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="New Basic" value={formData.newBasicSalary} onChange={(e) => setFormData(p => ({ ...p, newBasicSalary: e.target.value }))} size="small" type="number" required fullWidth />
              <TextField label="New Total" value={formData.newTotalSalary} onChange={(e) => setFormData(p => ({ ...p, newTotalSalary: e.target.value }))} size="small" type="number" fullWidth />
            </Box>
            <TextField label="Reason" value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Submit'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3: TRANSFERS
// ════════════════════════════════════════════════════════════
function TransfersTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<TransferRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', toBranchId: '', toDeptId: '', toDesigId: '', transferType: 'Internal', transferDate: dayjs() as Dayjs | null, effectiveDate: dayjs() as Dayjs | null, reason: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<TransferRow[]>>('/contracts/transfers', { params: { page: paginationModel.page + 1, pageSize: paginationModel.pageSize, search: search || undefined } });
      setRows(res.data.data || []); setTotalCount(res.data.pagination?.totalCount || 0);
    } catch { /* */ } finally { setLoading(false); }
  }, [paginationModel, search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.employeeId) { setFormError('Employee ID required'); return; }
    setSaving(true); setFormError('');
    try {
      await api.post('/contracts/transfers', {
        employeeId: Number(formData.employeeId), transferType: formData.transferType,
        transferDate: formData.transferDate?.format('YYYY-MM-DD'), effectiveDate: formData.effectiveDate?.format('YYYY-MM-DD'),
        toBranchId: formData.toBranchId ? Number(formData.toBranchId) : null,
        toDeptId: formData.toDeptId ? Number(formData.toDeptId) : null,
        toDesigId: formData.toDesigId ? Number(formData.toDesigId) : null,
        reason: formData.reason || null,
      });
      enqueueSnackbar('Transfer created', { variant: 'success' }); setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleApprove = async (id: number) => {
    try { await api.put(`/contracts/transfers/${id}/approve`, { approvedById: 1 }); enqueueSnackbar('Transfer approved', { variant: 'success' }); fetchData(); }
    catch (err: unknown) { enqueueSnackbar(err instanceof Error ? err.message : 'Failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 90 },
    { field: 'employeeName', headerName: 'Employee', width: 140, flex: 1 },
    { field: 'transferDate', headerName: 'Date', width: 100, valueFormatter: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { field: 'transferType', headerName: 'Type', width: 90 },
    { field: 'fromBranch', headerName: 'From Branch', width: 110, valueFormatter: (v: string | null) => v || '—' },
    { field: 'fromDepartment', headerName: 'From Dept', width: 110, valueFormatter: (v: string | null) => v || '—' },
    { field: 'toBranch', headerName: 'To Branch', width: 110, valueFormatter: (v: string | null) => v || '—' },
    { field: 'toDepartment', headerName: 'To Dept', width: 110, valueFormatter: (v: string | null) => v || '—' },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => <Chip label={p.value} size="small" color={statusColors[p.value as string] || 'default'} /> },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: (p) => (
        <Box>
          {p.row.status === 'Pending' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(p.row.id)}><ThumbUp fontSize="small" /></IconButton></Tooltip>}
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (confirm('Delete?')) { await api.delete(`/contracts/transfers/${p.row.id}`); fetchData(); } }}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        <Box sx={{ ml: 'auto' }}><Button variant="contained" startIcon={<Add />} onClick={() => { setFormData({ employeeId: '', toBranchId: '', toDeptId: '', toDesigId: '', transferType: 'Internal', transferDate: dayjs(), effectiveDate: dayjs(), reason: '' }); setFormError(''); setDialogOpen(true); }}>New Transfer</Button></Box>
      </Paper>
      <Paper variant="outlined" sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={totalCount} loading={loading}
          paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50]} disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Transfer</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee ID" value={formData.employeeId} onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))} size="small" type="number" required />
            <FormControl size="small"><InputLabel>Type</InputLabel>
              <Select value={formData.transferType} label="Type" onChange={(e) => setFormData(p => ({ ...p, transferType: e.target.value }))}>
                <MenuItem value="Internal">Internal</MenuItem><MenuItem value="External">External</MenuItem><MenuItem value="Deputation">Deputation</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <DatePicker label="Date" value={formData.transferDate} onAccept={(d) => d && setFormData(p => ({ ...p, transferDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, transferDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              <DatePicker label="Effective" value={formData.effectiveDate} onAccept={(d) => d && setFormData(p => ({ ...p, effectiveDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, effectiveDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="To Branch ID" value={formData.toBranchId} onChange={(e) => setFormData(p => ({ ...p, toBranchId: e.target.value }))} size="small" type="number" fullWidth />
              <TextField label="To Dept ID" value={formData.toDeptId} onChange={(e) => setFormData(p => ({ ...p, toDeptId: e.target.value }))} size="small" type="number" fullWidth />
            </Box>
            <TextField label="Reason" value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} size="small" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Submit'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 4: WARNINGS
// ════════════════════════════════════════════════════════════
function WarningsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<WarningRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', warningType: 'Verbal', severity: 1, reason: '', suspensionDays: '', salaryDeduction: '', warningDate: dayjs() as Dayjs | null });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<WarningRow[]>>('/contracts/warnings', { params: { page: paginationModel.page + 1, pageSize: paginationModel.pageSize, search: search || undefined } });
      setRows(res.data.data || []); setTotalCount(res.data.pagination?.totalCount || 0);
    } catch { /* */ } finally { setLoading(false); }
  }, [paginationModel, search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.employeeId || !formData.reason) { setFormError('Employee and Reason are required'); return; }
    setSaving(true); setFormError('');
    try {
      await api.post('/contracts/warnings', {
        employeeId: Number(formData.employeeId), warningDate: formData.warningDate?.format('YYYY-MM-DD'),
        warningType: formData.warningType, severity: formData.severity, reason: formData.reason,
        suspensionDays: formData.suspensionDays ? Number(formData.suspensionDays) : null,
        salaryDeduction: formData.salaryDeduction ? Number(formData.salaryDeduction) : null,
        issuedById: 1,
      });
      enqueueSnackbar('Warning issued', { variant: 'success' }); setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 90 },
    { field: 'employeeName', headerName: 'Employee', width: 150, flex: 1 },
    { field: 'warningDate', headerName: 'Date', width: 100, valueFormatter: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { field: 'warningType', headerName: 'Type', width: 100 },
    { field: 'severity', headerName: 'Severity', width: 120, renderCell: (p) => <Rating value={p.value} readOnly size="small" max={5} /> },
    { field: 'reason', headerName: 'Reason', width: 200 },
    { field: 'suspensionDays', headerName: 'Suspension', width: 100, valueFormatter: (v: number | null) => v != null ? `${v} days` : '—' },
    { field: 'status', headerName: 'Status', width: 110, renderCell: (p) => <Chip label={p.value} size="small" color={statusColors[p.value as string] || 'default'} /> },
    {
      field: 'actions', headerName: '', width: 60, sortable: false,
      renderCell: (p) => <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (confirm('Delete?')) { await api.delete(`/contracts/warnings/${p.row.id}`); fetchData(); } }}><Delete fontSize="small" /></IconButton></Tooltip>,
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        <Box sx={{ ml: 'auto' }}><Button variant="contained" color="warning" startIcon={<Add />} onClick={() => { setFormData({ employeeId: '', warningType: 'Verbal', severity: 1, reason: '', suspensionDays: '', salaryDeduction: '', warningDate: dayjs() }); setFormError(''); setDialogOpen(true); }}>Issue Warning</Button></Box>
      </Paper>
      <Paper variant="outlined" sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={totalCount} loading={loading}
          paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50]} disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Issue Warning</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee ID" value={formData.employeeId} onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))} size="small" type="number" required />
            <DatePicker label="Warning Date" value={formData.warningDate} onAccept={(d) => d && setFormData(p => ({ ...p, warningDate: d }))}
              onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, warningDate: d })); }}
              slotProps={{ textField: { size: 'small' } }} />
            <Box display="flex" gap={2}>
              <FormControl size="small" fullWidth><InputLabel>Type</InputLabel>
                <Select value={formData.warningType} label="Type" onChange={(e) => setFormData(p => ({ ...p, warningType: e.target.value }))}>
                  <MenuItem value="Verbal">Verbal</MenuItem><MenuItem value="Written">Written</MenuItem><MenuItem value="Final">Final</MenuItem>
                </Select>
              </FormControl>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography variant="caption">Severity</Typography>
                <Rating value={formData.severity} onChange={(_, v) => setFormData(p => ({ ...p, severity: v || 1 }))} max={5} size="small" />
              </Box>
            </Box>
            <TextField label="Reason" value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} size="small" multiline rows={2} required />
            <Box display="flex" gap={2}>
              <TextField label="Suspension Days" value={formData.suspensionDays} onChange={(e) => setFormData(p => ({ ...p, suspensionDays: e.target.value }))} size="small" type="number" fullWidth />
              <TextField label="Salary Deduction" value={formData.salaryDeduction} onChange={(e) => setFormData(p => ({ ...p, salaryDeduction: e.target.value }))} size="small" type="number" fullWidth />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Issue'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 5: TERMINATIONS
// ════════════════════════════════════════════════════════════
function TerminationsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<TerminationRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', terminationType: 'Resignation', reason: '', terminationDate: dayjs() as Dayjs | null, lastWorkingDate: dayjs().add(30, 'day') as Dayjs | null, noticePeriodDays: '30', eosAmount: '', netSettlement: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<TerminationRow[]>>('/contracts/terminations', { params: { page: paginationModel.page + 1, pageSize: paginationModel.pageSize, search: search || undefined } });
      setRows(res.data.data || []); setTotalCount(res.data.pagination?.totalCount || 0);
    } catch { /* */ } finally { setLoading(false); }
  }, [paginationModel, search]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!formData.employeeId || !formData.reason) { setFormError('Employee and Reason required'); return; }
    setSaving(true); setFormError('');
    try {
      await api.post('/contracts/terminations', {
        employeeId: Number(formData.employeeId), terminationType: formData.terminationType,
        terminationDate: formData.terminationDate?.format('YYYY-MM-DD'),
        lastWorkingDate: formData.lastWorkingDate?.format('YYYY-MM-DD'),
        reason: formData.reason, noticePeriodDays: Number(formData.noticePeriodDays) || 30,
        eosAmount: formData.eosAmount ? Number(formData.eosAmount) : null,
        netSettlement: formData.netSettlement ? Number(formData.netSettlement) : null,
      });
      enqueueSnackbar('Termination created', { variant: 'success' }); setDialogOpen(false); fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleApprove = async (id: number) => {
    try { await api.put(`/contracts/terminations/${id}/approve`, { approvedById: 1 }); enqueueSnackbar('Termination approved', { variant: 'success' }); fetchData(); }
    catch (err: unknown) { enqueueSnackbar(err instanceof Error ? err.message : 'Failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 90 },
    { field: 'employeeName', headerName: 'Employee', width: 150, flex: 1 },
    { field: 'terminationDate', headerName: 'Date', width: 100, valueFormatter: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { field: 'lastWorkingDate', headerName: 'Last Day', width: 100, valueFormatter: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { field: 'terminationType', headerName: 'Type', width: 120 },
    { field: 'reason', headerName: 'Reason', width: 200 },
    { field: 'eosAmount', headerName: 'EOS', width: 100, type: 'number', valueFormatter: (v: number | null) => v != null ? v.toLocaleString() : '—' },
    { field: 'netSettlement', headerName: 'Net Settle', width: 100, type: 'number', valueFormatter: (v: number | null) => v != null ? v.toLocaleString() : '—' },
    { field: 'status', headerName: 'Status', width: 100, renderCell: (p) => <Chip label={p.value} size="small" color={statusColors[p.value as string] || 'default'} /> },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: (p) => (
        <Box>
          {p.row.status === 'Pending' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(p.row.id)}><ThumbUp fontSize="small" /></IconButton></Tooltip>}
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (confirm('Delete?')) { await api.delete(`/contracts/terminations/${p.row.id}`); fetchData(); } }}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ width: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <Tooltip title="Refresh"><IconButton onClick={fetchData}><Refresh /></IconButton></Tooltip>
        <Box sx={{ ml: 'auto' }}><Button variant="contained" color="error" startIcon={<Add />} onClick={() => { setFormData({ employeeId: '', terminationType: 'Resignation', reason: '', terminationDate: dayjs(), lastWorkingDate: dayjs().add(30, 'day'), noticePeriodDays: '30', eosAmount: '', netSettlement: '' }); setFormError(''); setDialogOpen(true); }}>New Termination</Button></Box>
      </Paper>
      <Paper variant="outlined" sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={totalCount} loading={loading}
          paginationMode="server" paginationModel={paginationModel} onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50]} disableRowSelectionOnClick density="compact"
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' } }} />
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Termination</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Employee ID" value={formData.employeeId} onChange={(e) => setFormData(p => ({ ...p, employeeId: e.target.value }))} size="small" type="number" required />
            <FormControl size="small"><InputLabel>Type</InputLabel>
              <Select value={formData.terminationType} label="Type" onChange={(e) => setFormData(p => ({ ...p, terminationType: e.target.value }))}>
                <MenuItem value="Resignation">Resignation</MenuItem><MenuItem value="Termination">Termination</MenuItem><MenuItem value="Retirement">Retirement</MenuItem><MenuItem value="Absconding">Absconding</MenuItem><MenuItem value="Contract Expiry">Contract Expiry</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <DatePicker label="Termination Date" value={formData.terminationDate} onAccept={(d) => d && setFormData(p => ({ ...p, terminationDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, terminationDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              <DatePicker label="Last Working Day" value={formData.lastWorkingDate} onAccept={(d) => d && setFormData(p => ({ ...p, lastWorkingDate: d }))}
                onChange={(d) => { if (d && d.isValid()) setFormData(p => ({ ...p, lastWorkingDate: d })); }}
                slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            </Box>
            <TextField label="Reason" value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} size="small" multiline rows={2} required />
            <Box display="flex" gap={2}>
              <TextField label="EOS Amount" value={formData.eosAmount} onChange={(e) => setFormData(p => ({ ...p, eosAmount: e.target.value }))} size="small" type="number" fullWidth />
              <TextField label="Net Settlement" value={formData.netSettlement} onChange={(e) => setFormData(p => ({ ...p, netSettlement: e.target.value }))} size="small" type="number" fullWidth />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Submit'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
