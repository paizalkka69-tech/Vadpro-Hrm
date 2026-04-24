'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Avatar, Chip, Divider, Paper,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface Profile {
  id: number; empCode: string; nameEn: string; nameAr: string;
  dob: string; gender: string; maritalStatus: string;
  email: string; personalEmail: string; phone: string; mobile: string;
  address1: string; city: string; photoPath: string;
  doj: string; departmentName: string; branchName: string;
  designationName: string; gradeName: string; nationalityName: string;
  statusName: string; basicSalary: number; totalSalary: number;
}

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }
function fmtNum(n: number) { return n?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'; }

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
    </Grid>
  );
}

export default function SelfServiceProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    api.get<ApiResponse<Profile>>('/self-service/profile')
      .then(r => setProfile(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load profile', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  if (loading) return <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} /></Box>;
  if (!profile) return <Box sx={{ p: 3 }}><Typography color="text.secondary">Profile not found</Typography></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Profile</Typography>

      {/* Header Card */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #2E6B4A 0%, #4CAF50 100%)', color: '#fff', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 32 }}>
            {profile.nameEn?.charAt(0) || 'E'}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{profile.nameEn}</Typography>
            {profile.nameAr && <Typography variant="body1" sx={{ opacity: 0.85, direction: 'rtl' }}>{profile.nameAr}</Typography>}
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip label={profile.empCode} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              <Chip label={profile.statusName} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Personal Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Personal Information</Typography>
          <Grid container spacing={2}>
            <InfoRow label="Date of Birth" value={fmtDate(profile.dob)} />
            <InfoRow label="Gender" value={profile.gender} />
            <InfoRow label="Marital Status" value={profile.maritalStatus} />
            <InfoRow label="Nationality" value={profile.nationalityName} />
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="Mobile" value={profile.mobile} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Personal Email" value={profile.personalEmail} />
            <InfoRow label="Address" value={profile.address1} />
            <InfoRow label="City" value={profile.city} />
          </Grid>
        </CardContent>
      </Card>

      {/* Employment Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Employment Details</Typography>
          <Grid container spacing={2}>
            <InfoRow label="Date of Joining" value={fmtDate(profile.doj)} />
            <InfoRow label="Branch" value={profile.branchName} />
            <InfoRow label="Department" value={profile.departmentName} />
            <InfoRow label="Designation" value={profile.designationName} />
            <InfoRow label="Grade" value={profile.gradeName} />
          </Grid>
        </CardContent>
      </Card>

      {/* Salary Info */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Salary Information</Typography>
          <Grid container spacing={2}>
            <InfoRow label="Basic Salary" value={fmtNum(profile.basicSalary)} />
            <InfoRow label="Total Salary" value={fmtNum(profile.totalSalary)} />
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
