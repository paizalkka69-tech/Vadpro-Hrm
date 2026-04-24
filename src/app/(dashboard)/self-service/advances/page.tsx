'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Skeleton, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface Advance {
  id: number;
  requestDate: string;
  amount: number;
  recoveryMonths: number;
  monthlyDeduction: number;
  totalRecovered: number;
  outstandingBalance: number;
  reason: string;
  status: string;
}

interface AdvanceRequest {
  amount: string;
  recoveryMonths: number;
  reason: string;
}

function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServiceAdvancesPage() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AdvanceRequest>({ amount: '', recoveryMonths: 1, reason: '' });
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<Advance[]>>('/self-service/advances', { params: { page: page + 1, pageSize } })
      .then(r => { setAdvances(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load advances', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      case 'Recovered': return 'info';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'requestDate', headerName: 'Request Date', flex: 1, renderCell: (p) => dayjs(p.value).format('DD MMM YYYY') },
    { field: 'amount', headerName: 'Amount', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'recoveryMonths', headerName: 'Recovery (Months)', width: 140, type: 'number' },
    { field: 'monthlyDeduction', headerName: 'Monthly Deduction', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalRecovered', headerName: 'Recovered', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'outstandingBalance', headerName: 'Outstanding', flex: 1, type: 'number',
      renderCell: (p) => <Typography fontWeight={600} color={p.value > 0 ? 'error' : 'success'}>{fmtNum(p.value)}</Typography>,
    },
    { field: 'reason', headerName: 'Reason', flex: 1.5 },
    { field: 'status', headerName: 'Status', width: 110,
      renderCell: (p) => <Chip label={p.value} size="small" color={statusColor(p.value) as 'success' | 'warning' | 'error' | 'info' | 'default'} />,
    },
  ];

  const handleSubmit = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { enqueueSnackbar('Enter a valid amount', { variant: 'warning' }); return; }
    if (!form.reason.trim()) { enqueueSnackbar('Please provide a reason', { variant: 'warning' }); return; }

    setSubmitting(true);
    api.post<ApiResponse<Advance>>('/self-service/advances', { amount: amt, recoveryMonths: form.recoveryMonths, reason: form.reason.trim() })
      .then(() => {
        enqueueSnackbar('Advance request submitted successfully', { variant: 'success' });
        setOpen(false);
        setForm({ amount: '', recoveryMonths: 1, reason: '' });
        load();
      })
      .catch(() => enqueueSnackbar('Failed to submit advance request', { variant: 'error' }))
      .finally(() => setSubmitting(false));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My Advances</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#2E6B4A', '&:hover': { bgcolor: '#1B3A2D' } }}>
          Request Advance
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={advances} columns={columns} loading={loading}
            paginationMode="server" rowCount={total}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
            pageSizeOptions={[10, 25]}
            density="compact" autoHeight disableRowSelectionOnClick
            sx={{ border: 0, '& .MuiDataGrid-columnHeaders': HEADER_SX }}
          />
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Request an Advance</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Amount" type="number" fullWidth value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            inputProps={{ min: 0, step: 100 }} />
          <TextField select label="Recovery Months" fullWidth value={form.recoveryMonths}
            onChange={e => setForm(f => ({ ...f, recoveryMonths: +e.target.value }))}>
            {[1, 2, 3].map(m => <MenuItem key={m} value={m}>{m} month{m > 1 ? 's' : ''}</MenuItem>)}
          </TextField>
          <TextField label="Reason" multiline rows={3} fullWidth value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}
            sx={{ bgcolor: '#2E6B4A', '&:hover': { bgcolor: '#1B3A2D' } }}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
