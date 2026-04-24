'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, TextField, Card, CardContent, Chip,
  InputAdornment, MenuItem, Select, FormControl, InputLabel, SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { Employee, LookupItem } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';

export default function EmployeesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState<LookupItem[]>([]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1),
        pageSize: String(paginationModel.pageSize),
      });
      if (search) params.set('search', search);
      if (deptFilter) params.set('departmentId', deptFilter);
      const res = await api.get<ApiResponse<Employee[]>>(`/employees?${params}`);
      setRows(res.data.data || []);
      setTotalCount(res.data.pagination?.totalCount || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [paginationModel, search, deptFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => {
    api.get<ApiResponse<LookupItem[]>>('/lookups/departments').then(r => setDepartments(r.data.data || []));
  }, []);

  const columns: GridColDef[] = [
    { field: 'empCode', headerName: 'Code', width: 110 },
    { field: 'nameEn', headerName: 'Name', flex: 1, minWidth: 180 },
    { field: 'departmentName', headerName: 'Department', width: 160 },
    { field: 'designationName', headerName: 'Designation', width: 160 },
    { field: 'branchName', headerName: 'Branch', width: 160 },
    {
      field: 'statusName', headerName: 'Status', width: 100,
      renderCell: (params) => <Chip label={params.value || 'N/A'} size="small" color={params.row.statusId === 1 ? 'success' : 'default'} />,
    },
    { field: 'doj', headerName: 'Joined', width: 110, valueFormatter: (value: string) => value ? new Date(value).toLocaleDateString() : '' },
    { field: 'basicSalary', headerName: 'Basic Salary', width: 120, type: 'number', valueFormatter: (value: number) => value?.toLocaleString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Employees</Typography>
        {can('Employees:Create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/employees/add')}>
            Add Employee
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, pb: '16px !important' }}>
          <TextField
            placeholder="Search by name or code..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select value={deptFilter} label="Department" onChange={(e: SelectChangeEvent) => setDeptFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={totalCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          rowHeight={40}
          columnHeaderHeight={42}
          onRowClick={(params) => router.push(`/employees/${params.id}`)}
          getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'even-row' : 'odd-row'}
          sx={{
            border: 0, minHeight: 400,
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#2E6B4A', color: '#fff' },
            '& .MuiDataGrid-columnHeader': { bgcolor: '#2E6B4A', color: '#fff' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, color: '#fff' },
            '& .MuiDataGrid-sortIcon': { color: '#fff' },
            '& .MuiDataGrid-menuIconButton': { color: '#fff' },
            '& .MuiDataGrid-iconButtonContainer .MuiSvgIcon-root': { color: '#fff' },
            '& .MuiDataGrid-columnSeparator': { color: 'rgba(255,255,255,0.3)' },
            '& .MuiDataGrid-filler': { bgcolor: '#2E6B4A' },
            '& .even-row': { bgcolor: '#FAFAFA' },
            '& .odd-row': { bgcolor: '#FFFFFF' },
            '& .MuiDataGrid-row:hover': { bgcolor: '#F0FDF4 !important' },
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-cell': { fontSize: '0.85rem', py: 0.5 },
          }}
          disableRowSelectionOnClick
        />
      </Card>
    </Box>
  );
}
