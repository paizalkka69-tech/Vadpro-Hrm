'use client';
import { createTheme } from '@mui/material/styles';

/**
 * VADPRO Brand Color Palette — Forest Green theme
 * Matches Vadpro-Dashboard (paizalkka69-tech.github.io/Vadpro-Dashboard)
 */
export const vadproColors = {
  // Core brand colors (content area buttons, primary actions)
  primary: '#2E6B4A',        // Medium forest green — matches sidebar active
  primaryLight: '#4CAF50',   // Bright green — accents, highlights
  primaryDark: '#1B3A2D',    // Deep forest green — sidebar bg, pressed states
  primarySubtle: 'rgba(46, 107, 74, 0.08)', // 8% opacity — subtle hovers

  // Accent
  accent: '#4CAF50',         // Bright green accent — icons, badges

  // Semantic
  deleteIcon: '#EF4444',     // Red — delete/trash action icons
  editIcon: '#475569',       // Slate — edit pencil icon
  viewIcon: '#2E6B4A',       // Green — view eye icon

  // Surfaces
  tableHeaderBg: '#1B3A2D',  // Deep forest green — data grid headers
  tableRowAlt: '#F8FAFC',    // Slate-50 — alternating table rows
  tableRowHover: '#F0FDF4',  // Green-50 — row hover

  // Sidebar (dark forest green — matches Vadpro-Dashboard)
  sidebarBg: '#1B3A2D',            // Deep forest green sidebar
  sidebarHoverBg: '#244D3A',       // Slightly lighter for hover
  sidebarActiveBg: '#2E6B4A',      // Medium green — active menu item
  sidebarActiveText: '#FFFFFF',
  sidebarText: '#B8D4C8',          // Soft mint — inactive menu text
  sidebarIcon: '#B8D4C8',          // Soft mint — inactive icons
  sidebarDivider: '#2A4D3D',       // Dark green divider
  sidebarSearchBg: '#244D3A',      // Search bar background

  // Breadcrumb
  breadcrumbText: '#64748B',
  breadcrumbActive: '#0F172A',

  // Page
  pageBg: '#F8FAFC',         // Slate-50 page background
  loginBg: '#F0FDF4',        // Light green tint — login page
  cardBg: '#FFFFFF',
};

