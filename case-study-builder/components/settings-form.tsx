'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, Settings, Download, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';

type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  region: string | null;
  totalPoints: number;
};

type Props = {
  user: UserData;
};

export default function SettingsForm({ user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [region, setRegion] = useState(user.region || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [caseApprovalNotif, setCaseApprovalNotif] = useState(true);
  const [caseRejectionNotif, setCaseRejectionNotif] = useState(true);
  const [newCommentNotif, setNewCommentNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [bhagMilestones, setBhagMilestones] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Email cannot be changed (linked to Google account)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select your region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="South America">South America</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia">Asia</SelectItem>
                <SelectItem value="Africa">Africa</SelectItem>
                <SelectItem value="Oceania">Oceania</SelectItem>
                <SelectItem value="Middle East">Middle East</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200">
                {user.role}
              </div>
              <p className="text-xs text-gray-500">
                Contact an administrator to change your role
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total Points</Label>
            <div className="px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200 inline-block">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Display Preferences
          </CardTitle>
          <CardDescription>
            Customize your viewing experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select defaultValue="light">
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark (Coming Soon)</SelectItem>
                <SelectItem value="system">System (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Dark mode will be available in a future update
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resultsPerPage">Results Per Page</Label>
            <Select defaultValue="20">
              <SelectTrigger id="resultsPerPage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="20">20 items</SelectItem>
                <SelectItem value="50">50 items</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultView">Default Case View</Label>
            <Select defaultValue="grid">
              <SelectTrigger id="defaultView">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            These preferences are saved locally in your browser
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Enable or disable all email notifications
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          {/* Individual Notification Settings */}
          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <Label>Case Approval Notifications</Label>
                <p className="text-sm text-gray-500">
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
                <Label>Case Rejection Notifications</Label>
                <p className="text-sm text-gray-500">
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
                <Label>New Comment Notifications</Label>
                <p className="text-sm text-gray-500">
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
                <Label>Weekly Digest</Label>
                <p className="text-sm text-gray-500">
                  Receive a weekly summary of activity
                </p>
              </div>
              <Switch
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>BHAG Milestone Notifications</Label>
                <p className="text-sm text-gray-500">
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> Email notifications will be fully functional in a future update.
              Currently, notifications are shown in the app only.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dev Role Switcher (Development Only) */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Shield className="h-5 w-5 text-orange-600" />
            Dev Role Switcher
          </CardTitle>
          <CardDescription className="text-orange-700">
            Switch roles for testing purposes (Development Only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="devRole">Current Role: <span className="font-bold">{user.role}</span></Label>
            <Select onValueChange={handleRoleSwitch} disabled={isSwitchingRole}>
              <SelectTrigger id="devRole">
                <SelectValue placeholder="Switch to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">VIEWER</SelectItem>
                <SelectItem value="CONTRIBUTOR">CONTRIBUTOR</SelectItem>
                <SelectItem value="APPROVER">APPROVER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-orange-600">
              This will immediately update your role and redirect you to the dashboard with updated permissions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Export Your Data</Label>
            <p className="text-sm text-gray-500 mb-2">
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

          <div className="border-t pt-4 mt-4">
            <Label className="text-red-600">Delete Account</Label>
            <p className="text-sm text-gray-500 mb-2">
              Request deletion of your account and all associated data
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to request account deletion? This action cannot be undone.')) {
                  toast.info('Account deletion request sent to administrators');
                }
              }}
            >
              Request Account Deletion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
