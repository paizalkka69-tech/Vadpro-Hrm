'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api, { ApiResponse } from '@/lib/api';

interface SalaryComponent {
  name: string;
  amount: number;
  type: 'Earning' | 'Deduction';
  isFixed: boolean;
}

interface SalaryStructure {
  basicSalary: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  grossSalary: number;
  gosiDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
}

function fmtNum(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function SelfServiceSalaryPage() {
  const [data, setData] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    api.get<ApiResponse<SalaryStructure>>('/self-service/salary-structure')
      .then(r => setData(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load salary structure', { variant: 'error' }))
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
      <Typography variant="h6" color="text.secondary">No salary structure found</Typography>
      <Typography variant="body2" color="text.secondary">Please contact HR for assistance.</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Salary Structure</Typography>

      <Grid container spacing={3}>
        {/* Earnings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="success.main" sx={{ mb: 2 }}>Earnings</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#2E6B4A' }}>
                      <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Component</TableCell>
                      <TableCell align="right" sx={{ color: '#fff', fontWeight: 600 }}>Amount</TableCell>
                      <TableCell align="center" sx={{ color: '#fff', fontWeight: 600 }}>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Basic Salary</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtNum(data.basicSalary)}</TableCell>
                      <TableCell align="center"><Chip label="Fixed" size="small" color="primary" /></TableCell>
                    </TableRow>
                    {data.earnings.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{e.name}</TableCell>
                        <TableCell align="right">{fmtNum(e.amount)}</TableCell>
                        <TableCell align="center">
                          <Chip label={e.isFixed ? 'Fixed' : 'Variable'} size="small" color={e.isFixed ? 'primary' : 'default'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                <Typography fontWeight={700}>Gross Salary</Typography>
                <Typography fontWeight={700} color="success.main">{fmtNum(data.grossSalary)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Deductions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="error.main" sx={{ mb: 2 }}>Deductions</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#2E6B4A' }}>
                      <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Component</TableCell>
                      <TableCell align="right" sx={{ color: '#fff', fontWeight: 600 }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>GOSI (Employee Share)</TableCell>
                      <TableCell align="right">{fmtNum(data.gosiDeduction)}</TableCell>
                    </TableRow>
                    {data.loanDeduction > 0 && (
                      <TableRow>
                        <TableCell>Loan Deduction</TableCell>
                        <TableCell align="right">{fmtNum(data.loanDeduction)}</TableCell>
                      </TableRow>
                    )}
                    {data.deductions.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{d.name}</TableCell>
                        <TableCell align="right">{fmtNum(d.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {data.otherDeductions > 0 && (
                      <TableRow>
                        <TableCell>Other Deductions</TableCell>
                        <TableCell align="right">{fmtNum(data.otherDeductions)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                <Typography fontWeight={700}>Total Deductions</Typography>
                <Typography fontWeight={700} color="error.main">{fmtNum(data.totalDeductions)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Net Salary Summary */}
      <Card sx={{ mt: 3, background: 'linear-gradient(135deg, #2E6B4A 0%, #4CAF50 100%)', color: '#fff' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3 }}>
          <Typography variant="h6" fontWeight={600}>Net Salary (Take Home)</Typography>
          <Typography variant="h4" fontWeight={700}>{fmtNum(data.netSalary)}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
