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
import { Search, UserCog, Trash2, Shield, Award } from 'lucide-react';
import { toast } from 'sonner';

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
                <SelectItem value="CONTRIBUTOR">CONTRIBUTOR</SelectItem>
                <SelectItem value="APPROVER">APPROVER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
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
                        <SelectTrigger className="w-36 dark:bg-input dark:border-border dark:text-foreground">
                          <div className="flex items-center gap-2">
                            {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-popover dark:border-border">
                          <SelectItem value="CONTRIBUTOR">CONTRIBUTOR</SelectItem>
                          <SelectItem value="APPROVER">APPROVER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-wa-green-50 dark:bg-accent border border-wa-green-200 dark:border-primary rounded-lg p-4">
            <p className="text-sm text-wa-green-600 dark:text-primary font-medium">Total Users</p>
            <p className="text-2xl font-bold text-wa-green-900 dark:text-foreground">{users.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Contributors</p>
            <p className="text-2xl font-bold text-green-900 dark:text-foreground">
              {users.filter((u) => u.role === 'CONTRIBUTOR').length}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Approvers + Admins</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-foreground">
              {users.filter((u) => u.role === 'APPROVER' || u.role === 'ADMIN').length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
