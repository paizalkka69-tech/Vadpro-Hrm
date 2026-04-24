'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Avatar, Chip, Paper, IconButton,
} from '@mui/material';
import {
  Person, EventBusy, Description, Payments, AccessTime, ArrowForward,
  CalendarMonth, Warning, AccountBalance, Gavel, HealthAndSafety, Calculate,
  RequestQuote, MonetizationOn, Schedule, Mail, NotificationsActive,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api, { ApiResponse } from '@/lib/api';

interface Dashboard {
  employeeCode: string; employeeName: string; departmentName: string;
  designationName: string; photoPath: string | null;
  annualLeaveBalance: number; pendingLeaveRequests: number;
  documentsExpiringIn30Days: number; lastPayslipNet: number | null;
  lastPayslipMonth: string | null; attendanceThisMonth: number;
  absentThisMonth: number; lateThisMonth: number;
}

function StatCard({ icon, label, value, sub, color, onClick }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color: string; onClick?: () => void;
}) {
  return (
    <Card sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { boxShadow: 4 } : {} }} onClick={onClick}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        {onClick && <IconButton size="small"><ArrowForward fontSize="small" /></IconButton>}
      </CardContent>
    </Card>
  );
}

export default function SelfServiceDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  useEffect(() => {
    api.get<ApiResponse<Dashboard>>('/self-service/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load dashboard', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  if (loading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
      <Grid container spacing={2}>
        {[1,2,3,4].map(i => <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}><Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} /></Grid>)}
      </Grid>
    </Box>
  );

  if (!data) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary">No employee linked to your account</Typography>
      <Typography variant="body2" color="text.secondary">Please contact HR to link your employee record.</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #2E6B4A 0%, #4CAF50 100%)', color: '#fff', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 28 }}>
            {data.employeeName?.charAt(0) || 'E'}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{data.employeeName}</Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>{data.designationName} — {data.departmentName}</Typography>
            <Chip label={data.employeeCode} size="small" sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
          </Box>
        </Box>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<EventBusy />} label="Annual Leave Balance" value={data.annualLeaveBalance}
            sub={`${data.pendingLeaveRequests} pending requests`} color="#1976d2"
            onClick={() => router.push('/self-service/leave')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<Payments />} label="Last Payslip" value={data.lastPayslipNet != null ? data.lastPayslipNet.toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}
            sub={data.lastPayslipMonth ?? 'No payslips'} color="#2e6b4a"
            onClick={() => router.push('/self-service/payslips')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<AccessTime />} label="Present This Month" value={data.attendanceThisMonth}
            sub={`${data.absentThisMonth} absent, ${data.lateThisMonth} late`} color="#ed6c02"
            onClick={() => router.push('/self-service/attendance')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<Description />} label="Documents Expiring" value={data.documentsExpiringIn30Days}
            sub="within 30 days" color={data.documentsExpiringIn30Days > 0 ? '#d32f2f' : '#757575'}
            onClick={() => router.push('/self-service/documents')} />
        </Grid>
      </Grid>

      {/* Quick Links */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Quick Actions</Typography>
      <Grid container spacing={2}>
        {[
          { icon: <Person />, label: 'My Profile', desc: 'View personal & employment details', path: '/self-service/profile' },
          { icon: <CalendarMonth />, label: 'Apply for Leave', desc: 'Submit a new leave application', path: '/self-service/leave' },
          { icon: <Payments />, label: 'View Payslips', desc: 'Download and view salary slips', path: '/self-service/payslips' },
          { icon: <AccessTime />, label: 'My Attendance', desc: 'View daily attendance records', path: '/self-service/attendance' },
          { icon: <Description />, label: 'My Documents', desc: 'Passport, visa, work permit status', path: '/self-service/documents' },
          { icon: <AccountBalance />, label: 'My Salary', desc: 'View salary structure & breakdown', path: '/self-service/salary' },
          { icon: <Gavel />, label: 'My Contract', desc: 'Contract details & expiry alerts', path: '/self-service/contract' },
          { icon: <HealthAndSafety />, label: 'GOSI Details', desc: 'GOSI contributions & YTD totals', path: '/self-service/gosi' },
          { icon: <Calculate />, label: 'EOS Estimate', desc: 'End-of-service calculation', path: '/self-service/eos' },
          { icon: <RequestQuote />, label: 'Loan Request', desc: 'View loans & request new', path: '/self-service/loans' },
          { icon: <MonetizationOn />, label: 'Advance Request', desc: 'Salary advance & recovery', path: '/self-service/advances' },
          { icon: <Schedule />, label: 'Overtime', desc: 'Submit overtime requests', path: '/self-service/overtime' },
          { icon: <Mail />, label: 'Letter Request', desc: 'Request salary cert, NOC, etc.', path: '/self-service/letters' },
          { icon: <Warning />, label: 'My Warnings', desc: 'View disciplinary warnings', path: '/self-service/warnings' },
          { icon: <NotificationsActive />, label: 'Notifications', desc: 'View all notifications', path: '/self-service/notifications' },
        ].map(item => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }, transition: '0.2s' }}
              onClick={() => router.push(item.path)}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#2E6B4A22', color: '#2E6B4A' }}>{item.icon}</Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
