'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Chip, Alert, Divider,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface Contract {
  contractId: number;
  contractType: string;
  startDate: string;
  endDate: string | null;
  probationEndDate: string | null;
  noticePeriodDays: number;
  status: string;
  renewalCount: number;
  workingHoursPerDay: number;
  annualLeaveEntitlement: number;
  notes: string | null;
}

export default function SelfServiceContractPage() {
  const [data, setData] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    api.get<ApiResponse<Contract>>('/self-service/contract')
      .then(r => setData(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load contract', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  if (loading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
      <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
    </Box>
  );

  if (!data) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary">No active contract found</Typography>
      <Typography variant="body2" color="text.secondary">Please contact HR for assistance.</Typography>
    </Box>
  );

  const daysToExpiry = data.endDate ? dayjs(data.endDate).diff(dayjs(), 'day') : null;
  const expiringWarning = daysToExpiry !== null && daysToExpiry <= 90 && daysToExpiry > 0;
  const expired = daysToExpiry !== null && daysToExpiry <= 0;

  const infoRows: { label: string; value: React.ReactNode }[] = [
    { label: 'Contract Type', value: <Chip label={data.contractType} color="primary" size="small" /> },
    { label: 'Status', value: <Chip label={data.status} color={data.status === 'Active' ? 'success' : 'default'} size="small" /> },
    { label: 'Start Date', value: dayjs(data.startDate).format('DD MMM YYYY') },
    { label: 'End Date', value: data.endDate ? dayjs(data.endDate).format('DD MMM YYYY') : 'Open-ended' },
    { label: 'Probation End Date', value: data.probationEndDate ? dayjs(data.probationEndDate).format('DD MMM YYYY') : 'N/A' },
    { label: 'Notice Period', value: `${data.noticePeriodDays} days` },
    { label: 'Renewal Count', value: data.renewalCount },
    { label: 'Working Hours / Day', value: `${data.workingHoursPerDay} hours` },
    { label: 'Annual Leave Entitlement', value: `${data.annualLeaveEntitlement} days` },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Contract</Typography>

      {expiringWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your contract expires in <strong>{daysToExpiry} days</strong> ({dayjs(data.endDate).format('DD MMM YYYY')}). Please contact HR regarding renewal.
        </Alert>
      )}

      {expired && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your contract expired on <strong>{dayjs(data.endDate).format('DD MMM YYYY')}</strong>. Please contact HR immediately.
        </Alert>
      )}

      <Card>
        <CardContent>
          {infoRows.map((row, i) => (
            <Box key={i}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 1 }}>
                <Typography variant="body1" color="text.secondary">{row.label}</Typography>
                <Typography variant="body1" fontWeight={600}>{row.value}</Typography>
              </Box>
              {i < infoRows.length - 1 && <Divider />}
            </Box>
          ))}
          {data.notes && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ px: 1, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Notes</Typography>
                <Typography variant="body2">{data.notes}</Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
