'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, UserCog, Trash2, Shield, Award, Monitor, Megaphone, Eye } from 'lucide-react';
import { toast } from 'sonner';

// All roles defined in Prisma schema
const ALL_ROLES = ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'] as const;

// Role display configuration
const ROLE_CONFIG: Record<string, { label: string; icon?: React.ReactNode; color: string }> = {
  VIEWER: { label: 'Viewer', icon: <Eye className="h-3 w-3" />, color: 'text-gray-500' },
  CONTRIBUTOR: { label: 'Contributor', color: 'text-green-600' },
  APPROVER: { label: 'Approver', color: 'text-blue-600' },
  ADMIN: { label: 'Admin', icon: <Shield className="h-3 w-3" />, color: 'text-purple-600' },
  IT_DEPARTMENT: { label: 'IT Department', icon: <Monitor className="h-3 w-3" />, color: 'text-orange-600' },
  MARKETING: { label: 'Marketing', icon: <Megaphone className="h-3 w-3" />, color: 'text-pink-600' },
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  region: string | null;
  totalPoints: number;
  caseCount: number;
  createdAt: string;
};

type Props = {
  users: User[];
};

export default function UserManagementTable({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId);
    try {
      const response = await fetch('/api/admin/update-user-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        toast.success(`User role updated to ${newRole}`);
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('[UserManagement] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string | null) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setIsUpdating(userId);
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success('User deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('[UserManagement] Delete error:', error);
      toast.error('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <Card className="dark:bg-card dark:border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-foreground">
          <UserCog className="h-5 w-5 text-wa-green-600 dark:text-primary" />
          All Users ({filteredUsers.length})
        </CardTitle>
        <CardDescription className="dark:text-muted-foreground">
          View and manage user accounts and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-border">
                <SelectItem value="ALL">All Roles</SelectItem>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      {ROLE_CONFIG[role]?.icon}
                      <span>{ROLE_CONFIG[role]?.label || role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="border dark:border-border rounded-lg overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="dark:bg-card">
              <TableRow className="dark:border-border">
                <TableHead className="dark:text-foreground">User</TableHead>
                <TableHead className="dark:text-foreground">Role</TableHead>
                <TableHead className="dark:text-foreground">Region</TableHead>
                <TableHead className="text-right dark:text-foreground">Points</TableHead>
                <TableHead className="text-right dark:text-foreground">Cases</TableHead>
                <TableHead className="dark:text-foreground">Joined</TableHead>
                <TableHead className="text-right dark:text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow className="dark:border-border">
                  <TableCell colSpan={7} className="text-center text-gray-500 dark:text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="dark:border-border dark:hover:bg-background">
                    {/* User Info */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-foreground">
                          {user.name || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>

                    {/* Role Selector */}
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={isUpdating === user.id}
                      >
                        <SelectTrigger className="w-40 dark:bg-input dark:border-border dark:text-foreground">
                          <div className={`flex items-center gap-2 ${ROLE_CONFIG[user.role]?.color || ''}`}>
                            {ROLE_CONFIG[user.role]?.icon}
                            <span>{ROLE_CONFIG[user.role]?.label || user.role}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-popover dark:border-border">
                          {ALL_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              <div className={`flex items-center gap-2 ${ROLE_CONFIG[role]?.color || ''}`}>
                                {ROLE_CONFIG[role]?.icon}
                                <span>{ROLE_CONFIG[role]?.label || role}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Region */}
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-muted-foreground">
                        {user.region || 'Not set'}
                      </span>
                    </TableCell>

                    {/* Points */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="font-medium text-gray-900 dark:text-foreground">
                          {user.totalPoints}
                        </span>
                      </div>
                    </TableCell>

                    {/* Case Count */}
                    <TableCell className="text-right">
                      <span className="font-medium text-gray-900 dark:text-foreground">
                        {user.caseCount}
                      </span>
                    </TableCell>

                    {/* Join Date */}
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={isUpdating === user.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-wa-green-50 dark:bg-accent border border-wa-green-200 dark:border-primary rounded-lg p-3">
            <p className="text-xs text-wa-green-600 dark:text-primary font-medium">Total</p>
            <p className="text-xl font-bold text-wa-green-900 dark:text-foreground">{users.length}</p>
          </div>
          {ALL_ROLES.map((role) => {
            const config = ROLE_CONFIG[role];
            const count = users.filter((u) => u.role === role).length;
            return (
              <div key={role} className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className={`flex items-center gap-1 text-xs font-medium ${config?.color || 'text-gray-600'}`}>
                  {config?.icon}
                  <span>{config?.label || role}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-foreground">{count}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
