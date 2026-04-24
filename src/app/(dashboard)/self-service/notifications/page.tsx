'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Skeleton, Chip, List, ListItem,
  ListItemText, ListItemIcon, Divider, ToggleButtonGroup, ToggleButton, TextField, MenuItem,
  IconButton, Tooltip, Badge,
} from '@mui/material';
import {
  Notifications, Circle, DoneAll, MarkEmailRead,
  Info, Warning, Error, CheckCircle,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api, { ApiResponse } from '@/lib/api';

dayjs.extend(relativeTime);

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  category: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const CATEGORIES = ['All', 'Leave', 'Payroll', 'HR', 'Document', 'System', 'Attendance'];

const typeIcon = (type: string) => {
  switch (type) {
    case 'Success': return <CheckCircle fontSize="small" color="success" />;
    case 'Warning': return <Warning fontSize="small" color="warning" />;
    case 'Error': return <Error fontSize="small" color="error" />;
    default: return <Info fontSize="small" color="info" />;
  }
};

const categoryColor = (cat: string) => {
  switch (cat) {
    case 'Leave': return 'primary';
    case 'Payroll': return 'success';
    case 'HR': return 'secondary';
    case 'Document': return 'warning';
    case 'System': return 'error';
    case 'Attendance': return 'info';
    default: return 'default';
  }
};

export default function SelfServiceNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [category, setCategory] = useState('All');
  const { enqueueSnackbar } = useSnackbar();

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filter !== 'all') params.isRead = filter === 'read' ? 'true' : 'false';
    if (category !== 'All') params.category = category;

    api.get<ApiResponse<NotificationItem[]>>('/self-service/notifications', { params })
      .then(r => setNotifications(r.data.data))
      .catch(() => enqueueSnackbar('Failed to load notifications', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [filter, category, enqueueSnackbar]);

  useEffect(() => { load(); }, [load]);

  const markAsRead = (id: number) => {
    api.put(`/self-service/notifications/${id}/read`)
      .then(() => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      })
      .catch(() => enqueueSnackbar('Failed to mark as read', { variant: 'error' }));
  };

  const markAllRead = () => {
    api.put('/self-service/notifications/read-all')
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        enqueueSnackbar('All notifications marked as read', { variant: 'success' });
      })
      .catch(() => enqueueSnackbar('Failed to mark all as read', { variant: 'error' }));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" height={72} sx={{ mb: 1, borderRadius: 1 }} />)}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={700}>My Notifications</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} unread`} size="small" color="error" />
          )}
        </Box>
        <Button variant="outlined" startIcon={<DoneAll />} onClick={markAllRead} disabled={unreadCount === 0}
          sx={{ borderColor: '#2E6B4A', color: '#2E6B4A', '&:hover': { borderColor: '#1B3A2D', bgcolor: '#2E6B4A11' } }}>
          Mark All Read
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup size="small" value={filter} exclusive
          onChange={(_, v) => { if (v) setFilter(v); }}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="unread">Unread</ToggleButton>
          <ToggleButton value="read">Read</ToggleButton>
        </ToggleButtonGroup>

        <TextField select size="small" label="Category" value={category}
          onChange={e => setCategory(e.target.value)} sx={{ minWidth: 140 }}>
          {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No notifications found</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((n, i) => (
                <Box key={n.id}>
                  <ListItem
                    sx={{
                      bgcolor: n.isRead ? 'transparent' : 'action.hover',
                      py: 1.5,
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                    secondaryAction={
                      !n.isRead ? (
                        <Tooltip title="Mark as read">
                          <IconButton edge="end" size="small" onClick={() => markAsRead(n.id)}>
                            <MarkEmailRead fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {n.isRead ? typeIcon(n.type) : (
                        <Badge variant="dot" color="error">
                          {typeIcon(n.type)}
                        </Badge>
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={n.isRead ? 400 : 600}>{n.title}</Typography>
                          <Chip label={n.category} size="small" variant="outlined"
                            color={categoryColor(n.category) as 'primary' | 'success' | 'secondary' | 'warning' | 'error' | 'info' | 'default'} />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{n.message}</Typography>
                          <Typography variant="caption" color="text.disabled">{dayjs(n.createdAt).fromNow()}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {i < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
