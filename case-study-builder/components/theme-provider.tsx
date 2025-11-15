'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: string;
  enableSystem?: boolean;
  storageKey?: string;
  value?: { [key: string]: string };
  themes?: string[];
  forcedTheme?: string;
  disableTransitionOnChange?: boolean;
};

function ThemeLoader() {
  const { setTheme } = useTheme();
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    // Only run once on mount
    if (loaded) return;

    async function loadUserTheme() {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          const savedTheme = data.displayPreferences?.theme;

          if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
            setTheme(savedTheme);
          }
        }
      } catch (error) {
        console.error('[ThemeProvider] Failed to load user theme preference:', error);
      } finally {
        setLoaded(true);
      }
    }

    loadUserTheme();
  }, [setTheme, loaded]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeLoader />
      {children}
    </NextThemesProvider>
  );
}
