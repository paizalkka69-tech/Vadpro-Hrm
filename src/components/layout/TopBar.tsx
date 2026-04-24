'use client';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Chip, Menu, MenuItem, Button,
  Badge, Popover, List, ListItemButton, ListItemText, Divider, ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon, AccountCircle, Logout as LogoutIcon, Translate as TranslateIcon,
  Notifications as NotificationsIcon, Circle as CircleIcon, DoneAll,
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { useI18n } from '@/i18n/context';
import { DRAWER_WIDTH } from './Sidebar';
import api, { ApiResponse } from '@/lib/api';

interface Notif {
  id: number; title: string; message: string; type: string;
  category: string; isRead: boolean; link: string | null;
  createdDate: string;
}

interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { locale, dir, toggleLocale, t } = useI18n();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notif[]>([]);

  const fetchUnreadCount = useCallback(() => {
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
      .then(r => setUnreadCount(r.data.data.count))
      .catch(() => {});
  }, []);

  const fetchNotifications = useCallback(() => {
    api.get<ApiResponse<Notif[]>>('/notifications', { params: { page: 1, pageSize: 10 } })
      .then(r => setNotifications(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpenNotif = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    fetchNotifications();
  };

  const handleClickNotif = (n: Notif) => {
    if (!n.isRead) {
      api.put(`/notifications/${n.id}/read`).then(() => {
        setUnreadCount(c => Math.max(0, c - 1));
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      }).catch(() => {});
    }
    if (n.link) { router.push(n.link); setNotifAnchor(null); }
  };

  const handleMarkAllRead = () => {
    api.put('/notifications/read-all').then(() => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(x => ({ ...x, isRead: true })));
    }).catch(() => {});
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
        ml: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
        transition: 'width 0.2s, margin-left 0.2s',
      }}
    >
      <Toolbar>
        {!sidebarOpen && (
          <IconButton edge="start" onClick={onToggleSidebar} sx={{ me: 2 }}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {t.app.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TranslateIcon />}
            onClick={toggleLocale}
            sx={{ minWidth: 'auto', textTransform: 'none', fontSize: '0.8rem' }}
          >
            {locale === 'en' ? 'العربية' : 'English'}
          </Button>

          {/* Notification Bell */}
          <IconButton onClick={handleOpenNotif}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Popover
            open={!!notifAnchor} anchorEl={notifAnchor}
            onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { width: 360, maxHeight: 420 } } }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
              {unreadCount > 0 && (
                <Button size="small" startIcon={<DoneAll fontSize="small" />} onClick={handleMarkAllRead}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                  Mark all read
                </Button>
              )}
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No notifications</Typography>
              </Box>
            ) : (
              <List dense sx={{ p: 0 }}>
                {notifications.map(n => (
                  <ListItemButton key={n.id} onClick={() => handleClickNotif(n)}
                    sx={{ bgcolor: n.isRead ? 'transparent' : 'action.hover', py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CircleIcon sx={{ fontSize: 8, color: n.isRead ? 'transparent' : 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={n.title}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{n.message}</Typography>
                          <Typography variant="caption" color="text.secondary">{timeAgo(n.createdDate)}</Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: n.isRead ? 400 : 600, noWrap: true }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Popover>

          <Chip label={user?.role || 'User'} size="small" color="primary" variant="outlined" />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <AccountCircle />
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.fullName}</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ me: 1 }} /> {t.auth.logout}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
