'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, TextField, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Tooltip,
  FormControlLabel, Checkbox, MenuItem, Skeleton,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search, Add, Edit, Delete, Flight, Badge, Description, DirectionsCar,
  HealthAndSafety, Work, AssignmentInd,
  CheckCircle, Cancel, SwapHoriz,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface DocType { id: number; typeCode: string; nameEn: string; nameAr?: string; expiryAlertDays: number; isMandatory: boolean; isActive: boolean; }
interface ExpirySummary { totalDocuments: number; currentDocuments: number; expiredDocuments: number; expiringIn30Days: number; expiringIn60Days: number; passportsWithCompany: number; totalPassports: number; totalVisas: number; totalResidenceIds: number; totalWorkPermits: number; totalDrivingLicenses: number; totalInsurances: number; }
interface PassportRow { id: number; employeeId: number; employeeCode: string; employeeName: string; passportNo: string; issueDate?: string; expiryDate: string; issuePlace?: string; countryName?: string; isWithCompany: boolean; receivedDate?: string; returnedDate?: string; attachmentPath?: string; remarks?: string; isCurrent: boolean; daysToExpiry: number; }
interface VisaRow { id: number; employeeId: number; employeeCode: string; employeeName: string; visaNo: string; visaType: string; issueDate?: string; expiryDate: string; entryType?: string; issuePlace?: string; destination?: string; purpose?: string; sponsorName?: string; remarks?: string; isCurrent: boolean; daysToExpiry: number; }
interface ResidenceIdRow { id: number; employeeId: number; employeeCode: string; employeeName: string; documentNo: string; issueDate?: string; expiryDate: string; issuePlace?: string; profession?: string; professionAr?: string; sponsorName?: string; borderNo?: string; countryCode: string; remarks?: string; isCurrent: boolean; daysToExpiry: number; }
interface WorkPermitRow { id: number; employeeId: number; employeeCode: string; employeeName: string; permitNo: string; permitType?: string; issueDate?: string; expiryDate: string; issuingAuthority?: string; profession?: string; molNumber?: string; remarks?: string; isCurrent: boolean; daysToExpiry: number; }
interface DrivingLicenseRow { id: number; employeeId: number; employeeCode: string; employeeName: string; licenseNo: string; licenseType?: string; issueDate?: string; expiryDate: string; issuePlace?: string; countryName?: string; isCurrent: boolean; daysToExpiry: number; }
interface InsuranceRow { id: number; employeeId: number; employeeCode: string; employeeName: string; insuranceType: string; provider: string; policyNo: string; memberNo?: string; insuranceClass?: string; startDate: string; endDate: string; premiumAmount?: number; paidBy: string; coversDependents: boolean; remarks?: string; isCurrent: boolean; daysToExpiry: number; }
interface EmpOption { id: number; empCode: string; nameEn: string; }

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function expiryChip(days: number) {
  if (days < 0) return <Chip label="Expired" size="small" color="error" />;
  if (days <= 30) return <Chip label={`${days}d`} size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100' }} />;
  if (days <= 60) return <Chip label={`${days}d`} size="small" sx={{ bgcolor: '#FFFDE7', color: '#F57F17' }} />;
  return <Chip label={`${days}d`} size="small" color="success" variant="outlined" />;
}

function currentChip(isCurrent: boolean) {
  return isCurrent ? <Chip label="Current" size="small" color="primary" variant="outlined" /> : <Chip label="Old" size="small" variant="outlined" />;
}

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
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

