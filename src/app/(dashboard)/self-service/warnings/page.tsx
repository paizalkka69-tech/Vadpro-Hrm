'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Skeleton, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface WarningRecord {
  id: number;
  warningDate: string;
  warningType: string;
  reason: string;
  issuedBy: string;
  severity: string;
  notes: string | null;
}

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServiceWarningsPage() {
  const [warnings, setWarnings] = useState<WarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<WarningRecord[]>>('/self-service/warnings', { params: { page: page + 1, pageSize } })
      .then(r => { setWarnings(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load warnings', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const severityColor = (s: string) => {
    switch (s) {
      case 'Verbal': return 'info';
      case 'Written': return 'warning';
      case 'Final': return 'error';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'warningDate', headerName: 'Date', flex: 1, renderCell: (p) => dayjs(p.value).format('DD MMM YYYY') },
    { field: 'warningType', headerName: 'Type', flex: 1 },
    { field: 'severity', headerName: 'Severity', width: 100,
      renderCell: (p) => <Chip label={p.value} size="small" color={severityColor(p.value) as 'info' | 'warning' | 'error' | 'default'} />,
    },
    { field: 'reason', headerName: 'Reason', flex: 2 },
    { field: 'issuedBy', headerName: 'Issued By', flex: 1 },
    { field: 'notes', headerName: 'Notes', flex: 1.5,
      renderCell: (p) => p.value || '—',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Warnings</Typography>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={warnings} columns={columns} loading={loading}
            paginationMode="server" rowCount={total}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
            pageSizeOptions={[10, 25]}
            density="compact" autoHeight disableRowSelectionOnClick
            sx={{ border: 0, '& .MuiDataGrid-columnHeaders': HEADER_SX }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
