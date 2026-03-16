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
import { User, Settings, Download, Bell, Shield, Camera, Eye, Monitor, Megaphone, Building, Globe, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';

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
  totalPoints: number;
};

type Subsidiary = {
  id: string;
  name: string;
  region: string;
  source: string;
  assignedAt: string;
};

type NetSuiteEmployee = {
  netsuiteInternalId: string;
  email: string | null;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  phone: string | null;
  subsidiarynohierarchy: string | null;
  subsidiarynohierarchyname: string | null;
  department: string | null;
  location: string | null;
  syncedAt: Date;
};

type Props = {
  user: UserData;
  subsidiaries?: Subsidiary[];
  regions?: string[];
  netsuiteEmployee?: NetSuiteEmployee | null;
};

export default function SettingsForm({
  user,
  subsidiaries = [],
  regions = [],
  netsuiteEmployee = null,
}: Props) {
  const router = useRouter();
  const { setTheme: setNextTheme } = useTheme();
  const [name, setName] = useState(user.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
        body: JSON.stringify({ name }),
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

          {/* Region is computed from assigned subsidiaries */}

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

      {/* Organisation Information */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Building className="h-5 w-5 text-wa-green-600 dark:text-primary" />
            Organisation Information
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Your subsidiary and region assignments
            {netsuiteEmployee && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <BadgeCheck className="h-3 w-3" />
                Synced from NetSuite
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Name (from NetSuite if synced) */}
          {netsuiteEmployee && (
            <div className="space-y-2">
              <Label className="dark:text-foreground">Full Name (NetSuite)</Label>
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-300 rounded-md text-sm font-medium border border-blue-200 dark:border-blue-700">
                {[
                  netsuiteEmployee.firstname,
                  netsuiteEmployee.middlename,
                  netsuiteEmployee.lastname,
                ]
                  .filter(Boolean)
                  .join(' ') || 'Not available'}
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                This name is synced from your NetSuite employee record
              </p>
            </div>
          )}

          {/* Department and Location (from NetSuite) */}
          {netsuiteEmployee && (netsuiteEmployee.department || netsuiteEmployee.location) && (
            <div className="grid grid-cols-2 gap-4">
              {netsuiteEmployee.department && (
                <div className="space-y-2">
                  <Label className="dark:text-foreground">Department</Label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm border border-gray-200 dark:border-gray-700">
                    {netsuiteEmployee.department}
                  </div>
                </div>
              )}
              {netsuiteEmployee.location && (
                <div className="space-y-2">
                  <Label className="dark:text-foreground">Location</Label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm border border-gray-200 dark:border-gray-700">
                    {netsuiteEmployee.location}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assigned Subsidiaries */}
          <div className="space-y-2">
            <Label className="dark:text-foreground">Assigned Subsidiaries</Label>
            {subsidiaries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                No subsidiaries assigned. Contact an administrator.
              </p>
            ) : (
              <div className="space-y-2">
                {subsidiaries.map((subsidiary) => (
                  <div
                    key={subsidiary.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-sm border ${
                      subsidiary.source === 'NETSUITE'
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{subsidiary.name}</div>
                        <div className="text-xs opacity-70 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {subsidiary.region}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {subsidiary.source === 'NETSUITE' ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-medium">
                          Synced from NetSuite
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                          Manually Assigned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Your subsidiaries are managed by administrators. NetSuite-synced assignments cannot be removed.
            </p>
          </div>

          {/* Computed Regions */}
          <div className="space-y-2">
            <Label className="dark:text-foreground">Regions</Label>
            {regions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                No regions (based on subsidiaries)
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <span
                    key={region}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-wa-green-100 dark:bg-primary/20 text-wa-green-700 dark:text-primary border border-wa-green-200 dark:border-primary font-medium"
                  >
                    <Globe className="h-3 w-3" />
                    {region}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Your regions are automatically computed from your assigned subsidiaries
            </p>
          </div>

          {/* Last Sync Timestamp */}
          {netsuiteEmployee && (
            <div className="pt-4 border-t dark:border-border">
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Last synced from NetSuite:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {new Date(netsuiteEmployee.syncedAt).toLocaleDateString()} at{' '}
                  {new Date(netsuiteEmployee.syncedAt).toLocaleTimeString()}
                </span>
              </p>
            </div>
          )}
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
            Customise your viewing experience
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


          <div className="pt-4">
            <Button onClick={handleSaveNotifications} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
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
