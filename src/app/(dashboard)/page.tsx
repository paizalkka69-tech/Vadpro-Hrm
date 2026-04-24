'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import {
  People as PeopleIcon, CheckCircle as PresentIcon,
  EventBusy as LeaveIcon, PersonOff as AbsentIcon,
  TrendingUp as NewHiresIcon,
} from '@mui/icons-material';
import api, { ApiResponse } from '@/lib/api';
import { DashboardStats } from '@/types';

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ bgcolor: color + '20', borderRadius: 1.5, p: 1, display: 'flex' }}>
          <Box sx={{ color, fontSize: '1.25rem', display: 'flex' }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ p: 3 }}>{[1,2,3,4].map(i => <Skeleton key={i} height={100} sx={{ mb: 2 }} />)}</Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Dashboard</Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Box sx={{ flex: 1 }}><StatCard title="Total Employees" value={stats?.totalEmployees || 0} icon={<PeopleIcon />} color="#2E6B4A" /></Box>
        <Box sx={{ flex: 1 }}><StatCard title="Present Today" value={stats?.presentToday || 0} icon={<PresentIcon />} color="#2E6B4A" /></Box>
        <Box sx={{ flex: 1 }}><StatCard title="On Leave" value={stats?.onLeaveToday || 0} icon={<LeaveIcon />} color="#FF8F00" /></Box>
        <Box sx={{ flex: 1 }}><StatCard title="Absent" value={stats?.absentToday || 0} icon={<AbsentIcon />} color="#D32F2F" /></Box>
        <Box sx={{ flex: 1 }}><StatCard title="Active" value={stats?.activeEmployees || 0} icon={<PeopleIcon />} color="#00897B" /></Box>
        <Box sx={{ flex: 1 }}><StatCard title="New Hires" value={stats?.newHiresThisMonth || 0} icon={<NewHiresIcon />} color="#7B1FA2" /></Box>
      </Box>

      {stats?.departmentDistribution && stats.departmentDistribution.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Department Distribution</Typography>
            {stats.departmentDistribution.map((dept, idx) => (
              <Box key={dept.departmentName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, px: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: idx % 2 === 0 ? '#FAFAFA' : 'transparent', borderRadius: 0.5 }}>
                <Typography variant="body2">{dept.departmentName}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: Math.max(dept.count * 30, 20), height: 8, bgcolor: 'primary.main', borderRadius: 1 }} />
                  <Typography variant="body2" fontWeight={600}>{dept.count}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
