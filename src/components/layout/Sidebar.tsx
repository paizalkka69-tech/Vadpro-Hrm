'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Box, Typography, Collapse, InputBase, Avatar,
} from '@mui/material';
import { ExpandLess, ExpandMore, Search as SearchIcon } from '@mui/icons-material';
import {
  Dashboard as DashboardIcon, People as PeopleIcon, Business as BusinessIcon,
  AccountTree as AccountTreeIcon, Badge as BadgeIcon, Workspaces as WorkspacesIcon,
  Grade as GradeIcon, Category as CategoryIcon, AccessTime as AccessTimeIcon,
  EventBusy as EventBusyIcon, Payments as PaymentsIcon, Description as DescriptionIcon,
  Gavel as GavelIcon, RequestQuote as LoanIcon, Calculate as EOSIcon,
  HealthAndSafety as InsuranceIcon, Summarize as ReportsIcon, Settings as SettingsIcon,
  Person as PersonIcon,
  AccountBalance as SalaryIcon, WorkOutline as ContractIcon,
  Shield as GosiIcon, MonetizationOn as AdvanceIcon,
  Schedule as OvertimeIcon, Mail as LetterIcon,
  Warning as WarningIcon, Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useI18n } from '@/i18n/context';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { usePermissions } from '@/hooks/usePermissions';
import { vadproColors } from '@/theme/theme';

const DRAWER_WIDTH = 260;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

type MenuItem = { text: string; icon: React.ReactNode; path: string; module?: string } | { divider: true; label?: string };

