'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Button" className="hover:bg-wa-green-50">
        <Sun className="h-5 w-5 text-gray-700" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon" aria-label="Button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="hover:bg-wa-green-50 dark:hover:bg-wa-green-900"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-gray-700 dark:text-gray-200 transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
