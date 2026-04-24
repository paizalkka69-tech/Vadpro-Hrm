'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControlLabel, Checkbox, Skeleton, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface OvertimeRecord {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  isHoliday: boolean;
  reason: string;
  status: string;
  approvedBy: string | null;
  amount: number | null;
}

interface OvertimeRequest {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  isHoliday: boolean;
}

function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServiceOvertimePage() {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OvertimeRequest>({
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '17:00',
    endTime: '19:00',
    reason: '',
    isHoliday: false,
  });
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<OvertimeRecord[]>>('/self-service/overtime', { params: { page: page + 1, pageSize } })
      .then(r => { setRecords(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load overtime records', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'date', headerName: 'Date', flex: 1, renderCell: (p) => dayjs(p.value).format('DD MMM YYYY') },
    { field: 'startTime', headerName: 'Start', width: 80 },
    { field: 'endTime', headerName: 'End', width: 80 },
    { field: 'totalHours', headerName: 'Hours', width: 80, type: 'number' },
    { field: 'isHoliday', headerName: 'Holiday', width: 80,
      renderCell: (p) => p.value ? <Chip label="Yes" size="small" color="warning" /> : <Chip label="No" size="small" />,
    },
    { field: 'reason', headerName: 'Reason', flex: 1.5 },
    { field: 'amount', headerName: 'Amount', flex: 1, type: 'number',
      renderCell: (p) => p.value != null ? fmtNum(p.value) : '—',
    },
    { field: 'approvedBy', headerName: 'Approved By', flex: 1,
      renderCell: (p) => p.value || '—',
    },
    { field: 'status', headerName: 'Status', width: 110,
      renderCell: (p) => <Chip label={p.value} size="small" color={statusColor(p.value) as 'success' | 'warning' | 'error' | 'default'} />,
    },
  ];

  const handleSubmit = () => {
    if (!form.date) { enqueueSnackbar('Select a date', { variant: 'warning' }); return; }
    if (!form.startTime || !form.endTime) { enqueueSnackbar('Enter start and end time', { variant: 'warning' }); return; }
    if (form.startTime >= form.endTime) { enqueueSnackbar('End time must be after start time', { variant: 'warning' }); return; }
    if (!form.reason.trim()) { enqueueSnackbar('Please provide a reason', { variant: 'warning' }); return; }

    setSubmitting(true);
    api.post<ApiResponse<OvertimeRecord>>('/self-service/overtime', form)
      .then(() => {
        enqueueSnackbar('Overtime request submitted successfully', { variant: 'success' });
        setOpen(false);
        setForm({ date: dayjs().format('YYYY-MM-DD'), startTime: '17:00', endTime: '19:00', reason: '', isHoliday: false });
        load();
      })
      .catch(() => enqueueSnackbar('Failed to submit overtime request', { variant: 'error' }))
      .finally(() => setSubmitting(false));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Overtime Requests</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#2E6B4A', '&:hover': { bgcolor: '#1B3A2D' } }}>
          Request Overtime
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={records} columns={columns} loading={loading}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Request Overtime</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Date" type="date" fullWidth value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start Time" type="time" fullWidth value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="End Time" type="time" fullWidth value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <TextField label="Reason" multiline rows={3} fullWidth value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          <FormControlLabel
            control={<Checkbox checked={form.isHoliday} onChange={e => setForm(f => ({ ...f, isHoliday: e.target.checked }))} />}
            label="Holiday / Rest Day Overtime (x2 rate)"
          />
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
