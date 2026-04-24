'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Skeleton, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface Loan {
  id: number;
  requestDate: string;
  amount: number;
  repaymentMonths: number;
  monthlyDeduction: number;
  totalPaid: number;
  outstandingBalance: number;
  reason: string;
  status: string;
}

interface LoanRequest {
  amount: string;
  repaymentMonths: string;
  reason: string;
}

function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServiceLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<LoanRequest>({ amount: '', repaymentMonths: '', reason: '' });
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<Loan[]>>('/self-service/loans', { params: { page: page + 1, pageSize } })
      .then(r => { setLoans(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load loans', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      case 'Completed': return 'info';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'requestDate', headerName: 'Request Date', flex: 1, renderCell: (p) => dayjs(p.value).format('DD MMM YYYY') },
    { field: 'amount', headerName: 'Loan Amount', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'repaymentMonths', headerName: 'Months', width: 80, type: 'number' },
    { field: 'monthlyDeduction', headerName: 'Monthly Deduction', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalPaid', headerName: 'Paid', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
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
    const months = parseInt(form.repaymentMonths);
    if (!amt || amt <= 0) { enqueueSnackbar('Enter a valid amount', { variant: 'warning' }); return; }
    if (!months || months <= 0) { enqueueSnackbar('Enter valid repayment months', { variant: 'warning' }); return; }
    if (!form.reason.trim()) { enqueueSnackbar('Please provide a reason', { variant: 'warning' }); return; }

    setSubmitting(true);
    api.post<ApiResponse<Loan>>('/self-service/loans', { amount: amt, repaymentMonths: months, reason: form.reason.trim() })
      .then(() => {
        enqueueSnackbar('Loan request submitted successfully', { variant: 'success' });
        setOpen(false);
        setForm({ amount: '', repaymentMonths: '', reason: '' });
        load();
      })
      .catch(() => enqueueSnackbar('Failed to submit loan request', { variant: 'error' }))
      .finally(() => setSubmitting(false));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My Loans</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#2E6B4A', '&:hover': { bgcolor: '#1B3A2D' } }}>
          Request Loan
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={loans} columns={columns} loading={loading}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Request a Loan</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Loan Amount" type="number" fullWidth value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            inputProps={{ min: 0, step: 100 }} />
          <TextField label="Repayment Months" type="number" fullWidth value={form.repaymentMonths}
            onChange={e => setForm(f => ({ ...f, repaymentMonths: e.target.value }))}
            inputProps={{ min: 1, max: 60 }} />
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
