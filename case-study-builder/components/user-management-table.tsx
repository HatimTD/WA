'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, UserCog, Trash2, Shield, Award, Monitor, Megaphone, Eye, ChevronDown, Check, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

// All roles defined in Prisma schema
const ALL_ROLES = ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'] as const;
type RoleType = typeof ALL_ROLES[number];

// Role display configuration
const ROLE_CONFIG: Record<string, { label: string; icon?: React.ReactNode; color: string; bgColor: string }> = {
  VIEWER: { label: 'Viewer', icon: <Eye className="h-3 w-3" />, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  CONTRIBUTOR: { label: 'Contributor', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  APPROVER: { label: 'Approver', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  ADMIN: { label: 'Admin', icon: <Shield className="h-3 w-3" />, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  IT_DEPARTMENT: { label: 'IT Dept', icon: <Monitor className="h-3 w-3" />, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  MARKETING: { label: 'Marketing', icon: <Megaphone className="h-3 w-3" />, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
};

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  roles?: string[]; // Multiple roles
  region: string | null;
  totalPoints: number;
  caseCount: number;
  createdAt: string;
};

type Props = {
  users: User[];
};

// WA Regions for dropdown
const WA_REGIONS = [
  'CORPORATE',
  'EUROPE',
  'NORTH AMERICA',
  'SOUTH AMERICA',
  'ASIA PACIFIC',
  'MIDDLE EAST',
  'AFRICA',
];

export default function UserManagementTable({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Create user dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CONTRIBUTOR' as string,
    region: '',
  });

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Get user's current roles (from roles array or fall back to single role)
  const waGetUserRoles = (user: User): string[] => {
    if (user.roles && user.roles.length > 0) {
      return user.roles;
    }
    return [user.role];
  };

  const handleRolesChange = async (userId: string, newRoles: string[]) => {
    if (newRoles.length === 0) {
      toast.error('User must have at least one role');
      return;
    }

    setIsUpdating(userId);
    try {
      const response = await fetch('/api/admin/update-user-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roles: newRoles }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state with multiple roles
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, roles: newRoles, role: newRoles[0] } : u))
        );
        toast.success(`User roles updated: ${newRoles.map(r => ROLE_CONFIG[r]?.label || r).join(', ')}`);
      } else {
        toast.error(result.error || 'Failed to update roles');
      }
    } catch (error) {
      console.error('[UserManagement] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  const waToggleRole = (userId: string, role: string, currentRoles: string[]) => {
    const isSelected = currentRoles.includes(role);
    const newRoles = isSelected
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    handleRolesChange(userId, newRoles);
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

  const waHandleCreateUser = async () => {
    // Validate email
    if (!newUserData.email || !newUserData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password if provided
    if (newUserData.password && newUserData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserData.name || null,
          email: newUserData.email,
          password: newUserData.password || null,
          role: newUserData.role,
          region: newUserData.region || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add new user to local state
        setUsers((prev) => [result.user, ...prev]);
        const loginMethod = newUserData.password ? 'email/password' : 'Google OAuth';
        toast.success(`User ${result.user.email} created. They can log in via ${loginMethod}.`);

        // Reset form and close dialog
        setNewUserData({ name: '', email: '', password: '', role: 'CONTRIBUTOR', region: '' });
        setIsCreateDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('[UserManagement] Create error:', error);
      toast.error('An error occurred while creating the user');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="dark:bg-card dark:border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <UserCog className="h-5 w-5 text-wa-green-600 dark:text-primary" />
              All Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground mt-1">
              View and manage user accounts and permissions
            </CardDescription>
          </div>

          {/* Add User Button & Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-wa-green-600 hover:bg-wa-green-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] dark:bg-card dark:border-border">
              <DialogHeader>
                <DialogTitle className="dark:text-foreground">Create New User</DialogTitle>
                <DialogDescription className="dark:text-muted-foreground">
                  Add a new user to the system. They will be able to log in with their email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="name" className="dark:text-foreground">Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    className="dark:bg-input dark:border-border dark:text-foreground"
                  />
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="dark:text-foreground">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@weldingalloys.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="dark:bg-input dark:border-border dark:text-foreground"
                    required
                  />
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password" className="dark:text-foreground">
                    Password <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave empty for Google login only"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="dark:bg-input dark:border-border dark:text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a password for email/password login, or leave empty if user will login with Google.
                  </p>
                </div>

                {/* Role */}
                <div className="grid gap-2">
                  <Label htmlFor="role" className="dark:text-foreground">Role</Label>
                  <Select
                    value={newUserData.role}
                    onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border">
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

                {/* Region */}
                <div className="grid gap-2">
                  <Label htmlFor="region" className="dark:text-foreground">Region</Label>
                  <Select
                    value={newUserData.region || 'NONE'}
                    onValueChange={(value) => setNewUserData({ ...newUserData, region: value === 'NONE' ? '' : value })}
                  >
                    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                      <SelectValue placeholder="Select a region (optional)" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-popover dark:border-border">
                      <SelectItem value="NONE">No region</SelectItem>
                      {WA_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                  className="dark:bg-input dark:border-border dark:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={waHandleCreateUser}
                  disabled={isCreating || !newUserData.email}
                  className="bg-wa-green-600 hover:bg-wa-green-700 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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

                    {/* Multi-Role Selector */}
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-auto min-w-[140px] justify-between dark:bg-input dark:border-border dark:text-foreground"
                            disabled={isUpdating === user.id}
                          >
                            <div className="flex flex-wrap gap-1">
                              {waGetUserRoles(user).slice(0, 2).map((role) => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded ${ROLE_CONFIG[role]?.bgColor} ${ROLE_CONFIG[role]?.color}`}
                                >
                                  {ROLE_CONFIG[role]?.icon}
                                  {ROLE_CONFIG[role]?.label || role}
                                </span>
                              ))}
                              {waGetUserRoles(user).length > 2 && (
                                <span className="text-xs text-muted-foreground">+{waGetUserRoles(user).length - 2}</span>
                              )}
                            </div>
                            {isUpdating === user.id ? (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 dark:bg-popover dark:border-border" align="start">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground mb-2 px-2">Select multiple roles:</p>
                            {ALL_ROLES.map((role) => {
                              const userRoles = waGetUserRoles(user);
                              const isSelected = userRoles.includes(role);
                              return (
                                <button
                                  key={role}
                                  onClick={() => waToggleRole(user.id, role, userRoles)}
                                  disabled={isUpdating === user.id}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left ${
                                    isSelected ? 'bg-accent' : ''
                                  }`}
                                >
                                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                                    isSelected ? 'bg-primary border-primary' : 'border-input'
                                  }`}>
                                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <div className={`flex items-center gap-1.5 ${ROLE_CONFIG[role]?.color || ''}`}>
                                    {ROLE_CONFIG[role]?.icon}
                                    <span className="text-sm">{ROLE_CONFIG[role]?.label || role}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
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
