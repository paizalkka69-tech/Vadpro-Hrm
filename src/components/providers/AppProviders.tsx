'use client';
import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { store } from '@/store/store';
import { createAppTheme } from '@/theme/theme';
import { I18nProvider, useI18n } from '@/i18n/context';

// Inner component that uses the i18n context for RTL
function ThemedApp({ children }: { children: React.ReactNode }) {
  const { dir } = useI18n();

  const theme = useMemo(() => createAppTheme(dir), [dir]);

  const emotionCache = useMemo(() =>
    createCache({
      key: dir === 'rtl' ? 'muirtl' : 'mui',
      prepend: true,
      stylisPlugins: dir === 'rtl' ? [prefixer, rtlPlugin] : [prefixer],
    }),
  [dir]);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: dir === 'rtl' ? 'left' : 'right' }}>
            {children}
          </SnackbarProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <I18nProvider>
        <ThemedApp>{children}</ThemedApp>
      </I18nProvider>
    </Provider>
  );
}
