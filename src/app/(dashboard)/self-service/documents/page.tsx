'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Skeleton, Avatar,
} from '@mui/material';
import {
  Flight, CardTravel, Work, CreditCard, DirectionsCar,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import api, { ApiResponse } from '@/lib/api';

interface Doc {
  id: number; documentType: string; documentNo: string;
  issueDate: string; expiryDate: string; isCurrent: boolean;
  status: string;
}

function fmtDate(d?: string) { return d ? dayjs(d).format('DD/MM/YYYY') : '—'; }

const iconMap: Record<string, React.ReactNode> = {
  Passport: <Flight />, Visa: <CardTravel />, 'Work Permit': <Work />,
  'Residence ID': <CreditCard />, 'Driving License': <DirectionsCar />,
};

function statusColor(status: string): 'success' | 'error' | 'warning' | 'default' {
  switch (status) {
    case 'Valid': return 'success';
    case 'Expired': return 'error';
    case 'Expiring Soon': return 'warning';
    default: return 'default';
  }
}

export default function SelfServiceDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    api.get<ApiResponse<Doc[]>>('/self-service/documents')
      .then(r => setDocs(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load documents', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  if (loading) return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Documents</Typography>
      <Grid container spacing={2}>
        {[1,2,3,4].map(i => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}><Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} /></Grid>)}
      </Grid>
    </Box>
  );

  // Group by type
  const grouped = docs.reduce<Record<string, Doc[]>>((acc, d) => {
    (acc[d.documentType] = acc[d.documentType] || []).push(d);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Documents</Typography>

      {Object.keys(grouped).length === 0 && (
        <Typography color="text.secondary">No documents found for your record.</Typography>
      )}

      <Grid container spacing={2}>
        {Object.entries(grouped).map(([type, items]) => (
          <Grid size={{ xs: 12 }} key={type}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {iconMap[type] ?? <CreditCard />} {type}
            </Typography>
            <Grid container spacing={2}>
              {items.map(doc => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${doc.documentType}-${doc.id}`}>
                  <Card sx={{
                    borderInlineStart: `4px solid ${doc.status === 'Valid' ? '#2e6b4a' : doc.status === 'Expired' ? '#d32f2f' : doc.status === 'Expiring Soon' ? '#ed6c02' : '#bdbdbd'}`,
                  }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#2E6B4A22', color: '#2E6B4A' }}>
                        {iconMap[doc.documentType] ?? <CreditCard />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>{doc.documentNo}</Typography>
                          <Chip label={doc.status} size="small" color={statusColor(doc.status)} />
                          {doc.isCurrent && <Chip label="Current" size="small" variant="outlined" />}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Issued: {fmtDate(doc.issueDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Expires: {fmtDate(doc.expiryDate)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
