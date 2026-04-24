'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Divider, Chip,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api, { ApiResponse } from '@/lib/api';

interface GosiDetails {
  gosiNumber: string;
  baseSalary: number;
  housingAllowance: number;
  totalGosiableSalary: number;
  employeeRate: number;
  employerRate: number;
  employeeShare: number;
  employerShare: number;
  totalContribution: number;
  ytdEmployeeShare: number;
  ytdEmployerShare: number;
  registrationDate: string | null;
  nationality: string;
}

function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtPct(n: number) { return `${n}%`; }

export default function SelfServiceGosiPage() {
  const [data, setData] = useState<GosiDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    api.get<ApiResponse<GosiDetails>>('/self-service/gosi')
      .then(r => setData(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load GOSI details', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  if (loading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
      <Grid container spacing={2}>
        {[1, 2, 3].map(i => <Grid size={{ xs: 12, md: 4 }} key={i}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /></Grid>)}
      </Grid>
    </Box>
  );

  if (!data) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary">No GOSI details found</Typography>
      <Typography variant="body2" color="text.secondary">Please contact HR for assistance.</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My GOSI Details</Typography>
        <Chip label={`GOSI #: ${data.gosiNumber}`} color="primary" />
      </Box>

      <Grid container spacing={3}>
        {/* Salary Breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>GOSI-able Salary</Typography>
              {[
                { label: 'Base Salary', value: fmtNum(data.baseSalary) },
                { label: 'Housing Allowance', value: fmtNum(data.housingAllowance) },
              ].map((row, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                  <Typography variant="body2">{row.value}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography fontWeight={700}>Total GOSI-able</Typography>
                <Typography fontWeight={700} color="primary">{fmtNum(data.totalGosiableSalary)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Contributions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Monthly Contribution</Typography>
              {[
                { label: `Employee (${fmtPct(data.employeeRate)})`, value: fmtNum(data.employeeShare) },
                { label: `Employer (${fmtPct(data.employerRate)})`, value: fmtNum(data.employerShare) },
              ].map((row, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                  <Typography variant="body2">{row.value}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography fontWeight={700}>Total Monthly</Typography>
                <Typography fontWeight={700} color="primary">{fmtNum(data.totalContribution)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* YTD */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Year-to-Date</Typography>
              {[
                { label: 'Employee YTD', value: fmtNum(data.ytdEmployeeShare) },
                { label: 'Employer YTD', value: fmtNum(data.ytdEmployerShare) },
              ].map((row, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                  <Typography variant="body2">{row.value}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography fontWeight={700}>Total YTD</Typography>
                <Typography fontWeight={700} color="primary">{fmtNum(data.ytdEmployeeShare + data.ytdEmployerShare)}</Typography>
              </Box>
              {data.registrationDate && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Registered since: {data.registrationDate}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Nationality: {data.nationality}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