export function createAppTheme(direction: 'ltr' | 'rtl') {
  return createTheme({
    direction,
    palette: {
      primary: {
        main: vadproColors.primary,
        light: vadproColors.primaryLight,
        dark: vadproColors.primaryDark,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: vadproColors.accent,
        light: '#26A69A',
        dark: '#004D40',
        contrastText: '#FFFFFF',
      },
      background: {
        default: vadproColors.pageBg,
        paper: vadproColors.cardBg,
      },
      error: { main: '#C62828' },
      warning: { main: '#FF8F00' },
      success: { main: '#2E7D32' },
      info: { main: '#0288D1' },
      text: {
        primary: '#212121',
        secondary: '#757575',
      },
      divider: '#E0E0E0',
    },
    typography: {
      fontFamily: direction === 'rtl'
        ? 'var(--font-tajawal), "Noto Sans Arabic", "Plus Jakarta Sans", system-ui, sans-serif'
        : 'var(--font-jakarta), "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontFamily: 'var(--font-poppins), "Poppins", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontFamily: 'var(--font-poppins), "Poppins", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontFamily: 'var(--font-poppins), "Poppins", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontFamily: 'var(--font-poppins), "Poppins", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontFamily: 'var(--font-poppins), "Poppins", sans-serif', fontWeight: 600 },
      h6: { fontFamily: 'var(--font-poppins), "Poppins", sans-serif', fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, letterSpacing: '0.02em' },
      body1: { fontSize: '0.95rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.6 },
      caption: { fontSize: '0.75rem', color: '#757575' },
    },
    shape: { borderRadius: 8 },
    components: {
      // ─── Buttons ───
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
          containedPrimary: {
            backgroundColor: vadproColors.primary,
            color: '#FFFFFF',
            '&:hover': { backgroundColor: vadproColors.primaryDark },
          },
          outlinedPrimary: {
            borderColor: vadproColors.primary,
            color: vadproColors.primary,
            '&:hover': {
              borderColor: vadproColors.primaryDark,
              backgroundColor: vadproColors.primarySubtle,
            },
          },
        },
      },

      // ─── CssBaseline (global styles) ───
      MuiCssBaseline: {
        styleOverrides: direction === 'rtl' ? {
          '.MuiDataGrid-root': {
            direction: 'rtl',
          },
          '.MuiDataGrid-cell': {
            textAlign: 'right',
          },
          '.MuiDataGrid-columnHeaderTitleContainer': {
            flexDirection: 'row-reverse',
          },
        } : {},
      },

      // ─── Cards ───
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
            borderRadius: 8,
          },
        },
      },

      // ─── Text Fields ───
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: vadproColors.primary,
            },
          },
          input: {
            textAlign: direction === 'rtl' ? 'right' : 'left',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            '&.Mui-focused': { color: vadproColors.primary },
            ...(direction === 'rtl' ? {
              right: 28,
              left: 'auto',
              transformOrigin: 'top right',
            } : {}),
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            textAlign: direction === 'rtl' ? 'right' : 'left',
          },
        },
      },

      // ─── Table (standard MUI Table) ───
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: vadproColors.tableHeaderBg,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              borderBottom: 'none',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': {
              backgroundColor: vadproColors.tableRowAlt,
            },
            '&:hover': {
              backgroundColor: `${vadproColors.tableRowHover} !important`,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: '0.85rem',
            padding: '10px 16px',
            borderBottom: '1px solid #E0E0E0',
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: { fontSize: '0.85rem' },
        },
      },

      // ─── AppBar (TopBar) ───
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#FFFFFF',
            color: '#424242',
            borderBottom: '1px solid #E0E0E0',
          },
        },
      },

      // ─── Chips ───
      MuiChip: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: vadproColors.primary,
            color: '#FFFFFF',
          },
          outlinedPrimary: {
            borderColor: vadproColors.primary,
            color: vadproColors.primary,
          },
        },
      },

      // ─── Breadcrumbs ───
      MuiBreadcrumbs: {
        styleOverrides: {
          root: { fontSize: '0.85rem' },
          li: {
            '& .MuiTypography-root': { fontSize: '0.85rem' },
            '& a': { color: vadproColors.breadcrumbText, textDecoration: 'none' },
            '&:last-child .MuiTypography-root': { color: vadproColors.breadcrumbActive, fontWeight: 500 },
          },
        },
      },

      // ─── Drawer (Sidebar) — Dark forest green ───
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: vadproColors.sidebarBg,
            color: vadproColors.sidebarText,
            borderRight: 'none',
            '& .MuiDivider-root': {
              borderColor: vadproColors.sidebarDivider,
            },
          },
        },
      },

      // ─── List Items (Sidebar menu) ───
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 4,
            marginLeft: 8,
            marginRight: 8,
            padding: '10px 14px',
            color: vadproColors.sidebarText,
            transition: 'all 0.15s ease',
            '& .MuiListItemIcon-root': {
              color: vadproColors.sidebarIcon,
              minWidth: 36,
            },
            '& .MuiListItemText-primary': {
              color: vadproColors.sidebarText,
              fontSize: '0.9rem',
              fontWeight: 500,
            },
            '&.Mui-selected': {
              backgroundColor: vadproColors.sidebarActiveBg,
              color: vadproColors.sidebarActiveText,
              '& .MuiListItemIcon-root': { color: vadproColors.sidebarActiveText },
              '& .MuiListItemText-primary': { color: vadproColors.sidebarActiveText, fontWeight: 600 },
              '&:hover': { backgroundColor: vadproColors.sidebarActiveBg },
            },
            '&:hover': {
              backgroundColor: vadproColors.sidebarHoverBg,
              '& .MuiListItemIcon-root': { color: '#FFFFFF' },
              '& .MuiListItemText-primary': { color: '#FFFFFF' },
            },
          },
        },
      },

      // ─── Icon Button (action icons in tables) ───
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.delete-action': { color: vadproColors.deleteIcon },
            '&.edit-action': { color: vadproColors.editIcon },
            '&.view-action': { color: vadproColors.viewIcon },
          },
        },
      },

      // ─── Tabs ───
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': { color: vadproColors.primary },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: vadproColors.primary },
        },
      },

      // ─── Dialog ───
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            textAlign: direction === 'rtl' ? 'right' : 'left',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            direction: direction,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            direction: direction,
          },
        },
      },

      // ─── Pagination ───
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: vadproColors.primary,
              color: '#FFFFFF',
              '&:hover': { backgroundColor: vadproColors.primaryDark },
            },
          },
        },
      },

      // ─── Tooltip ───
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: vadproColors.primaryDark,
            fontSize: '0.75rem',
          },
        },
      },

      // ─── Switch / Checkbox ───
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': { color: vadproColors.primary },
            '&.Mui-checked + .MuiSwitch-track': { backgroundColor: vadproColors.primaryLight },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            '&.Mui-checked': { color: vadproColors.primary },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            '&.Mui-checked': { color: vadproColors.primary },
          },
        },
      },

      // ─── FormControl Label ───
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            ...(direction === 'rtl' ? { marginLeft: 16, marginRight: -11 } : {}),
          },
        },
      },

      // ─── Autocomplete ───
      MuiAutocomplete: {
        styleOverrides: {
          input: {
            textAlign: direction === 'rtl' ? 'right' : 'left',
          },
        },
      },
    },
  });
}

// Default LTR theme for backward compatibility
const theme = createAppTheme('ltr');
export default theme;
