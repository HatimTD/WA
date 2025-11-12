'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BadgeDisplay from '@/components/badge-display';
import { Badge as BadgeType } from '@prisma/client';

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    totalPoints?: number;
    badges?: BadgeType[];
  };
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/new', label: 'New Case Study', icon: Plus, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN'] },
  { href: '/dashboard/my-cases', label: 'My Cases', icon: FileText, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN'] },
  { href: '/dashboard/saved', label: 'Saved Cases', icon: Bookmark },
  { href: '/dashboard/library', label: 'Library', icon: BookOpen },
  { href: '/dashboard/search', label: 'Search Database', icon: Search, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN'] },
  { href: '/dashboard/compare', label: 'Compare Cases', icon: GitCompare },
  { href: '/dashboard/approvals', label: 'Approvals', icon: CheckCircle, roles: ['APPROVER', 'ADMIN'] },
  { href: '/dashboard/analytics', label: 'My Analytics', icon: TrendingUp, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN'] },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/bhag', label: 'BHAG Tracker', icon: BarChart },
  { href: '/dashboard/diagnostics', label: 'Diagnostics', icon: Stethoscope, roles: ['CONTRIBUTOR', 'APPROVER', 'ADMIN'] },
  { href: '/dashboard/admin', label: 'Admin Dashboard', icon: Shield, roles: ['ADMIN'] },
  { href: '/dashboard/admin/users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/admin/config', label: 'System Config', icon: Sliders, roles: ['ADMIN'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user.role || '');
  });

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          CS Builder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welding Alloys</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <p className="font-medium text-sm truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {user.role}
          </Badge>
          {user.role !== 'VIEWER' && (
            <Badge variant="default" className="text-xs">
              {user.totalPoints || 0} pts
            </Badge>
          )}
        </div>
        {user.badges && user.badges.length > 0 && user.role !== 'VIEWER' && (
          <div className="pt-1">
            <BadgeDisplay badges={user.badges} size="sm" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
