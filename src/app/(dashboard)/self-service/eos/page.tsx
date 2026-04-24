'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Divider, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api, { ApiResponse } from '@/lib/api';

interface EosEstimate {
  joiningDate: string;
  serviceYears: number;
  serviceMonths: number;
  serviceDays: number;
  basicSalary: number;
  dailyRate: number;
  terminationAmount: number;
  terminationBreakdown: EosBreakdownItem[];
  resignationAmount: number;
  resignationBreakdown: EosBreakdownItem[];
}

interface EosBreakdownItem {
  period: string;
  years: number;
  rate: string;
  amount: number;
}

function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function SelfServiceEosPage() {
  const [data, setData] = useState<EosEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    api.get<ApiResponse<EosEstimate>>('/self-service/eos-estimate')
      .then(r => setData(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load EOS estimate', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  if (loading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
      <Grid container spacing={2}>
        {[1, 2].map(i => <Grid size={{ xs: 12, md: 6 }} key={i}><Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} /></Grid>)}
      </Grid>
    </Box>
  );

  if (!data) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary">Unable to calculate EOS estimate</Typography>
      <Typography variant="body2" color="text.secondary">Please contact HR for assistance.</Typography>
    </Box>
  );

  const renderBreakdown = (items: EosBreakdownItem[], total: number, color: string) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#2E6B4A' }}>
            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Period</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 600 }}>Years</TableCell>
            <TableCell align="center" sx={{ color: '#fff', fontWeight: 600 }}>Rate</TableCell>
            <TableCell align="right" sx={{ color: '#fff', fontWeight: 600 }}>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell>{item.period}</TableCell>
              <TableCell align="right">{item.years.toFixed(2)}</TableCell>
              <TableCell align="center">{item.rate}</TableCell>
              <TableCell align="right">{fmtNum(item.amount)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total EOS</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color }}>{fmtNum(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My End-of-Service Estimate</Typography>

      {/* Service Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            {[
              { label: 'Joining Date', value: data.joiningDate },
              { label: 'Service Period', value: `${data.serviceYears}y ${data.serviceMonths}m ${data.serviceDays}d` },
              { label: 'Basic Salary', value: fmtNum(data.basicSalary) },
              { label: 'Daily Rate', value: fmtNum(data.dailyRate) },
            ].map((item, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={600}>{item.value}</Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Termination */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="error.main" sx={{ mb: 2 }}>
                If Terminated (Full Entitlement)
              </Typography>
              {renderBreakdown(data.terminationBreakdown, data.terminationAmount, '#d32f2f')}
            </CardContent>
          </Card>
        </Grid>

        {/* Resignation */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="warning.main" sx={{ mb: 2 }}>
                If I Resign (Tiered)
              </Typography>
              {renderBreakdown(data.resignationBreakdown, data.resignationAmount, '#ed6c02')}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Disclaimer:</strong> This is an estimate only, calculated based on your current basic salary and
          Saudi Labor Law (Article 84/85). The actual EOS amount may differ based on unpaid leave, deductions,
          and final HR calculations. This does not constitute a legal commitment.
        </Typography>
      </Alert>
    </Box>
  );
}
