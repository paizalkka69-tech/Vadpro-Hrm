'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Switch, Skeleton,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface LeaveBalance {
  leaveTypeId: number; leaveTypeName: string; color: string;
  openingBalance: number; accrued: number; taken: number;
  adjusted: number; closingBalance: number;
}
interface LeaveApp {
  id: number; leaveTypeName: string; leaveTypeColor: string;
  applicationDate: string; fromDate: string; toDate: string;
  totalDays: number; isHalfDay: boolean; status: string;
  reason: string; rejectionReason: string;
  approvedByName: string; approvedDate: string;
}
interface LeaveType { id: number; nameEn: string; color: string; }

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }

function statusChip(status: string) {
  const map: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
    Pending: 'warning', Approved: 'success', Rejected: 'error', Cancelled: 'default',
  };
  return <Chip label={status} size="small" color={map[status] ?? 'default'} />;
}

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServiceLeavePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [apps, setApps] = useState<LeaveApp[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [formLeaveType, setFormLeaveType] = useState(0);
  const [formFrom, setFormFrom] = useState<Dayjs | null>(null);
  const [formTo, setFormTo] = useState<Dayjs | null>(null);
  const [formDays, setFormDays] = useState(0);
  const [formHalf, setFormHalf] = useState(false);
  const [formReason, setFormReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBalances = useCallback(() => {
    api.get<ApiResponse<LeaveBalance[]>>('/self-service/leave-balance')
      .then(r => setBalances(r.data.data))
      .catch(() => {});
  }, []);

  const loadApps = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page: page + 1, pageSize };
    if (statusFilter) params.status = statusFilter;
    api.get<ApiResponse<LeaveApp[]>>('/self-service/leave-applications', { params })
      .then(r => { setApps(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load leave applications', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, statusFilter, enqueueSnackbar]);

  useEffect(() => {
    loadBalances();
    api.get<ApiResponse<LeaveType[]>>('/self-service/leave-types').then(r => setLeaveTypes(r.data.data)).catch(() => {});
  }, [loadBalances]);

  useEffect(() => { loadApps(); }, [loadApps]);

  // Auto-calculate days
  useEffect(() => {
    if (formFrom && formTo) {
      const diff = formTo.diff(formFrom, 'day') + 1;
      setFormDays(formHalf ? 0.5 : Math.max(diff, 0));
    }
  }, [formFrom, formTo, formHalf]);

  const handleApply = async () => {
    if (!formLeaveType || !formFrom || !formTo) {
      enqueueSnackbar('Fill all required fields', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/self-service/leave-applications', {
        leaveTypeId: formLeaveType, fromDate: formFrom.format('YYYY-MM-DD'),
        toDate: formTo.format('YYYY-MM-DD'), totalDays: formDays,
        isHalfDay: formHalf, reason: formReason,
      });
      enqueueSnackbar('Leave application submitted', { variant: 'success' });
      setDialogOpen(false);
      resetForm();
      loadApps();
      loadBalances();
    } catch {
      enqueueSnackbar('Failed to submit leave', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setFormLeaveType(0); setFormFrom(null); setFormTo(null);
    setFormDays(0); setFormHalf(false); setFormReason('');
  };

  const columns: GridColDef[] = [
    { field: 'leaveTypeName', headerName: 'Leave Type', flex: 1 },
    { field: 'fromDate', headerName: 'From', width: 110, renderCell: p => fmtDate(p.value) },
    { field: 'toDate', headerName: 'To', width: 110, renderCell: p => fmtDate(p.value) },
    { field: 'totalDays', headerName: 'Days', width: 70, type: 'number' },
    { field: 'isHalfDay', headerName: 'Half', width: 60, type: 'boolean' },
    { field: 'status', headerName: 'Status', width: 110, renderCell: p => statusChip(p.value) },
    { field: 'reason', headerName: 'Reason', flex: 1 },
    { field: 'applicationDate', headerName: 'Applied', width: 110, renderCell: p => fmtDate(p.value) },
    { field: 'approvedByName', headerName: 'Approved By', width: 120 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Leave Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          sx={{ bgcolor: '#2E6B4A', '&:hover': { bgcolor: '#1B3A2D' } }}>
          Apply Leave
        </Button>
      </Box>

      {/* Balances */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {balances.map(b => (
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={b.leaveTypeId}>
            <Card sx={{ borderTop: `3px solid ${b.color || '#2E6B4A'}` }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" noWrap>{b.leaveTypeName}</Typography>
                <Typography variant="h5" fontWeight={700}>{b.closingBalance ?? 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Taken: {b.taken} | Accrued: {b.accrued}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter + Table */}
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <TextField select size="small" label="Status" value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(0); }} sx={{ width: 160 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Box>
        </CardContent>
        <DataGrid
          rows={apps} columns={columns} loading={loading}
          paginationMode="server" rowCount={total}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[25, 50]}
          density="compact" autoHeight disableRowSelectionOnClick
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': HEADER_SX }}
        />
      </Card>

      {/* Apply Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Apply for Leave</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField select label="Leave Type" value={formLeaveType} onChange={e => setFormLeaveType(+e.target.value)} required>
            <MenuItem value={0} disabled>Select type</MenuItem>
            {leaveTypes.map(lt => <MenuItem key={lt.id} value={lt.id}>{lt.nameEn}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker label="From" value={formFrom} onChange={setFormFrom} slotProps={{ textField: { fullWidth: true, required: true } }} />
            <DatePicker label="To" value={formTo} onChange={setFormTo} slotProps={{ textField: { fullWidth: true, required: true } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField label="Total Days" type="number" value={formDays} onChange={e => setFormDays(+e.target.value)}
              size="small" sx={{ width: 120 }} inputProps={{ step: 0.5, min: 0 }} />
            <FormControlLabel control={<Switch checked={formHalf} onChange={e => setFormHalf(e.target.checked)} />} label="Half Day" />
          </Box>
          <TextField label="Reason" multiline rows={2} value={formReason} onChange={e => setFormReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply} disabled={saving}
            sx={{ bgcolor: '#2E6B4A', '&:hover': { bgcolor: '#1B3A2D' } }}>
            {saving ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
