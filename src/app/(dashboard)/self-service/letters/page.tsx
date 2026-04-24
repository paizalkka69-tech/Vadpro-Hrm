'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Skeleton, Chip, IconButton, Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Download } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface LetterRecord {
  id: number;
  requestDate: string;
  letterType: string;
  purpose: string;
  addressedTo: string;
  language: string;
  status: string;
  downloadUrl: string | null;
  processedDate: string | null;
}

interface LetterRequest {
  letterType: string;
  purpose: string;
  addressedTo: string;
  language: string;
}

const LETTER_TYPES = [
  { value: 'SalaryCert', label: 'Salary Certificate' },
  { value: 'Employment', label: 'Employment Letter' },
  { value: 'Experience', label: 'Experience Letter' },
  { value: 'BankLetter', label: 'Bank Letter' },
  { value: 'NOC', label: 'No Objection Certificate (NOC)' },
  { value: 'Custom', label: 'Custom Request' },
];

const LANGUAGES = [
  { value: 'EN', label: 'English' },
  { value: 'AR', label: 'Arabic' },
];

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServiceLettersPage() {
  const [letters, setLetters] = useState<LetterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<LetterRequest>({ letterType: '', purpose: '', addressedTo: '', language: 'EN' });
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<LetterRecord[]>>('/self-service/letters', { params: { page: page + 1, pageSize } })
      .then(r => { setLetters(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load letter requests', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'Ready': return 'success';
      case 'Processing': return 'info';
      case 'Pending': return 'warning';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const columns: GridColDef[] = [
    { field: 'requestDate', headerName: 'Request Date', flex: 1, renderCell: (p) => dayjs(p.value).format('DD MMM YYYY') },
    { field: 'letterType', headerName: 'Type', flex: 1,
      renderCell: (p) => LETTER_TYPES.find(t => t.value === p.value)?.label || p.value,
    },
    { field: 'purpose', headerName: 'Purpose', flex: 1.5 },
    { field: 'addressedTo', headerName: 'Addressed To', flex: 1 },
    { field: 'language', headerName: 'Lang', width: 60 },
    { field: 'processedDate', headerName: 'Processed', flex: 1,
      renderCell: (p) => p.value ? dayjs(p.value).format('DD MMM YYYY') : '—',
    },
    { field: 'status', headerName: 'Status', width: 110,
      renderCell: (p) => <Chip label={p.value} size="small" color={statusColor(p.value) as 'success' | 'info' | 'warning' | 'error' | 'default'} />,
    },
    { field: 'downloadUrl', headerName: '', width: 60, sortable: false, filterable: false,
      renderCell: (p) => p.row.status === 'Ready' && p.value ? (
        <Tooltip title="Download Letter">
          <IconButton size="small" onClick={() => handleDownload(p.value)} color="primary">
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    },
  ];

  const handleSubmit = () => {
    if (!form.letterType) { enqueueSnackbar('Select a letter type', { variant: 'warning' }); return; }
    if (!form.purpose.trim()) { enqueueSnackbar('Please provide the purpose', { variant: 'warning' }); return; }

    setSubmitting(true);
    api.post<ApiResponse<LetterRecord>>('/self-service/letters', form)
      .then(() => {
        enqueueSnackbar('Letter request submitted successfully', { variant: 'success' });
        setOpen(false);
        setForm({ letterType: '', purpose: '', addressedTo: '', language: 'EN' });
        load();
      })
      .catch(() => enqueueSnackbar('Failed to submit letter request', { variant: 'error' }))
      .finally(() => setSubmitting(false));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Letter Requests</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#2E6B4A', '&:hover': { bgcolor: '#1B3A2D' } }}>
          Request Letter
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={letters} columns={columns} loading={loading}
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
        <DialogTitle sx={{ fontWeight: 600 }}>Request a Letter</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField select label="Letter Type" fullWidth value={form.letterType}
            onChange={e => setForm(f => ({ ...f, letterType: e.target.value }))}>
            {LETTER_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField label="Purpose" multiline rows={2} fullWidth value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="e.g., Bank account opening, visa application" />
          <TextField label="Addressed To (optional)" fullWidth value={form.addressedTo}
            onChange={e => setForm(f => ({ ...f, addressedTo: e.target.value }))}
            placeholder="e.g., Embassy of UAE, Al Rajhi Bank" />
          <TextField select label="Language" fullWidth value={form.language}
            onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
            {LANGUAGES.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
          </TextField>
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
