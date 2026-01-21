'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, Download, Bell, Shield, Camera, Eye, Monitor, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { WA_REGIONS } from '@/lib/constants/waRegions';

// All roles from Prisma schema
const ALL_ROLES = ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'] as const;

// Role display configuration
const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  VIEWER: { label: 'Viewer', icon: <Eye className="h-3 w-3" />, color: 'text-gray-600' },
  CONTRIBUTOR: { label: 'Contributor', icon: <User className="h-3 w-3" />, color: 'text-green-600' },
  APPROVER: { label: 'Approver', icon: <Shield className="h-3 w-3" />, color: 'text-blue-600' },
  ADMIN: { label: 'Admin', icon: <Shield className="h-3 w-3" />, color: 'text-purple-600' },
  IT_DEPARTMENT: { label: 'IT Department', icon: <Monitor className="h-3 w-3" />, color: 'text-orange-600' },
  MARKETING: { label: 'Marketing', icon: <Megaphone className="h-3 w-3" />, color: 'text-pink-600' },
};

type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  region: string | null;
  totalPoints: number;
};

type Props = {
  user: UserData;
  assignedRoles?: string[];
};

export default function SettingsForm({ user, assignedRoles = [] }: Props) {
  const router = useRouter();
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme();
  const [name, setName] = useState(user.name || '');
  const [region, setRegion] = useState(user.region || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState(user.image || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification preferences
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Email notification controls
  const [caseApprovalNotif, setCaseApprovalNotif] = useState(true);
  const [caseRejectionNotif, setCaseRejectionNotif] = useState(true);
  const [newCommentNotif, setNewCommentNotif] = useState(true);
  const [bhagMilestones, setBhagMilestones] = useState(true);

  // In-app notification controls
  const [inAppCaseApproval, setInAppCaseApproval] = useState(true);
  const [inAppCaseRejection, setInAppCaseRejection] = useState(true);
  const [inAppNewComment, setInAppNewComment] = useState(true);
  const [inAppBhagMilestones, setInAppBhagMilestones] = useState(true);

  // Display preferences
  const [themePreference, setThemePreference] = useState('system');
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [defaultView, setDefaultView] = useState('grid');

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const response = await fetch('/api/user/preferences');
      if (response.ok) {
        const data = await response.json();

        // Load notification preferences
        const notifPrefs = data.notificationPreferences || {};
        setInAppNotifications(notifPrefs.inAppNotifications ?? true);
        setEmailNotifications(notifPrefs.emailNotifications ?? true);

        // Email notification preferences
        setCaseApprovalNotif(notifPrefs.caseApprovalNotif ?? true);
        setCaseRejectionNotif(notifPrefs.caseRejectionNotif ?? true);
        setNewCommentNotif(notifPrefs.newCommentNotif ?? true);
        setBhagMilestones(notifPrefs.bhagMilestones ?? true);

        // In-app notification preferences
        setInAppCaseApproval(notifPrefs.inAppCaseApproval ?? true);
        setInAppCaseRejection(notifPrefs.inAppCaseRejection ?? true);
        setInAppNewComment(notifPrefs.inAppNewComment ?? true);
        setInAppBhagMilestones(notifPrefs.inAppBhagMilestones ?? true);

        // Load display preferences
        const displayPrefs = data.displayPreferences || {};
        const savedTheme = displayPrefs.theme || 'system';
        setThemePreference(savedTheme);
        setResultsPerPage(displayPrefs.resultsPerPage || 10);
        setDefaultView(displayPrefs.defaultView || 'grid');
      }
    } catch (error) {
      console.error('[Settings] Failed to load preferences:', error);
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, region }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Profile updated successfully!');
        // Refresh the page to update sidebar and all server components
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('[Settings] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const notificationPreferences = {
        inAppNotifications,
        emailNotifications,
        // Email notification preferences
        caseApprovalNotif,
        caseRejectionNotif,
        newCommentNotif,
        bhagMilestones,
        // In-app notification preferences
        inAppCaseApproval,
        inAppCaseRejection,
        inAppNewComment,
        inAppBhagMilestones,
      };

      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences }),
      });

      if (response.ok) {
        toast.success('Notification preferences saved!');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('[Settings] Save notification preferences error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDisplay = async () => {
    setIsSaving(true);
    try {
      const displayPreferences = {
        theme: themePreference,
        resultsPerPage,
        defaultView,
      };

      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayPreferences }),
      });

      if (response.ok) {
        // Apply the theme immediately
        setNextTheme(themePreference);
        toast.success('Display preferences saved!');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('[Settings] Save display preferences error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleSwitch = async (newRole: string) => {
    if (!confirm(`Switch to ${newRole} role? This is for development testing only.`)) {
      return;
    }

    setIsSwitchingRole(true);
    try {
      const response = await fetch('/api/dev/switch-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Switched to ${newRole} role! Redirecting...`);
        // Redirect to dashboard after role switch
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        toast.error(result.error || 'Failed to switch role');
      }
    } catch (error) {
      console.error('[Settings] Role switch error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // Handle multi-role toggle (add/remove roles)
  const waHandleMultiRoleToggle = async (role: string) => {
    const currentRoles = [...assignedRoles];
    const isSelected = currentRoles.includes(role);

    let newRoles: string[];
    if (isSelected) {
      // Remove role (but ensure at least one role remains)
      newRoles = currentRoles.filter(r => r !== role);
      if (newRoles.length === 0) {
        toast.error('You must have at least one role');
        return;
      }
    } else {
      // Add role
      newRoles = [...currentRoles, role];
    }

    setIsSwitchingRole(true);
    try {
      const response = await fetch('/api/dev/switch-role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: newRoles }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Roles updated: ${newRoles.map(r => ROLE_CONFIG[r]?.label || r).join(', ')}`);
        // Refresh page to update permissions
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update roles');
      }
    } catch (error) {
      console.error('[Settings] Multi-role toggle error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/user/export-data');
      const data = await response.json();

      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-case-studies-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('[Settings] Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // GDPR Article 17 - Right to Erasure
  const handleGdprDeletionRequest = async () => {
    if (!confirm('Are you sure you want to request account deletion? This will initiate the GDPR data deletion process. You will receive a verification email to confirm your request.')) {
      return;
    }

    setIsRequestingDeletion(true);
    try {
      const response = await fetch('/api/gdpr/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          'Deletion request submitted! Please check your email for verification instructions.',
          { duration: 6000 }
        );
        // In development, show the verification token
        if (process.env.NODE_ENV === 'development' && data.verificationToken) {
          console.log('[GDPR] Verification token (dev only):', data.verificationToken);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit deletion request');
      }
    } catch (error) {
      console.error('[Settings] GDPR deletion request error:', error);
      toast.error('Failed to submit deletion request. Please try again.');
    } finally {
      setIsRequestingDeletion(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.url) {
        setAvatarUrl(result.url);
        toast.success('Profile picture updated successfully!');
        // Refresh to update all components with new avatar
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('[Settings] Avatar upload error:', error);
      toast.error('An error occurred while uploading');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <User className="h-5 w-5 text-wa-green-600 dark:text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Upload Section */}
          <div className="space-y-2">
            <Label className="dark:text-foreground">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt={user.name || 'User'} />
                <AvatarFallback className="bg-wa-green-100 text-wa-green-900 text-2xl dark:bg-accent dark:text-primary">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {isUploadingAvatar ? 'Uploading...' : 'Change Picture'}
                </Button>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  JPG, PNG or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-gray-50 dark:bg-gray-800 dark:border-border dark:text-foreground"
            />
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Email cannot be changed (linked to Google account)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="dark:text-foreground">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region" className="dark:text-foreground">Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region" className="dark:bg-input dark:border-border dark:text-foreground">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-border">
                {WA_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-foreground">Role</Label>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-2 rounded-md text-sm font-medium border flex items-center gap-2 ${
                ROLE_CONFIG[user.role]?.color || 'text-wa-green-700'
              } ${
                user.role === 'VIEWER' ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' :
                user.role === 'CONTRIBUTOR' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                user.role === 'APPROVER' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' :
                user.role === 'ADMIN' ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700' :
                user.role === 'IT_DEPARTMENT' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700' :
                user.role === 'MARKETING' ? 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-700' :
                'bg-wa-green-50 border-wa-green-200 dark:bg-accent dark:border-primary'
              }`}>
                {ROLE_CONFIG[user.role]?.icon}
                {ROLE_CONFIG[user.role]?.label || user.role}
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Contact an administrator to change your role
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="dark:text-foreground">Total Points</Label>
            <div className="px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200 inline-block dark:bg-accent dark:text-primary dark:border-primary">
              {user.totalPoints} points
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Settings className="h-5 w-5 text-wa-green-600 dark:text-primary" />
            Display Preferences
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Customize your viewing experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme" className="dark:text-foreground">Theme</Label>
            <Select value={themePreference} onValueChange={setThemePreference}>
              <SelectTrigger id="theme" className="dark:bg-input dark:border-border dark:text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-border">
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Choose your preferred theme. System will match your device settings.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resultsPerPage" className="dark:text-foreground">Results Per Page</Label>
            <Select value={resultsPerPage.toString()} onValueChange={(v) => setResultsPerPage(parseInt(v))}>
              <SelectTrigger id="resultsPerPage" className="dark:bg-input dark:border-border dark:text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-border">
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="20">20 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultView" className="dark:text-foreground">Default Case View</Label>
            <Select value={defaultView} onValueChange={setDefaultView}>
              <SelectTrigger id="defaultView" className="dark:bg-input dark:border-border dark:text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-border">
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveDisplay} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Display Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Bell className="h-5 w-5 text-wa-green-600 dark:text-primary" />
            Notifications
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master In-App Toggle */}
          <div className="flex items-center justify-between p-4 bg-wa-green-50 rounded-lg border-2 border-wa-green-200 dark:bg-accent dark:border-primary">
            <div>
              <Label className="text-base font-semibold dark:text-foreground">In-App Notifications</Label>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                Show notification bell and alerts within the application
              </p>
            </div>
            <Switch
              checked={inAppNotifications}
              onCheckedChange={setInAppNotifications}
            />
          </div>

          {/* Individual In-App Notification Settings */}
          <div className="space-y-4 pl-4 border-l-2 border-wa-green-200 dark:border-primary">
            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">Case Approval Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Show in-app notification when your case study is approved
                </p>
              </div>
              <Switch
                checked={inAppCaseApproval}
                onCheckedChange={setInAppCaseApproval}
                disabled={!inAppNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">Case Rejection Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Show in-app notification when your case study needs revisions
                </p>
              </div>
              <Switch
                checked={inAppCaseRejection}
                onCheckedChange={setInAppCaseRejection}
                disabled={!inAppNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">New Comment Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Show in-app notification when someone comments on your cases
                </p>
              </div>
              <Switch
                checked={inAppNewComment}
                onCheckedChange={setInAppNewComment}
                disabled={!inAppNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">BHAG Milestone Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Show in-app notification when BHAG milestones are reached
                </p>
              </div>
              <Switch
                checked={inAppBhagMilestones}
                onCheckedChange={setInAppBhagMilestones}
                disabled={!inAppNotifications}
              />
            </div>
          </div>

          {/* Master Email Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 dark:bg-gray-800 dark:border-border">
            <div>
              <Label className="text-base font-semibold dark:text-foreground">Email Notifications</Label>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          {/* Individual Notification Settings */}
          <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">Case Approval Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Get notified when your case study is approved
                </p>
              </div>
              <Switch
                checked={caseApprovalNotif}
                onCheckedChange={setCaseApprovalNotif}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">Case Rejection Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Get notified when your case study needs revisions
                </p>
              </div>
              <Switch
                checked={caseRejectionNotif}
                onCheckedChange={setCaseRejectionNotif}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">New Comment Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Get notified when someone comments on your cases
                </p>
              </div>
              <Switch
                checked={newCommentNotif}
                onCheckedChange={setNewCommentNotif}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-foreground">BHAG Milestone Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                  Get notified when BHAG milestones are reached
                </p>
              </div>
              <Switch
                checked={bhagMilestones}
                onCheckedChange={setBhagMilestones}
                disabled={!emailNotifications}
              />
            </div>
          </div>

          <div className="bg-wa-green-50 border border-wa-green-200 rounded-lg p-4 dark:bg-accent dark:border-primary dark:text-foreground">
            <p className="text-sm text-wa-green-800 dark:text-foreground">
              <span className="font-semibold">Note:</span> Email notifications require the RESEND_API_KEY to be configured in your environment variables.
              Contact your administrator if you're not receiving email notifications.
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveNotifications} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dev Role Switcher (Development Only) - Multi-Select */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-400">
            <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Dev Role Switcher
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            Select multiple roles to have combined permissions (Development Only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="dark:text-orange-300">
              Current Roles: {assignedRoles.length > 0 ? (
                <span className="flex flex-wrap gap-1 mt-1">
                  {assignedRoles.map((role) => (
                    <span key={role} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                      role === 'APPROVER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      role === 'CONTRIBUTOR' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {ROLE_CONFIG[role]?.icon}
                      {ROLE_CONFIG[role]?.label || role}
                    </span>
                  ))}
                </span>
              ) : (
                <span className={`font-bold ${ROLE_CONFIG[user.role]?.color || ''}`}>
                  {ROLE_CONFIG[user.role]?.label || user.role}
                </span>
              )}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_ROLES.map((role) => {
                const isSelected = assignedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => waHandleMultiRoleToggle(role)}
                    disabled={isSwitchingRole}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all ${
                      isSelected
                        ? 'border-orange-400 bg-orange-100 dark:bg-orange-900/40 dark:border-orange-600'
                        : 'border-orange-200 bg-white dark:bg-orange-950/20 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-orange-500 border-orange-500' : 'border-orange-300 dark:border-orange-600'
                    }`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div className={`flex items-center gap-1 ${ROLE_CONFIG[role]?.color || ''}`}>
                      {ROLE_CONFIG[role]?.icon}
                      <span>{ROLE_CONFIG[role]?.label || role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Select multiple roles to have combined permissions. Changes are saved immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Download className="h-5 w-5 text-wa-green-600 dark:text-primary" />
            Data & Privacy
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-foreground">Export Your Data</Label>
            <p className="text-sm text-gray-500 mb-2 dark:text-muted-foreground">
              Download all your case studies as a JSON file
            </p>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export My Cases'}
            </Button>
          </div>

          <div className="border-t pt-4 mt-4 dark:border-border">
            <Label className="text-red-600 dark:text-red-400">Delete Account</Label>
            <p className="text-sm text-gray-500 mb-2 dark:text-muted-foreground">
              Request deletion of your account and all associated data
            </p>
            <Button
              variant="destructive"
              onClick={handleGdprDeletionRequest}
              disabled={isRequestingDeletion}
            >
              {isRequestingDeletion ? 'Submitting Request...' : 'Request Account Deletion'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