// Group menu items by divider labels for collapsible sections
function CollapsibleMenu({ menuItems, pathname, router }: { menuItems: MenuItem[]; pathname: string; router: ReturnType<typeof useRouter> }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups(prev => {
      const isOpening = !prev[label];
      // Close all others, open only the clicked one
      const next: Record<string, boolean> = {};
      if (isOpening) next[label] = true;
      return next;
    });
  }, []);

  // Split items into groups: items before first divider are ungrouped, then each divider starts a group
  const groups: { label: string | null; items: MenuItem[] }[] = [];
  let current: { label: string | null; items: MenuItem[] } = { label: null, items: [] };

  for (const item of menuItems) {
    if ('divider' in item && item.label) {
      if (current.items.length > 0 || current.label) groups.push(current);
      current = { label: item.label, items: [] };
    } else if (!('divider' in item)) {
      current.items.push(item);
    }
  }
  if (current.items.length > 0 || current.label) groups.push(current);

  // Auto-open the group containing the active page
  const activeGroup = groups.find(g => g.label && g.items.some(item =>
    !('divider' in item) && (pathname === item.path || (item.path !== '/' && item.path !== '/self-service' && pathname.startsWith(item.path)))
  ));
  if (activeGroup?.label && Object.keys(openGroups).length === 0 && activeGroup.label) {
    openGroups[activeGroup.label] = true;
  }

  return (
    <List sx={{ px: 1, py: 0.5, overflowY: 'auto', flex: 1 }}>
      {groups.map((group, gi) => {
        if (!group.label) {
          // Ungrouped items (dashboard, profile, etc.) — always visible
          return group.items.map((item, ii) => {
            if ('divider' in item) return null;
            return (
              <ListItemButton
                key={item.path}
                selected={pathname === item.path || (item.path !== '/' && item.path !== '/self-service' && pathname.startsWith(item.path))}
                onClick={() => router.push(item.path)}
                sx={{ borderRadius: 1, mb: 0.25, py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.85rem' }} />
              </ListItemButton>
            );
          });
        }

        // Collapsible group
        const isOpen = !!openGroups[group.label];
        const hasActive = group.items.some(item =>
          !('divider' in item) && (pathname === item.path || (item.path !== '/' && item.path !== '/self-service' && pathname.startsWith(item.path)))
        );

        return (
          <Box key={group.label}>
            <ListItemButton
              onClick={() => toggleGroup(group.label!)}
              sx={{
                borderRadius: 2,
                py: 0.5,
                px: 1.5,
                mb: 0.25,
                mx: 1,
                bgcolor: 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <ListItemText
                primary={group.label}
                primaryTypographyProps={{
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1.2, color: hasActive ? '#FFFFFF' : 'rgba(184, 212, 200, 0.7)',
                }}
              />
              {isOpen ? <ExpandLess sx={{ fontSize: 18, color: 'rgba(184, 212, 200, 0.7)' }} /> : <ExpandMore sx={{ fontSize: 18, color: 'rgba(184, 212, 200, 0.7)' }} />}
            </ListItemButton>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {group.items.map((item) => {
                  if ('divider' in item) return null;
                  return (
                    <ListItemButton
                      key={item.path}
                      selected={pathname === item.path || (item.path !== '/' && item.path !== '/self-service' && pathname.startsWith(item.path))}
                      onClick={() => router.push(item.path)}
                      sx={{ borderRadius: 1, mb: 0.2, py: 0.4, pl: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        );
      })}
    </List>
  );
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, dir } = useI18n();
  const user = useSelector((s: RootState) => s.auth.user);

  const isEmployee = user?.role === 'Employee';
  const { canModule, isSuperAdmin } = usePermissions();

  const selfServiceItems: MenuItem[] = [
    { text: 'My Dashboard', icon: <DashboardIcon />, path: '/self-service' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/self-service/profile' },
    { divider: true, label: 'Leave & Attendance' },
    { text: 'My Leave', icon: <EventBusyIcon />, path: '/self-service/leave' },
    { text: 'My Attendance', icon: <AccessTimeIcon />, path: '/self-service/attendance' },
    { text: 'Overtime Request', icon: <OvertimeIcon />, path: '/self-service/overtime' },
    { divider: true, label: 'Payroll & Finance' },
    { text: 'My Payslips', icon: <PaymentsIcon />, path: '/self-service/payslips' },
    { text: 'Salary Structure', icon: <SalaryIcon />, path: '/self-service/salary' },
    { text: 'My Loans', icon: <LoanIcon />, path: '/self-service/loans' },
    { text: 'My Advances', icon: <AdvanceIcon />, path: '/self-service/advances' },
    { divider: true, label: 'Employment' },
    { text: 'My Contract', icon: <ContractIcon />, path: '/self-service/contract' },
    { text: 'My GOSI', icon: <GosiIcon />, path: '/self-service/gosi' },
    { text: 'EOS Estimate', icon: <EOSIcon />, path: '/self-service/eos' },
    { text: 'My Documents', icon: <DescriptionIcon />, path: '/self-service/documents' },
    { divider: true, label: 'Requests & Others' },
    { text: 'Letter Request', icon: <LetterIcon />, path: '/self-service/letters' },
    { text: 'My Warnings', icon: <WarningIcon />, path: '/self-service/warnings' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/self-service/notifications' },
  ];

  const adminItems: MenuItem[] = [
    { text: t.nav.dashboard, icon: <DashboardIcon />, path: '/' },
    { text: t.nav.employees, icon: <PeopleIcon />, path: '/employees', module: 'Employees' },
    { divider: true, label: t.nav.organization },
    { text: t.nav.branches, icon: <BusinessIcon />, path: '/organization/branches', module: 'Organization' },
    { text: t.nav.departments, icon: <AccountTreeIcon />, path: '/organization/departments', module: 'Organization' },
    { text: t.nav.designations, icon: <BadgeIcon />, path: '/organization/designations', module: 'Organization' },
    { text: t.nav.sections, icon: <WorkspacesIcon />, path: '/organization/sections', module: 'Organization' },
    { text: t.nav.grades, icon: <GradeIcon />, path: '/organization/grades', module: 'Organization' },
    { text: t.nav.categories, icon: <CategoryIcon />, path: '/organization/categories', module: 'Organization' },
    { divider: true, label: t.nav.operations },
    { text: t.nav.attendance, icon: <AccessTimeIcon />, path: '/attendance', module: 'Attendance' },
    { text: t.nav.leave, icon: <EventBusyIcon />, path: '/leave', module: 'Leave' },
    { text: t.nav.documents, icon: <DescriptionIcon />, path: '/documents', module: 'Documents' },
    { text: t.nav.contracts, icon: <GavelIcon />, path: '/contracts', module: 'Contracts' },
    { divider: true, label: t.nav.finance },
    { text: t.nav.payroll, icon: <PaymentsIcon />, path: '/payroll', module: 'Payroll' },
    { text: t.nav.loans, icon: <LoanIcon />, path: '/loans', module: 'Payroll' },
    { text: t.nav.eos, icon: <EOSIcon />, path: '/eos', module: 'EOS' },
    { text: t.nav.insurance, icon: <InsuranceIcon />, path: '/insurance', module: 'Insurance' },
    { divider: true, label: t.nav.system },
    { text: t.nav.reports, icon: <ReportsIcon />, path: '/reports', module: 'Reports' },
    { text: t.nav.settings, icon: <SettingsIcon />, path: '/settings', module: 'Settings' },
  ];

  // Filter admin items by permissions (SuperAdmin sees all)
  const filteredAdminItems = isSuperAdmin ? adminItems : adminItems.filter((item) => {
    if ('divider' in item) return true; // keep dividers, we'll clean up empty sections
    if (!item.module) return true; // no module restriction (e.g., dashboard)
    return canModule(item.module);
  });

  // Admin sees admin menu + ESS. Employee sees ESS only.
  const menuItems = isEmployee
    ? selfServiceItems
    : [...filteredAdminItems, { divider: true, label: 'Employee Self-Service' } as MenuItem, ...selfServiceItems];

  const [search, setSearch] = useState('');

  const filteredMenuItems = useMemo(() => {
    if (!search.trim()) return menuItems;
    const q = search.toLowerCase();
    return menuItems.filter(item => {
      if ('divider' in item) return true;
      return item.text.toLowerCase().includes(q);
    });
  }, [menuItems, search]);

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: vadproColors.sidebarBg,
          color: vadproColors.sidebarText,
          borderRight: 'none',
          overflowX: 'hidden',
        },
      }}
    >
      {/* ─── Logo Header ─── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2.5 }}>
        <Avatar
          sx={{
            bgcolor: '#4CAF50',
            color: '#FFFFFF',
            width: 44,
            height: 44,
            borderRadius: 2,
            fontWeight: 800,
            fontSize: '1.4rem',
            fontFamily: 'var(--font-poppins), sans-serif',
          }}
        >
          V
        </Avatar>
        <Box>
          <Typography sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1, letterSpacing: '0.02em', fontFamily: 'var(--font-poppins), sans-serif' }}>
            {t.app.name || 'VADPRO'}
          </Typography>
          <Typography sx={{ color: vadproColors.sidebarText, fontSize: '0.72rem', fontWeight: 500, opacity: 0.85, mt: 0.2 }}>
            HR Management
          </Typography>
        </Box>
      </Box>

      {/* ─── Search Bar ─── */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: vadproColors.sidebarSearchBg,
            borderRadius: 2,
            px: 1.5,
            py: 0.9,
          }}
        >
          <SearchIcon sx={{ color: vadproColors.sidebarText, fontSize: 18 }} />
          <InputBase
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              color: '#FFFFFF',
              fontSize: '0.85rem',
              '& input::placeholder': { color: vadproColors.sidebarText, opacity: 1 },
            }}
          />
        </Box>
      </Box>

      <CollapsibleMenu menuItems={filteredMenuItems} pathname={pathname} router={router} />
    </Drawer>
  );
}

export { DRAWER_WIDTH };
