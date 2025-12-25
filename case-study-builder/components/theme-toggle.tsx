'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  // Use resolvedTheme to get the actual applied theme (not 'system')
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" className="hover:bg-wa-green-50">
        <Sun className="h-5 w-5 text-gray-700" />
      </Button>
    );
  }

  // Toggle based on resolvedTheme (actual applied theme, not 'system')
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="hover:bg-wa-green-50 dark:hover:bg-wa-green-900"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-gray-700 dark:text-gray-200 transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
