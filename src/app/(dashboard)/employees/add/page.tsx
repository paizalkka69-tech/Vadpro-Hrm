'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  MenuItem, Alert, CircularProgress,
} from '@mui/material';
import { ArrowBack, Save as SaveIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { LookupItem } from '@/types';

export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lookups
  const [departments, setDepartments] = useState<LookupItem[]>([]);
  const [branches, setBranches] = useState<LookupItem[]>([]);
  const [designations, setDesignations] = useState<LookupItem[]>([]);
  const [grades, setGrades] = useState<LookupItem[]>([]);
  const [nationalities, setNationalities] = useState<LookupItem[]>([]);

  // Form
  const [form, setForm] = useState({
    empCode: '', nameEn: '', nameAr: '', gender: 'M', dob: '', maritalStatus: 'S',
    doj: new Date().toISOString().split('T')[0],
    companyId: 1, branchId: '', departmentId: '',
    designationId: '', gradeId: '', nationalityId: '',
    phone: '', mobile: '', email: '', basicSalary: '', totalSalary: '',
  });

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<LookupItem[]>>('/lookups/departments'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/branches'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/designations'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/grades'),
      api.get<ApiResponse<LookupItem[]>>('/lookups/nationalities'),
    ]).then(([depts, br, desig, gr, nat]) => {
      setDepartments(depts.data.data || []);
      setBranches(br.data.data || []);
      setDesignations(desig.data.data || []);
      setGrades(gr.data.data || []);
      setNationalities(nat.data.data || []);
    });
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const payload = {
        ...form,
        companyId: Number(form.companyId),
        branchId: Number(form.branchId) || undefined,
        departmentId: Number(form.departmentId) || undefined,
        designationId: Number(form.designationId) || undefined,
        gradeId: Number(form.gradeId) || undefined,
        nationalityId: Number(form.nationalityId) || undefined,
        basicSalary: Number(form.basicSalary) || 0,
        totalSalary: Number(form.totalSalary) || 0,
        dob: form.dob || undefined,
      };
      const res = await api.post<ApiResponse<{ id: number }>>('/employees', payload);
      if (res.data.success) {
        setSuccess('Employee created successfully');
        setTimeout(() => router.push('/employees'), 1000);
      } else {
        setError(res.data.message);
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create employee');
    } finally { setLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/employees')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>Add Employee</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Employee Code" value={form.empCode} onChange={handleChange('empCode')} required /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Name (English)" value={form.nameEn} onChange={handleChange('nameEn')} required /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="Name (Arabic)" value={form.nameAr} onChange={handleChange('nameAr')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Gender" value={form.gender} onChange={handleChange('gender')}><MenuItem value="M">Male</MenuItem><MenuItem value="F">Female</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Date of Birth" type="date" value={form.dob} onChange={handleChange('dob')} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Marital Status" value={form.maritalStatus} onChange={handleChange('maritalStatus')}><MenuItem value="S">Single</MenuItem><MenuItem value="M">Married</MenuItem><MenuItem value="D">Divorced</MenuItem><MenuItem value="W">Widowed</MenuItem></TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Nationality" value={form.nationalityId} onChange={handleChange('nationalityId')}><MenuItem value="">Select</MenuItem>{nationalities.map(n => <MenuItem key={n.id} value={n.id}>{n.nameEn}</MenuItem>)}</TextField></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Employment Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Date of Joining" type="date" value={form.doj} onChange={handleChange('doj')} slotProps={{ inputLabel: { shrink: true } }} required /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Branch" value={form.branchId} onChange={handleChange('branchId')} required><MenuItem value="">Select</MenuItem>{branches.map(b => <MenuItem key={b.id} value={b.id}>{b.nameEn}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Department" value={form.departmentId} onChange={handleChange('departmentId')}><MenuItem value="">Select</MenuItem>{departments.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Designation" value={form.designationId} onChange={handleChange('designationId')}><MenuItem value="">Select</MenuItem>{designations.map(d => <MenuItem key={d.id} value={d.id}>{d.nameEn}</MenuItem>)}</TextField></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth select label="Grade" value={form.gradeId} onChange={handleChange('gradeId')}><MenuItem value="">Select</MenuItem>{grades.map(g => <MenuItem key={g.id} value={g.id}>{g.nameEn}</MenuItem>)}</TextField></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Contact & Salary</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Phone" value={form.phone} onChange={handleChange('phone')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Mobile" value={form.mobile} onChange={handleChange('mobile')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} /></Grid>
              <Grid size={{ xs: 12, md: 3 }} />
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Basic Salary" type="number" value={form.basicSalary} onChange={handleChange('basicSalary')} required /></Grid>
              <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth label="Total Salary" type="number" value={form.totalSalary} onChange={handleChange('totalSalary')} required /></Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push('/employees')}>Cancel</Button>
          <Button variant="contained" type="submit" startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />} disabled={loading}>
            Save Employee
          </Button>
        </Box>
      </form>
    </Box>
  );
}
