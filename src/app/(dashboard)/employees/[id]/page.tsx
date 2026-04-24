'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Skeleton, Tab, Tabs,
} from '@mui/material';
import { ArrowBack, Edit as EditIcon } from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { EmployeeDetail } from '@/types';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
    </Box>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    api.get<ApiResponse<EmployeeDetail>>(`/employees/${id}`)
      .then((r) => setEmp(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box>{[1,2,3].map(i => <Skeleton key={i} height={80} sx={{ mb: 2 }} />)}</Box>;
  if (!emp) return <Typography>Employee not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/employees')}>Back</Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>{emp.nameEn}</Typography>
          <Typography variant="body2" color="text.secondary">{emp.empCode} | {emp.designationName}</Typography>
        </Box>
        <Chip label={emp.statusName || 'Active'} color={emp.statusId === 1 ? 'success' : 'default'} />
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => router.push(`/employees/add?edit=${id}`)}>Edit</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Personal" />
        <Tab label="Employment" />
        <Tab label="Salary" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Full Name (English)" value={emp.nameEn} />
                <InfoRow label="Full Name (Arabic)" value={emp.nameAr} />
                <InfoRow label="Gender" value={emp.gender === 'M' ? 'Male' : 'Female'} />
                <InfoRow label="Date of Birth" value={emp.dob ? new Date(emp.dob).toLocaleDateString() : undefined} />
                <InfoRow label="Marital Status" value={emp.maritalStatus === 'S' ? 'Single' : emp.maritalStatus === 'M' ? 'Married' : emp.maritalStatus} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Nationality" value={emp.nationalityName} />
                <InfoRow label="Email" value={emp.email} />
                <InfoRow label="Personal Email" value={emp.personalEmail} />
                <InfoRow label="Phone" value={emp.phone} />
                <InfoRow label="Mobile" value={emp.mobile} />
                <InfoRow label="Address" value={emp.address1} />
                <InfoRow label="City" value={emp.city} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Employee Code" value={emp.empCode} />
                <InfoRow label="Date of Joining" value={emp.doj ? new Date(emp.doj).toLocaleDateString() : undefined} />
                <InfoRow label="Department" value={emp.departmentName} />
                <InfoRow label="Designation" value={emp.designationName} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Branch" value={emp.branchName} />
                <InfoRow label="Grade" value={emp.gradeName} />
                <InfoRow label="Status" value={emp.statusName} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Basic Salary" value={emp.basicSalary?.toLocaleString()} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InfoRow label="Total Salary" value={emp.totalSalary?.toLocaleString()} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
