'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from './notification-bell';
import { ThemeToggle } from './theme-toggle';

interface TopBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onToggleSidebar: () => void;
  onToggleMobileMenu?: () => void;
  isCollapsed: boolean;
}

export function TopBar({ user, onToggleSidebar, onToggleMobileMenu, isCollapsed }: TopBarProps) {
  return (
    <div
      className={`fixed top-0 right-0 h-16 lg:h-20 bg-white dark:bg-card border-b border-gray-200 dark:border-border z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-64'
      }`}
    >
      {/* Left side - Hamburger menus */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Mobile hamburger - only visible on mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobileMenu}
          className="lg:hidden hover:bg-wa-green-50 dark:hover:bg-background"
          aria-label="Open mobile menu"
        >
          <Menu className="h-6 w-6 text-gray-700 dark:text-foreground" />
        </Button>

        {/* Desktop hamburger - only visible on desktop for sidebar collapse */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hidden lg:flex hover:bg-wa-green-50 dark:hover:bg-background lg:h-12 lg:w-12"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6 lg:h-7 lg:w-7 text-gray-700 dark:text-foreground" />
        </Button>
      </div>

      {/* Right side - Theme toggle, notification bell and user info */}
      <div className="flex items-center gap-3 lg:gap-5">
        <ThemeToggle />
        <NotificationBell />

        <div className="flex items-center gap-2 lg:gap-3">
          <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
            <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
            <AvatarFallback className="bg-wa-green-100 text-wa-green-900 dark:bg-accent dark:text-primary text-sm lg:text-base">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm lg:text-base font-medium text-gray-700 dark:text-foreground hidden md:block">
            {user.name}
          </span>
        </div>
      </div>
    </div>
  );
}
