'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, MenuItem, Skeleton,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface Payslip {
  id: number; payrollNo: string; payrollMonth: string;
  basicSalary: number; totalAllowances: number; workedDays: number;
  absentDays: number; leaveDays: number; otAmountNormal: number;
  otAmountHoliday: number; grossEarnings: number; totalDeductions: number;
  advanceDeduction: number; loanDeduction: number; netPayable: number;
  status: string;
}

function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const HEADER_SX = { backgroundColor: '#2E6B4A', '& .MuiDataGrid-columnHeaderTitle': { color: '#fff', fontWeight: 600 } };

export default function SelfServicePayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    api.get<ApiResponse<Payslip[]>>('/self-service/payslips', { params: { page: page + 1, pageSize, year } })
      .then(r => { setPayslips(r.data.data); setTotal(r.data.pagination?.totalCount ?? 0); })
      .catch(() => enqueueSnackbar('Failed to load payslips', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [page, pageSize, year, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const columns: GridColDef[] = [
    { field: 'payrollMonth', headerName: 'Month', flex: 1, renderCell: (p) => dayjs(p.value).format('MMM YYYY') },
    { field: 'basicSalary', headerName: 'Basic', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalAllowances', headerName: 'Allowances', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'grossEarnings', headerName: 'Gross', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'totalDeductions', headerName: 'Deductions', flex: 1, type: 'number', renderCell: (p) => fmtNum(p.value) },
    { field: 'netPayable', headerName: 'Net Pay', flex: 1, type: 'number',
      renderCell: (p) => fmtNum(p.value),
      cellClassName: () => 'font-bold',
    },
    { field: 'workedDays', headerName: 'Worked', width: 80, type: 'number' },
    { field: 'absentDays', headerName: 'Absent', width: 80, type: 'number' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My Payslips</Typography>
        <TextField select size="small" label="Year" value={year} onChange={e => { setYear(+e.target.value); setPage(0); }} sx={{ width: 120 }}>
          {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={payslips} columns={columns} loading={loading}
            paginationMode="server" rowCount={total}
            paginationModel={{ page, pageSize }}
            onPaginationModelChange={m => { setPage(m.page); setPageSize(m.pageSize); }}
            pageSizeOptions={[12, 24]}
            density="compact"
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 0, '& .MuiDataGrid-columnHeaders': HEADER_SX, '& .font-bold': { fontWeight: 700 } }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