export default function DocumentsPage() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<ExpirySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse<ExpirySummary>>('/documents/summary')
      .then(r => setSummary(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  if (loading) return <Box sx={{ p: 3 }}>{[1,2,3].map(i => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}</Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Document Management</Typography>

      {summary && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <StatCard title="Total Documents" value={summary.totalDocuments} color="#1565C0" />
          <StatCard title="Current" value={summary.currentDocuments} color="#2E6B4A" />
          <StatCard title="Expired" value={summary.expiredDocuments} color="#D32F2F" />
          <StatCard title="Expiring (30d)" value={summary.expiringIn30Days} color="#E65100" />
          <StatCard title="Passports Held" value={summary.passportsWithCompany} color="#6A1B9A" />
        </Box>
      )}

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tab icon={<Description />} iconPosition="start" label="Types" />
          <Tab icon={<Flight />} iconPosition="start" label="Passports" />
          <Tab icon={<Badge />} iconPosition="start" label="Visas" />
          <Tab icon={<AssignmentInd />} iconPosition="start" label="Residence IDs" />
          <Tab icon={<Work />} iconPosition="start" label="Work Permits" />
          <Tab icon={<DirectionsCar />} iconPosition="start" label="Driving Licenses" />
          <Tab icon={<HealthAndSafety />} iconPosition="start" label="Insurance" />
        </Tabs>
        <CardContent>
          {tab === 0 && <DocumentTypesTab />}
          {tab === 1 && <PassportsTab />}
          {tab === 2 && <VisasTab />}
          {tab === 3 && <ResidenceIdsTab />}
          {tab === 4 && <WorkPermitsTab />}
          {tab === 5 && <DrivingLicensesTab />}
          {tab === 6 && <InsuranceTab />}
        </CardContent>
      </Card>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 0: DOCUMENT TYPES
// ═══════════════════════════════════════════════════════════

function DocumentTypesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocType | null>(null);
  const [form, setForm] = useState({ typeCode: '', nameEn: '', nameAr: '', expiryAlertDays: 30, isMandatory: false, isActive: true });

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<DocType[]>>('/documents/types').then(r => setRows(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: DocType) => {
    if (row) { setEditing(row); setForm({ typeCode: row.typeCode, nameEn: row.nameEn, nameAr: row.nameAr || '', expiryAlertDays: row.expiryAlertDays, isMandatory: row.isMandatory, isActive: row.isActive }); }
    else { setEditing(null); setForm({ typeCode: '', nameEn: '', nameAr: '', expiryAlertDays: 30, isMandatory: false, isActive: true }); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await api.put(`/documents/types/${editing.id}`, form);
      else await api.post('/documents/types', form);
      enqueueSnackbar(editing ? 'Updated' : 'Created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this document type?')) return;
    try { await api.delete(`/documents/types/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'typeCode', headerName: 'Code', width: 110 },
    { field: 'nameEn', headerName: 'Name (EN)', flex: 1, minWidth: 150 },
    { field: 'nameAr', headerName: 'Name (AR)', flex: 1, minWidth: 150, renderCell: (p) => p.value || '—' },
    { field: 'expiryAlertDays', headerName: 'Alert Days', width: 100, align: 'center' },
    { field: 'isMandatory', headerName: 'Mandatory', width: 100, renderCell: (p) => p.value ? <CheckCircle fontSize="small" color="primary" /> : <Cancel fontSize="small" color="disabled" /> },
    { field: 'isActive', headerName: 'Active', width: 80, renderCell: (p) => p.value ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" color="default" /> },
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
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Type</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        pageSizeOptions={[25,50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } }}} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Document Type' : 'New Document Type'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Type Code" size="small" value={form.typeCode} onChange={e => setForm(p => ({ ...p, typeCode: e.target.value }))} />
          <TextField label="Name (EN)" size="small" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} />
          <TextField label="Name (AR)" size="small" value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))} />
          <TextField label="Expiry Alert Days" size="small" type="number" value={form.expiryAlertDays} onChange={e => setForm(p => ({ ...p, expiryAlertDays: Number(e.target.value) }))} />
          <FormControlLabel control={<Checkbox checked={form.isMandatory} onChange={e => setForm(p => ({ ...p, isMandatory: e.target.checked }))} />} label="Mandatory" />
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

// ═══════════════════════════════════════════════════════════
// GENERIC DOCUMENT TAB (shared pattern for all 6 types)
// ═══════════════════════════════════════════════════════════

function useEmployees() {
  const [employees, setEmployees] = useState<EmpOption[]>([]);
  useEffect(() => {
    api.get<ApiResponse<EmpOption[]>>('/employees/lookup').then(r => setEmployees(r.data.data || [])).catch(() => {});
  }, []);
  return employees;
}

// ═══════════════════════════════════════════════════════════
// TAB 1: PASSPORTS
// ═══════════════════════════════════════════════════════════

function PassportsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const employees = useEmployees();
  const [rows, setRows] = useState<PassportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PassportRow | null>(null);
  const defaultForm = { employeeId: 0, passportNo: '', issueDate: null as Dayjs | null, expiryDate: null as Dayjs | null, issuePlace: '', issueCountryId: null as number | null, isWithCompany: false, receivedDate: null as Dayjs | null, returnedDate: null as Dayjs | null, remarks: '', isCurrent: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<PassportRow[]>>('/documents/passports', { params: { page: page + 1, pageSize, search: search || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: PassportRow) => {
    if (row) {
      setEditing(row);
      setForm({ employeeId: row.employeeId, passportNo: row.passportNo, issueDate: row.issueDate ? dayjs(row.issueDate) : null, expiryDate: dayjs(row.expiryDate), issuePlace: row.issuePlace || '', issueCountryId: null, isWithCompany: row.isWithCompany, receivedDate: row.receivedDate ? dayjs(row.receivedDate) : null, returnedDate: row.returnedDate ? dayjs(row.returnedDate) : null, remarks: row.remarks || '', isCurrent: row.isCurrent });
    } else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = { ...form, issueDate: form.issueDate?.format('YYYY-MM-DD'), expiryDate: form.expiryDate?.format('YYYY-MM-DD'), receivedDate: form.receivedDate?.format('YYYY-MM-DD'), returnedDate: form.returnedDate?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/documents/passports/${editing.id}`, body);
      else await api.post('/documents/passports', body);
      enqueueSnackbar(editing ? 'Passport updated' : 'Passport created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleCustody = async (id: number, withCompany: boolean) => {
    try {
      await api.put(`/documents/passports/${id}/custody?withCompany=${withCompany}`);
      enqueueSnackbar(withCompany ? 'Passport received by company' : 'Passport returned to employee', { variant: 'success' });
      load();
    } catch { enqueueSnackbar('Update failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this passport record?')) return;
    try { await api.delete(`/documents/passports/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'passportNo', headerName: 'Passport No', width: 130 },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'daysToExpiry', headerName: 'Days Left', width: 90, renderCell: (p) => expiryChip(p.value) },
    { field: 'isWithCompany', headerName: 'Custody', width: 120, renderCell: (p) => p.value
      ? <Chip label="With Company" size="small" color="warning" />
      : <Chip label="With Employee" size="small" color="success" variant="outlined" /> },
    { field: 'isCurrent', headerName: 'Status', width: 90, renderCell: (p) => currentChip(p.value) },
    { field: 'countryName', headerName: 'Issued In', width: 110, renderCell: (p) => p.value || '—' },
    { field: 'actions', headerName: '', width: 130, sortable: false, renderCell: (p) => (
      <>
        <Tooltip title={p.row.isWithCompany ? 'Return to employee' : 'Receive by company'}>
          <IconButton size="small" onClick={() => handleCustody(p.row.id, !p.row.isWithCompany)}><SwapHoriz fontSize="small" /></IconButton>
        </Tooltip>
        <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search employee/passport..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 280 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Passport</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Passport' : 'New Passport'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <TextField label="Passport No" size="small" value={form.passportNo} onChange={e => setForm(p => ({ ...p, passportNo: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Issue Date" value={form.issueDate} onAccept={d => setForm(p => ({ ...p, issueDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, issueDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Expiry Date" value={form.expiryDate} onAccept={d => setForm(p => ({ ...p, expiryDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, expiryDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <TextField label="Issue Place" size="small" value={form.issuePlace} onChange={e => setForm(p => ({ ...p, issuePlace: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={form.isWithCompany} onChange={e => setForm(p => ({ ...p, isWithCompany: e.target.checked }))} />} label="Passport with Company" />
          {form.isWithCompany && (
            <DatePicker label="Received Date" value={form.receivedDate} onAccept={d => setForm(p => ({ ...p, receivedDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, receivedDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          )}
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />} label="Current Passport" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.passportNo || !form.expiryDate}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2: VISAS
// ═══════════════════════════════════════════════════════════

function VisasTab() {
  const { enqueueSnackbar } = useSnackbar();
  const employees = useEmployees();
  const [rows, setRows] = useState<VisaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VisaRow | null>(null);
  const defaultForm = { employeeId: 0, visaNo: '', visaType: 'Work', issueDate: null as Dayjs | null, expiryDate: null as Dayjs | null, entryType: '', issuePlace: '', destination: '', purpose: '', sponsorName: '', remarks: '', isCurrent: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<VisaRow[]>>('/documents/visas', { params: { page: page + 1, pageSize, search: search || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: VisaRow) => {
    if (row) {
      setEditing(row);
      setForm({ employeeId: row.employeeId, visaNo: row.visaNo, visaType: row.visaType, issueDate: row.issueDate ? dayjs(row.issueDate) : null, expiryDate: dayjs(row.expiryDate), entryType: row.entryType || '', issuePlace: row.issuePlace || '', destination: row.destination || '', purpose: row.purpose || '', sponsorName: row.sponsorName || '', remarks: row.remarks || '', isCurrent: row.isCurrent });
    } else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = { ...form, issueDate: form.issueDate?.format('YYYY-MM-DD'), expiryDate: form.expiryDate?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/documents/visas/${editing.id}`, body);
      else await api.post('/documents/visas', body);
      enqueueSnackbar(editing ? 'Visa updated' : 'Visa created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this visa record?')) return;
    try { await api.delete(`/documents/visas/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'visaNo', headerName: 'Visa No', width: 120 },
    { field: 'visaType', headerName: 'Type', width: 90 },
    { field: 'entryType', headerName: 'Entry', width: 80, renderCell: (p) => p.value || '—' },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'daysToExpiry', headerName: 'Days Left', width: 90, renderCell: (p) => expiryChip(p.value) },
    { field: 'sponsorName', headerName: 'Sponsor', width: 120, renderCell: (p) => p.value || '—' },
    { field: 'isCurrent', headerName: 'Status', width: 90, renderCell: (p) => currentChip(p.value) },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search employee/visa..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 280 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Visa</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Visa' : 'New Visa'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Visa No" size="small" fullWidth value={form.visaNo} onChange={e => setForm(p => ({ ...p, visaNo: e.target.value }))} />
            <TextField select label="Visa Type" size="small" fullWidth value={form.visaType} onChange={e => setForm(p => ({ ...p, visaType: e.target.value }))}>
              {['Work','Visit','Transit','Residence','Exit-Re-Entry','Final Exit'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Issue Date" value={form.issueDate} onAccept={d => setForm(p => ({ ...p, issueDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, issueDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Expiry Date" value={form.expiryDate} onAccept={d => setForm(p => ({ ...p, expiryDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, expiryDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Entry Type" size="small" fullWidth value={form.entryType} onChange={e => setForm(p => ({ ...p, entryType: e.target.value }))}>
              <MenuItem value="">—</MenuItem>
              {['Single','Multiple'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Destination" size="small" fullWidth value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} />
          </Box>
          <TextField label="Sponsor Name" size="small" value={form.sponsorName} onChange={e => setForm(p => ({ ...p, sponsorName: e.target.value }))} />
          <TextField label="Purpose" size="small" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} />
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />} label="Current Visa" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.visaNo || !form.expiryDate}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 3: RESIDENCE IDs (Iqama)
// ═══════════════════════════════════════════════════════════

function ResidenceIdsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const employees = useEmployees();
  const [rows, setRows] = useState<ResidenceIdRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ResidenceIdRow | null>(null);
  const defaultForm = { employeeId: 0, documentNo: '', issueDate: null as Dayjs | null, expiryDate: null as Dayjs | null, issuePlace: '', profession: '', professionAr: '', sponsorName: '', borderNo: '', countryCode: 'SA', remarks: '', isCurrent: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<ResidenceIdRow[]>>('/documents/residence-ids', { params: { page: page + 1, pageSize, search: search || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: ResidenceIdRow) => {
    if (row) {
      setEditing(row);
      setForm({ employeeId: row.employeeId, documentNo: row.documentNo, issueDate: row.issueDate ? dayjs(row.issueDate) : null, expiryDate: dayjs(row.expiryDate), issuePlace: row.issuePlace || '', profession: row.profession || '', professionAr: row.professionAr || '', sponsorName: row.sponsorName || '', borderNo: row.borderNo || '', countryCode: row.countryCode, remarks: row.remarks || '', isCurrent: row.isCurrent });
    } else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = { ...form, issueDate: form.issueDate?.format('YYYY-MM-DD'), expiryDate: form.expiryDate?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/documents/residence-ids/${editing.id}`, body);
      else await api.post('/documents/residence-ids', body);
      enqueueSnackbar(editing ? 'Residence ID updated' : 'Residence ID created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this residence ID record?')) return;
    try { await api.delete(`/documents/residence-ids/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'documentNo', headerName: 'Iqama No', width: 130 },
    { field: 'profession', headerName: 'Profession', width: 120, renderCell: (p) => p.value || '—' },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'daysToExpiry', headerName: 'Days Left', width: 90, renderCell: (p) => expiryChip(p.value) },
    { field: 'sponsorName', headerName: 'Sponsor', width: 120, renderCell: (p) => p.value || '—' },
    { field: 'borderNo', headerName: 'Border No', width: 110, renderCell: (p) => p.value || '—' },
    { field: 'isCurrent', headerName: 'Status', width: 90, renderCell: (p) => currentChip(p.value) },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search employee/iqama..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 280 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Residence ID</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Residence ID' : 'New Residence ID'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <TextField label="Iqama Number" size="small" value={form.documentNo} onChange={e => setForm(p => ({ ...p, documentNo: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Issue Date" value={form.issueDate} onAccept={d => setForm(p => ({ ...p, issueDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, issueDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Expiry Date" value={form.expiryDate} onAccept={d => setForm(p => ({ ...p, expiryDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, expiryDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Profession (EN)" size="small" fullWidth value={form.profession} onChange={e => setForm(p => ({ ...p, profession: e.target.value }))} />
            <TextField label="Profession (AR)" size="small" fullWidth value={form.professionAr} onChange={e => setForm(p => ({ ...p, professionAr: e.target.value }))} />
          </Box>
          <TextField label="Sponsor Name" size="small" value={form.sponsorName} onChange={e => setForm(p => ({ ...p, sponsorName: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Border No" size="small" fullWidth value={form.borderNo} onChange={e => setForm(p => ({ ...p, borderNo: e.target.value }))} />
            <TextField label="Country Code" size="small" fullWidth value={form.countryCode} onChange={e => setForm(p => ({ ...p, countryCode: e.target.value }))} />
          </Box>
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />} label="Current Residence ID" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.documentNo || !form.expiryDate}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 4: WORK PERMITS
// ═══════════════════════════════════════════════════════════

function WorkPermitsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const employees = useEmployees();
  const [rows, setRows] = useState<WorkPermitRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkPermitRow | null>(null);
  const defaultForm = { employeeId: 0, permitNo: '', permitType: '', issueDate: null as Dayjs | null, expiryDate: null as Dayjs | null, issuingAuthority: '', profession: '', molNumber: '', remarks: '', isCurrent: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<WorkPermitRow[]>>('/documents/work-permits', { params: { page: page + 1, pageSize, search: search || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: WorkPermitRow) => {
    if (row) {
      setEditing(row);
      setForm({ employeeId: row.employeeId, permitNo: row.permitNo, permitType: row.permitType || '', issueDate: row.issueDate ? dayjs(row.issueDate) : null, expiryDate: dayjs(row.expiryDate), issuingAuthority: row.issuingAuthority || '', profession: row.profession || '', molNumber: row.molNumber || '', remarks: row.remarks || '', isCurrent: row.isCurrent });
    } else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = { ...form, issueDate: form.issueDate?.format('YYYY-MM-DD'), expiryDate: form.expiryDate?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/documents/work-permits/${editing.id}`, body);
      else await api.post('/documents/work-permits', body);
      enqueueSnackbar(editing ? 'Work permit updated' : 'Work permit created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this work permit record?')) return;
    try { await api.delete(`/documents/work-permits/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'permitNo', headerName: 'Permit No', width: 130 },
    { field: 'permitType', headerName: 'Type', width: 100, renderCell: (p) => p.value || '—' },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'daysToExpiry', headerName: 'Days Left', width: 90, renderCell: (p) => expiryChip(p.value) },
    { field: 'issuingAuthority', headerName: 'Authority', width: 120, renderCell: (p) => p.value || '—' },
    { field: 'molNumber', headerName: 'MOL No', width: 110, renderCell: (p) => p.value || '—' },
    { field: 'isCurrent', headerName: 'Status', width: 90, renderCell: (p) => currentChip(p.value) },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search employee/permit..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 280 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Work Permit</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Work Permit' : 'New Work Permit'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Permit No" size="small" fullWidth value={form.permitNo} onChange={e => setForm(p => ({ ...p, permitNo: e.target.value }))} />
            <TextField select label="Permit Type" size="small" fullWidth value={form.permitType} onChange={e => setForm(p => ({ ...p, permitType: e.target.value }))}>
              <MenuItem value="">—</MenuItem>
              {['Initial','Renewal','Transfer','Cancellation'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Issue Date" value={form.issueDate} onAccept={d => setForm(p => ({ ...p, issueDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, issueDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Expiry Date" value={form.expiryDate} onAccept={d => setForm(p => ({ ...p, expiryDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, expiryDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <TextField label="Issuing Authority" size="small" value={form.issuingAuthority} onChange={e => setForm(p => ({ ...p, issuingAuthority: e.target.value }))} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Profession" size="small" fullWidth value={form.profession} onChange={e => setForm(p => ({ ...p, profession: e.target.value }))} />
            <TextField label="MOL Number" size="small" fullWidth value={form.molNumber} onChange={e => setForm(p => ({ ...p, molNumber: e.target.value }))} />
          </Box>
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />} label="Current Work Permit" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.permitNo || !form.expiryDate}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 5: DRIVING LICENSES
// ═══════════════════════════════════════════════════════════

function DrivingLicensesTab() {
  const { enqueueSnackbar } = useSnackbar();
  const employees = useEmployees();
  const [rows, setRows] = useState<DrivingLicenseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DrivingLicenseRow | null>(null);
  const defaultForm = { employeeId: 0, licenseNo: '', licenseType: '', issueDate: null as Dayjs | null, expiryDate: null as Dayjs | null, issuePlace: '', issueCountryId: null as number | null, isCurrent: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<DrivingLicenseRow[]>>('/documents/driving-licenses', { params: { page: page + 1, pageSize, search: search || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: DrivingLicenseRow) => {
    if (row) {
      setEditing(row);
      setForm({ employeeId: row.employeeId, licenseNo: row.licenseNo, licenseType: row.licenseType || '', issueDate: row.issueDate ? dayjs(row.issueDate) : null, expiryDate: dayjs(row.expiryDate), issuePlace: row.issuePlace || '', issueCountryId: null, isCurrent: row.isCurrent });
    } else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = { ...form, issueDate: form.issueDate?.format('YYYY-MM-DD'), expiryDate: form.expiryDate?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/documents/driving-licenses/${editing.id}`, body);
      else await api.post('/documents/driving-licenses', body);
      enqueueSnackbar(editing ? 'License updated' : 'License created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this license record?')) return;
    try { await api.delete(`/documents/driving-licenses/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 150 },
    { field: 'licenseNo', headerName: 'License No', width: 130 },
    { field: 'licenseType', headerName: 'Type', width: 100, renderCell: (p) => p.value || '—' },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'daysToExpiry', headerName: 'Days Left', width: 90, renderCell: (p) => expiryChip(p.value) },
    { field: 'issuePlace', headerName: 'Issued At', width: 120, renderCell: (p) => p.value || '—' },
    { field: 'countryName', headerName: 'Country', width: 100, renderCell: (p) => p.value || '—' },
    { field: 'isCurrent', headerName: 'Status', width: 90, renderCell: (p) => currentChip(p.value) },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search employee/license..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 280 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add License</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Driving License' : 'New Driving License'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="License No" size="small" fullWidth value={form.licenseNo} onChange={e => setForm(p => ({ ...p, licenseNo: e.target.value }))} />
            <TextField select label="License Type" size="small" fullWidth value={form.licenseType} onChange={e => setForm(p => ({ ...p, licenseType: e.target.value }))}>
              <MenuItem value="">—</MenuItem>
              {['Private','Light Vehicle','Heavy Vehicle','Motorcycle','Public Transport','All'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Issue Date" value={form.issueDate} onAccept={d => setForm(p => ({ ...p, issueDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, issueDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="Expiry Date" value={form.expiryDate} onAccept={d => setForm(p => ({ ...p, expiryDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, expiryDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <TextField label="Issue Place" size="small" value={form.issuePlace} onChange={e => setForm(p => ({ ...p, issuePlace: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />} label="Current License" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.licenseNo || !form.expiryDate}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 6: INSURANCE
// ═══════════════════════════════════════════════════════════

function InsuranceTab() {
  const { enqueueSnackbar } = useSnackbar();
  const employees = useEmployees();
  const [rows, setRows] = useState<InsuranceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InsuranceRow | null>(null);
  const defaultForm = { employeeId: 0, insuranceType: 'Medical', provider: '', policyNo: '', memberNo: '', insuranceClass: '', startDate: null as Dayjs | null, endDate: null as Dayjs | null, premiumAmount: 0, paidBy: 'Company', coversDependents: false, remarks: '', isCurrent: true };
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<InsuranceRow[]>>('/documents/insurances', { params: { page: page + 1, pageSize, search: search || undefined } })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (row?: InsuranceRow) => {
    if (row) {
      setEditing(row);
      setForm({ employeeId: row.employeeId, insuranceType: row.insuranceType, provider: row.provider, policyNo: row.policyNo, memberNo: row.memberNo || '', insuranceClass: row.insuranceClass || '', startDate: dayjs(row.startDate), endDate: dayjs(row.endDate), premiumAmount: row.premiumAmount || 0, paidBy: row.paidBy, coversDependents: row.coversDependents, remarks: row.remarks || '', isCurrent: row.isCurrent });
    } else { setEditing(null); setForm(defaultForm); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const body = { ...form, startDate: form.startDate?.format('YYYY-MM-DD'), endDate: form.endDate?.format('YYYY-MM-DD') };
      if (editing) await api.put(`/documents/insurances/${editing.id}`, body);
      else await api.post('/documents/insurances', body);
      enqueueSnackbar(editing ? 'Insurance updated' : 'Insurance created', { variant: 'success' });
      setOpen(false); load();
    } catch { enqueueSnackbar('Save failed', { variant: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this insurance record?')) return;
    try { await api.delete(`/documents/insurances/${id}`); enqueueSnackbar('Deleted', { variant: 'success' }); load(); }
    catch { enqueueSnackbar('Delete failed', { variant: 'error' }); }
  };

  const columns: GridColDef[] = [
    { field: 'employeeCode', headerName: 'Code', width: 80 },
    { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 140 },
    { field: 'insuranceType', headerName: 'Type', width: 90 },
    { field: 'provider', headerName: 'Provider', width: 130 },
    { field: 'policyNo', headerName: 'Policy No', width: 120 },
    { field: 'insuranceClass', headerName: 'Class', width: 80, renderCell: (p) => p.value || '—' },
    { field: 'endDate', headerName: 'End Date', width: 100, renderCell: (p) => fmtDate(p.value) },
    { field: 'daysToExpiry', headerName: 'Days Left', width: 90, renderCell: (p) => expiryChip(p.value) },
    { field: 'paidBy', headerName: 'Paid By', width: 90 },
    { field: 'coversDependents', headerName: 'Dep.', width: 60, renderCell: (p) => p.value ? <CheckCircle fontSize="small" color="primary" /> : <Cancel fontSize="small" color="disabled" /> },
    { field: 'isCurrent', headerName: 'Status', width: 80, renderCell: (p) => currentChip(p.value) },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => (
      <>
        <IconButton size="small" onClick={() => handleOpen(p.row)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
      </>
    )},
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search employee/policy/provider..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 300 }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()}>Add Insurance</Button>
      </Box>
      <DataGrid rows={rows} columns={columns} loading={loading} autoHeight density="compact"
        paginationMode="server" rowCount={total} pageSizeOptions={[25,50]}
        paginationModel={{ page, pageSize }} onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }} />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Insurance' : 'New Insurance'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Employee" size="small" value={form.employeeId || ''} onChange={e => setForm(p => ({ ...p, employeeId: Number(e.target.value) }))} disabled={!!editing}>
            <MenuItem value="">Select...</MenuItem>
            {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.empCode} - {e.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Insurance Type" size="small" fullWidth value={form.insuranceType} onChange={e => setForm(p => ({ ...p, insuranceType: e.target.value }))}>
              {['Medical','Life','Accident','Travel','Vehicle','Property'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Paid By" size="small" fullWidth value={form.paidBy} onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))}>
              {['Company','Employee','Shared'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Provider" size="small" fullWidth value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} />
            <TextField label="Policy No" size="small" fullWidth value={form.policyNo} onChange={e => setForm(p => ({ ...p, policyNo: e.target.value }))} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Member No" size="small" fullWidth value={form.memberNo} onChange={e => setForm(p => ({ ...p, memberNo: e.target.value }))} />
            <TextField select label="Class" size="small" fullWidth value={form.insuranceClass} onChange={e => setForm(p => ({ ...p, insuranceClass: e.target.value }))}>
              <MenuItem value="">—</MenuItem>
              {['A','B','C','VIP','Standard'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="Start Date" value={form.startDate} onAccept={d => setForm(p => ({ ...p, startDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, startDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker label="End Date" value={form.endDate} onAccept={d => setForm(p => ({ ...p, endDate: d }))} onChange={d => { if (d && d.isValid()) setForm(p => ({ ...p, endDate: d })); }} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
          </Box>
          <TextField label="Premium Amount" size="small" type="number" value={form.premiumAmount} onChange={e => setForm(p => ({ ...p, premiumAmount: Number(e.target.value) }))} />
          <FormControlLabel control={<Checkbox checked={form.coversDependents} onChange={e => setForm(p => ({ ...p, coversDependents: e.target.checked }))} />} label="Covers Dependents" />
          <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          <FormControlLabel control={<Checkbox checked={form.isCurrent} onChange={e => setForm(p => ({ ...p, isCurrent: e.target.checked }))} />} label="Current Insurance" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.employeeId || !form.provider || !form.policyNo || !form.endDate}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
