'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Chip, Switch, FormControlLabel,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { useSnackbar } from 'notistack';

export interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'switch' | 'number' | 'select';
  required?: boolean;
  gridWidth?: number;
  gridFlex?: boolean;
  gridHidden?: boolean;
  options?: { value: number | string; label: string }[];
  renderCell?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface CrudPageProps {
  title: string;
  entityName: string;
  apiPath: string;
  fields: FieldConfig[];
  codeField?: string; // maps to "code" in OrgItemDto
  extraPayload?: Record<string, unknown>;
}

export default function CrudPage({ title, entityName, apiPath, fields, codeField, extraPayload }: CrudPageProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const getEmptyForm = () => {
    const f: Record<string, unknown> = {};
    fields.forEach((fd) => {
      if (fd.type === 'switch') f[fd.key] = true;
      else if (fd.type === 'number') f[fd.key] = '';
      else f[fd.key] = '';
    });
    return f;
  };
  const [form, setForm] = useState<Record<string, unknown>>(getEmptyForm());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Record<string, unknown>[]>>(apiPath);
      setRows(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [apiPath]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditId(null); setForm(getEmptyForm()); setDialogOpen(true); };
  const openEdit = (row: Record<string, unknown>) => {
    setEditId(row.id as number);
    const f: Record<string, unknown> = {};
    fields.forEach((fd) => { f[fd.key] = row[fd.key] ?? (fd.type === 'switch' ? true : ''); });
    setForm(f);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Build payload — map codeField to "code" for OrgItemDto pattern
      const payload: Record<string, unknown> = { ...extraPayload };
      fields.forEach((fd) => {
        if (fd.type === 'number') payload[fd.key] = form[fd.key] ? Number(form[fd.key]) : null;
        else payload[fd.key] = form[fd.key];
      });
      // If codeField is specified, the backend DTO uses "code" as the key
      if (codeField && payload[codeField] !== undefined) {
        payload.code = payload[codeField];
        delete payload[codeField];
      }

      if (editId) {
        await api.put(`${apiPath}/${editId}`, payload);
        enqueueSnackbar(`${entityName} updated`, { variant: 'success' });
      } else {
        await api.post(apiPath, payload);
        enqueueSnackbar(`${entityName} created`, { variant: 'success' });
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete this ${entityName.toLowerCase()}?`)) return;
    try {
      await api.delete(`${apiPath}/${id}`);
      enqueueSnackbar(`${entityName} deleted`, { variant: 'success' });
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    ...fields.filter((f) => !f.gridHidden).map((f) => {
      const isArabic = f.key.toLowerCase().endsWith('ar') || f.key.toLowerCase().includes('arabic');
      const col: GridColDef = {
        field: f.key,
        headerName: f.label,
        width: f.gridWidth || 150,
        ...(f.gridFlex ? { flex: 1, minWidth: 150 } : {}),
        ...(isArabic ? { align: 'right' } : {}),
      };
      if (f.type === 'switch') {
        col.width = 90;
        col.renderCell = (p) => <Chip label={p.value ? 'Yes' : 'No'} size="small" color={p.value ? 'success' : 'default'} />;
      }
      if (f.renderCell) {
        col.renderCell = (p) => f.renderCell!(p.value, p.row);
      }
      return col;
    }),
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (p) => (
        <>
          <IconButton size="small" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id as number)}><DeleteIcon fontSize="small" /></IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{title}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add {entityName}</Button>
      </Box>
      <Card>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          rowHeight={40}
          columnHeaderHeight={42}
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
            '& .MuiDataGrid-cell': { fontSize: '0.85rem', py: 0.5 },
            '& .MuiDataGrid-cell[data-field$="Ar"], & .MuiDataGrid-cell[data-field*="arabic"]': { direction: 'rtl', fontFamily: '"Noto Sans Arabic", "Tajawal", sans-serif' },
          }}
          disableRowSelectionOnClick
        />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? `Edit ${entityName}` : `Add ${entityName}`}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {fields.map((f) => {
            if (f.type === 'switch') {
              return (
                <FormControlLabel
                  key={f.key}
                  control={<Switch checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />}
                  label={f.label}
                />
              );
            }
            if (f.type === 'select' && f.options) {
              return (
                <TextField key={f.key} select label={f.label} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} required={f.required}>
                  <MenuItem value="">Select</MenuItem>
                  {f.options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              );
            }
            const isAr = f.key.toLowerCase().endsWith('ar') || f.key.toLowerCase().includes('arabic');
            return (
              <TextField
                key={f.key}
                label={f.label}
                type={f.type === 'number' ? 'number' : 'text'}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required={f.required}
                {...(isAr ? { dir: 'rtl', slotProps: { input: { sx: { textAlign: 'right', fontFamily: '"Noto Sans Arabic", "Tajawal", sans-serif' } } } } : {})}
              />
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
