'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface AttendanceRow {
  id: number; attendanceDate: string; timeIn: string; timeOut: string;
  workedDays: number; lateMinutes: number; earlyExitMinutes: number;
  otMinutes: number; status: string;
}

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }
function fmtTime(d?: string) { return d ? dayjs(d).format('HH:mm') : '—'; }

function statusChip(status: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    Present: 'success', Absent: 'error', Late: 'warning', Leave: 'info', Holiday: 'default', 'Day Off': 'default',
  };
  return <Chip label={status} size="small" color={map[status] ?? 'default'} />;
}

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServiceAttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(31);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page: page + 1, pageSize };
    if (startDate) params.startDate = startDate.format('YYYY-MM-DD');
    if (endDate) params.endDate = endDate.format('YYYY-MM-DD');
    api.get<ApiResponse<AttendanceRow[]>>('/self-service/attendance', { params })
      .then(r => { setRows(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load attendance', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, startDate, endDate, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const columns: GridColDef[] = [
    { field: 'attendanceDate', headerName: 'Date', flex: 1, renderCell: p => fmtDate(p.value) },
    { field: 'status', headerName: 'Status', width: 110, renderCell: p => statusChip(p.value) },
    { field: 'timeIn', headerName: 'Time In', width: 100, renderCell: p => fmtTime(p.value) },
    { field: 'timeOut', headerName: 'Time Out', width: 100, renderCell: p => fmtTime(p.value) },
    { field: 'workedDays', headerName: 'Worked', width: 80, type: 'number' },
    { field: 'lateMinutes', headerName: 'Late (min)', width: 100, type: 'number',
      renderCell: p => p.value > 0 ? <Chip label={p.value} size="small" color="warning" /> : '0' },
    { field: 'earlyExitMinutes', headerName: 'Early Exit', width: 100, type: 'number' },
    { field: 'otMinutes', headerName: 'OT (min)', width: 90, type: 'number',
      renderCell: p => p.value > 0 ? <Chip label={p.value} size="small" color="info" /> : '0' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Attendance</Typography>

      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <DatePicker label="From" value={startDate} onChange={v => { setStartDate(v); setPage(0); }}
              slotProps={{ textField: { size: 'small' } }} />
            <DatePicker label="To" value={endDate} onChange={v => { setEndDate(v); setPage(0); }}
              slotProps={{ textField: { size: 'small' } }} />
          </Box>
        </CardContent>
        <DataGrid
          rows={rows} columns={columns} loading={loading}
          paginationMode="server" rowCount={total}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[31, 62]}
          density="compact" autoHeight disableRowSelectionOnClick
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': HEADER_SX }}
        />
      </Card>
    </Box>
  );
}
