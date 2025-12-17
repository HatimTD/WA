'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  FileText,
  Search,
  Trophy,
  BarChart,
  Settings,
  LogOut,
  CheckCircle,
  Plus,
  GitCompare,
  Stethoscope,
  Shield,
  Users,
  Sliders,
  TrendingUp,
  Bookmark,
  BookOpen,
  Eye,
  Monitor,
  Megaphone,
  User,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BadgeDisplay from '@/components/badge-display';
import { Badge as BadgeType } from '@prisma/client';

// Role display configuration for styling
const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  VIEWER: { label: 'Viewer', icon: <Eye className="h-3 w-3" />, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  CONTRIBUTOR: { label: 'Contributor', icon: <User className="h-3 w-3" />, color: 'text-green-600', bgColor: 'bg-green-100' },
  APPROVER: { label: 'Approver', icon: <Shield className="h-3 w-3" />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  ADMIN: { label: 'Admin', icon: <Shield className="h-3 w-3" />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  IT_DEPARTMENT: { label: 'IT Dept', icon: <Monitor className="h-3 w-3" />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  MARKETING: { label: 'Marketing', icon: <Megaphone className="h-3 w-3" />, color: 'text-pink-600', bgColor: 'bg-pink-100' },
};

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    region?: string | null;
    totalPoints?: number;
    badges?: BadgeType[];
  };
  isCollapsed: boolean;
  onNavigate?: () => void; // Callback for mobile menu close
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/new', label: 'New Case Study', icon: Plus, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN'] },
  { href: '/dashboard/bulk-import', label: 'Bulk Import', icon: Upload, roles: ['APPROVER', 'ADMIN'] },
  { href: '/dashboard/my-cases', label: 'My Cases', icon: FileText, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN'] },
  { href: '/dashboard/saved', label: 'Saved Cases', icon: Bookmark },
  { href: '/dashboard/library', label: 'Library', icon: BookOpen },
  { href: '/dashboard/search', label: 'Search Database', icon: Search, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'] },
  { href: '/dashboard/compare', label: 'Compare Cases', icon: GitCompare },
  { href: '/dashboard/approvals', label: 'Approvals', icon: CheckCircle, roles: ['APPROVER', 'ADMIN'] },
  { href: '/dashboard/analytics', label: 'My Analytics', icon: TrendingUp, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN', 'MARKETING'] },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/bhag', label: 'BHAG Tracker', icon: BarChart },
  { href: '/dashboard/diagnostics', label: 'Diagnostics', icon: Stethoscope, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT'] },
  { href: '/dashboard/admin', label: 'Admin Dashboard', icon: Shield, roles: ['ADMIN'] },
  { href: '/dashboard/admin/users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/admin/config', label: 'System Config', icon: Sliders, roles: ['ADMIN', 'IT_DEPARTMENT'] },
  { href: '/dashboard/system-settings', label: 'System Settings', icon: Settings, roles: ['ADMIN', 'IT_DEPARTMENT'] },
];

export function DashboardNav({ user, isCollapsed, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user.role || '');
  });

  return (
    <aside role="navigation" aria-label="Main navigation" className={cn(
      "flex flex-col h-screen bg-white dark:bg-card border-r border-gray-200 dark:border-border transition-all duration-300 z-30",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* TOP SECTION: Logo + Brand Name */}
      <div className="p-4 border-b border-gray-200 dark:border-border flex items-center justify-center">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 w-full">
            {/* Welding Alloys Logo */}
            <div className="w-12 h-12 flex-shrink-0">
              <img
                src="/wa-logo-48.svg"
                alt="Welding Alloys"
                className="w-full h-full"
              />
            </div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Welding Alloys
            </h1>
          </div>
        ) : (
          <div className="w-10 h-10 flex-shrink-0">
            <img
              src="/wa-logo-40.svg"
              alt="Welding Alloys"
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* MIDDLE SECTION: Navigation (flex-1 to push content down) */}
      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto py-4 px-2">
        <TooltipProvider>
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-wa-green-50 text-wa-green-900 dark:bg-accent dark:text-primary'
                      : 'text-gray-700 hover:bg-wa-green-50 hover:text-wa-green-800 dark:text-muted-foreground dark:hover:bg-background dark:hover:text-foreground',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>
        </TooltipProvider>
      </nav>

      {/* BOTTOM SECTION: User Info + Settings/Logout */}
      <div className="border-t border-gray-200 dark:border-border">
        {/* User Info - ABOVE settings */}
        {!isCollapsed ? (
          <div className="p-4 border-b border-gray-200 dark:border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                <AvatarFallback className="bg-wa-green-100 text-wa-green-900 dark:bg-accent dark:text-primary">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-gray-900 dark:text-foreground">{user.name}</p>
                {user.region && (
                  <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">{user.region}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs flex items-center gap-1",
                      ROLE_CONFIG[user.role || '']?.bgColor || 'bg-wa-green-100',
                      ROLE_CONFIG[user.role || '']?.color || 'text-wa-green-900'
                    )}
                  >
                    {ROLE_CONFIG[user.role || '']?.icon}
                    {ROLE_CONFIG[user.role || '']?.label || user.role}
                  </Badge>
                  {user.role !== 'VIEWER' && user.role !== 'IT_DEPARTMENT' && user.role !== 'MARKETING' && (
                    <Badge className="text-xs bg-wa-green-900 text-white">
                      {user.totalPoints || 0} pts
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {user.badges && user.badges.length > 0 && user.role !== 'VIEWER' && (
              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-border">
                <BadgeDisplay badges={user.badges} size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 border-b border-gray-200 dark:border-border flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                    <AvatarFallback className="bg-wa-green-100 text-wa-green-900 dark:bg-accent dark:text-primary">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div>
                    <p className="font-medium dark:text-foreground">{user.name}</p>
                    <p className={cn("text-xs flex items-center gap-1", ROLE_CONFIG[user.role || '']?.color || 'text-gray-500')}>
                      {ROLE_CONFIG[user.role || '']?.icon}
                      {ROLE_CONFIG[user.role || '']?.label || user.role}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Settings & Logout - AT BOTTOM */}
        <div className="p-2 space-y-1">
          <TooltipProvider>
            {!isCollapsed ? (
              <>
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === '/dashboard/settings'
                      ? 'bg-wa-green-50 text-wa-green-900 dark:bg-accent dark:text-primary'
                      : 'text-gray-700 hover:bg-wa-green-50 hover:text-wa-green-800 dark:text-muted-foreground dark:hover:bg-background dark:hover:text-foreground'
                  )}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                <Button variant="ghost" aria-label="Sign out" className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-700 dark:text-muted-foreground dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link                       href="/dashboard/settings"
                      className={cn(
                        'flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        pathname === '/dashboard/settings'
                          ? 'bg-wa-green-50 text-wa-green-900 dark:bg-accent dark:text-primary'
                          : 'text-gray-700 hover:bg-wa-green-50 hover:text-wa-green-800 dark:text-muted-foreground dark:hover:bg-background dark:hover:text-foreground'
                      )}
                    >
                      <Settings className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" aria-label="Sign out" className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-700 dark:text-muted-foreground dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Log Out</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
