'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wrench,
  Mail,
  Bell,
  Megaphone,
  Loader2,
  Save,
  RefreshCw,
  Upload,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  waToggleMaintenanceMode,
  waUpdateMaintenanceMessage,
  waGetMaintenanceMode,
  waGetEmailTemplates,
  waUpsertEmailTemplate,
  waInitializeDefaultTemplates,
  waGetNotificationStats,
  waEnableGlobalNotifications,
  waDisableGlobalNotifications,
  waToggleSpecificNotification,
  waUpdateAnnouncement,
  waGetAnnouncement,
} from '@/lib/actions/waSystemSettingsActions';
import { EmailTemplateType } from '@prisma/client';
import { EmailTemplateEditor } from '@/components/email-template-editor';

export default function SystemSettingsForm() {
  const [activeTab, setActiveTab] = useState('maintenance');
  const [loading, setLoading] = useState(false);

  // Maintenance Mode State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Email Templates State
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType | null>(null);
  const [templateData, setTemplateData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    logoUrl: '',
    isActive: true,
  });

  // Notification Stats State
  const [notificationStats, setNotificationStats] = useState({
    totalUsers: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    usersWithEmail: 0,
  });

  // Notification Settings State (simplified for UI feedback)
  const [notificationSettings, setNotificationSettings] = useState({
    emailCaseApproval: true,
    emailCaseRejection: true,
    emailNewComment: true,
    emailBadgeEarned: true,
    inAppCaseApproval: true,
    inAppCaseRejection: true,
    inAppNewComment: true,
    inAppBadgeEarned: true,
  });

  // Announcement State
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  // Load initial data
  useEffect(() => {
    loadMaintenanceMode();
    loadEmailTemplates();
    loadNotificationStats();
    loadAnnouncement();
  }, []);

  const loadMaintenanceMode = async () => {
    const data = await waGetMaintenanceMode();
    setMaintenanceEnabled(data.enabled);
    setMaintenanceMessage(data.message);
  };

  const loadEmailTemplates = async () => {
    const result = await waGetEmailTemplates();
    if (result.success) {
      setEmailTemplates(result.templates);
    }
  };

  const loadNotificationStats = async () => {
    const result = await waGetNotificationStats();
    if (result.success) {
      setNotificationStats(result.stats);
    }
  };

  const loadAnnouncement = async () => {
    const data = await waGetAnnouncement();
    setAnnouncementEnabled(data.enabled);
    setAnnouncementTitle(data.title);
    setAnnouncementMessage(data.message);
    setAnnouncementType(data.type);
  };

  // Maintenance Mode Handlers
  const handleToggleMaintenance = async () => {
    setLoading(true);
    const result = await waToggleMaintenanceMode(!maintenanceEnabled);
    if (result.success) {
      setMaintenanceEnabled(!maintenanceEnabled);
      toast.success(`Maintenance mode ${!maintenanceEnabled ? 'enabled' : 'disabled'}`);
    } else {
      toast.error(result.error || 'Failed to toggle maintenance mode');
    }
    setLoading(false);
  };

  const handleUpdateMaintenanceMessage = async () => {
    setLoading(true);
    const result = await waUpdateMaintenanceMessage(maintenanceMessage);
    if (result.success) {
      toast.success('Maintenance message updated');
    } else {
      toast.error(result.error || 'Failed to update message');
    }
    setLoading(false);
  };

  // Email Template Handlers
  const handleSelectTemplate = (type: EmailTemplateType) => {
    setSelectedTemplate(type);
    const template = emailTemplates.find((t) => t.type === type);
    if (template) {
      setTemplateData({
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || '',
        logoUrl: template.logoUrl || '',
        isActive: template.isActive,
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    const result = await waUpsertEmailTemplate({
      type: selectedTemplate,
      ...templateData,
      variables: getAvailableVariables(selectedTemplate),
    });

    if (result.success) {
      toast.success('Email template saved');
      await loadEmailTemplates();
    } else {
      toast.error(result.error || 'Failed to save template');
    }
    setLoading(false);
  };

  const handleInitializeTemplates = async () => {
    setLoading(true);
    const result = await waInitializeDefaultTemplates();
    if (result.success) {
      toast.success('Default templates initialized');
      await loadEmailTemplates();
    } else {
      toast.error(result.error || 'Failed to initialize templates');
    }
    setLoading(false);
  };

  const getAvailableVariables = (type: EmailTemplateType): string[] => {
    const baseVars = ['userName', 'link', 'logoUrl'];
    const typeVars: Record<EmailTemplateType, string[]> = {
      CASE_APPROVED: ['caseTitle'],
      CASE_REJECTED: ['caseTitle', 'rejectionReason'],
      NEW_COMMENT: ['caseTitle', 'commenterName', 'commentPreview'],
      BADGE_EARNED: ['badgeName', 'badgeDescription'],
      BHAG_MILESTONE: ['milestone', 'currentCount', 'targetCount'],
      WELCOME: [],
      SYSTEM_ANNOUNCEMENT: ['announcementTitle', 'announcementMessage'],
    };
    return [...baseVars, ...(typeVars[type] || [])];
  };

  // Global Notification Handlers
  const handleToggleGlobalNotifications = async (type: 'email' | 'inApp' | 'all', enable: boolean) => {
    setLoading(true);
    const result = enable
      ? await waEnableGlobalNotifications(type)
      : await waDisableGlobalNotifications(type);

    if (result.success) {
      toast.success(`${type} notifications ${enable ? 'enabled' : 'disabled'} for all users`);
      await loadNotificationStats();
    } else {
      toast.error(result.error || 'Failed to update notifications');
    }
    setLoading(false);
  };

  // Specific Notification Type Handler
  const handleToggleSpecificNotification = async (notificationType: string, enable: boolean) => {
    setLoading(true);
    const result = await waToggleSpecificNotification(notificationType, enable);

    if (result.success) {
      const typeLabel = notificationType.replace(/([A-Z])/g, ' $1').trim();
      toast.success(`${typeLabel} ${enable ? 'enabled' : 'disabled'} for all users`);
      await loadNotificationStats();
    } else {
      toast.error(result.error || 'Failed to update notification');
    }
    setLoading(false);
  };

  // Announcement Handlers
  const handleSaveAnnouncement = async () => {
    setLoading(true);
    const result = await waUpdateAnnouncement({
      enabled: announcementEnabled,
      title: announcementTitle,
      message: announcementMessage,
      type: announcementType,
    });

    if (result.success) {
      toast.success('Announcement updated');
    } else {
      toast.error(result.error || 'Failed to update announcement');
    }
    setLoading(false);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="maintenance" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Maintenance
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Templates
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="announcement" className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          Announcement
        </TabsTrigger>
      </TabsList>

      {/* Maintenance Mode Tab */}
      <TabsContent value="maintenance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>
              Enable maintenance mode to prevent non-admin users from accessing the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="maintenance-toggle" className="text-base font-semibold">
                  {maintenanceEnabled ? 'Maintenance Mode Active' : 'Maintenance Mode Inactive'}
                </Label>
                <p className="text-sm text-gray-600">
                  {maintenanceEnabled
                    ? 'Only admins can access the site'
                    : 'All users can access the site normally'}
                </p>
              </div>
              <Switch
                id="maintenance-toggle"
                checked={maintenanceEnabled}
                onCheckedChange={handleToggleMaintenance}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="maintenance-message">Maintenance Message</Label>
              <Textarea
                id="maintenance-message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                rows={4}
                placeholder="Enter the message to display during maintenance..."
                className="resize-none"
              />
              <Button onClick={handleUpdateMaintenanceMessage} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Update Message
              </Button>
            </div>

            {maintenanceEnabled && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Maintenance mode is currently active. Non-admin users cannot access the application.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Email Templates Tab */}
      <TabsContent value="email" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Customize email notification templates with logo and branding
                </CardDescription>
              </div>
              <Button onClick={handleInitializeTemplates} variant="outline" disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Initialize Defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Select Template</Label>
              <Select
                value={selectedTemplate || ''}
                onValueChange={(value) => handleSelectTemplate(value as EmailTemplateType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template to edit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASE_APPROVED">Case Approved</SelectItem>
                  <SelectItem value="CASE_REJECTED">Case Rejected</SelectItem>
                  <SelectItem value="NEW_COMMENT">New Comment</SelectItem>
                  <SelectItem value="BADGE_EARNED">Badge Earned</SelectItem>
                  <SelectItem value="BHAG_MILESTONE">BHAG Milestone</SelectItem>
                  <SelectItem value="WELCOME">Welcome Email</SelectItem>
                  <SelectItem value="SYSTEM_ANNOUNCEMENT">System Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-subject">Email Subject</Label>
                  <Input
                    id="template-subject"
                    value={templateData.subject}
                    onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-logo">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="template-logo"
                      value={templateData.logoUrl}
                      onChange={(e) => setTemplateData({ ...templateData, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-html">Email Content</Label>
                  <EmailTemplateEditor
                    value={templateData.htmlContent}
                    onChange={(html) => setTemplateData({ ...templateData, htmlContent: html })}
                    variables={getAvailableVariables(selectedTemplate)}
                    templateType={selectedTemplate}
                    logoUrl={templateData.logoUrl}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-text">Plain Text Content (optional)</Label>
                  <Textarea
                    id="template-text"
                    value={templateData.textContent}
                    onChange={(e) => setTemplateData({ ...templateData, textContent: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="template-active"
                      checked={templateData.isActive}
                      onCheckedChange={(checked) =>
                        setTemplateData({ ...templateData, isActive: checked })
                      }
                    />
                    <Label htmlFor="template-active">Template Active</Label>
                  </div>

                  <Button onClick={handleSaveTemplate} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            )}

            {emailTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No email templates configured</p>
                <p className="text-sm">Click &quot;Initialize Defaults&quot; to create default templates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Global Notifications Tab */}
      <TabsContent value="notifications" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Global Notification Management</CardTitle>
            <CardDescription>
              Manage notification settings for all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl">{notificationStats.totalUsers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Notifications</CardDescription>
                  <CardTitle className="text-3xl">{notificationStats.totalNotifications}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Unread</CardDescription>
                  <CardTitle className="text-3xl text-wa-green-600">
                    {notificationStats.unreadNotifications}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Users with Email</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {notificationStats.usersWithEmail}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Bulk Controls */}
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold">Bulk Notification Controls</h3>
                <p className="text-sm text-gray-600">
                  Enable or disable all notifications at once
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Email Notifications</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleGlobalNotifications('email', true)}
                        disabled={loading}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Enable All
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleGlobalNotifications('email', false)}
                        disabled={loading}
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>In-App Notifications</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleGlobalNotifications('inApp', true)}
                        disabled={loading}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Enable All
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleGlobalNotifications('inApp', false)}
                        disabled={loading}
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>All Notifications</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleGlobalNotifications('all', true)}
                        disabled={loading}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Enable All
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleGlobalNotifications('all', false)}
                        disabled={loading}
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    Warning: These actions will override individual user preferences for all users.
                  </p>
                </div>
              </div>

              {/* Individual Notification Type Controls */}
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold">Individual Notification Type Controls</h3>
                <p className="text-sm text-gray-600">
                  Enable or disable specific notification types for all users
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-sm">Notification Type</th>
                        <th className="text-center py-3 px-2 font-medium text-sm">Email</th>
                        <th className="text-center py-3 px-2 font-medium text-sm">In-App</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-sm">Case Approval</p>
                            <p className="text-xs text-gray-500">Notify when a case is approved</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.emailCaseApproval}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, emailCaseApproval: checked})
                                handleToggleSpecificNotification('caseApprovalNotif', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.emailCaseApproval ? "default" : "secondary"}>
                              {notificationSettings.emailCaseApproval ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.inAppCaseApproval}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, inAppCaseApproval: checked})
                                handleToggleSpecificNotification('inAppCaseApproval', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.inAppCaseApproval ? "default" : "secondary"}>
                              {notificationSettings.inAppCaseApproval ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-sm">Case Rejection</p>
                            <p className="text-xs text-gray-500">Notify when a case is rejected</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.emailCaseRejection}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, emailCaseRejection: checked})
                                handleToggleSpecificNotification('caseRejectionNotif', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.emailCaseRejection ? "default" : "secondary"}>
                              {notificationSettings.emailCaseRejection ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.inAppCaseRejection}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, inAppCaseRejection: checked})
                                handleToggleSpecificNotification('inAppCaseRejection', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.inAppCaseRejection ? "default" : "secondary"}>
                              {notificationSettings.inAppCaseRejection ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-sm">New Comment</p>
                            <p className="text-xs text-gray-500">Notify when someone comments on a case</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.emailNewComment}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, emailNewComment: checked})
                                handleToggleSpecificNotification('newCommentNotif', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.emailNewComment ? "default" : "secondary"}>
                              {notificationSettings.emailNewComment ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.inAppNewComment}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, inAppNewComment: checked})
                                handleToggleSpecificNotification('inAppNewComment', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.inAppNewComment ? "default" : "secondary"}>
                              {notificationSettings.inAppNewComment ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-sm">Badge Earned</p>
                            <p className="text-xs text-gray-500">Notify when a user earns a badge</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.emailBadgeEarned}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, emailBadgeEarned: checked})
                                handleToggleSpecificNotification('bhagMilestones', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.emailBadgeEarned ? "default" : "secondary"}>
                              {notificationSettings.emailBadgeEarned ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-3">
                            <Switch
                              checked={notificationSettings.inAppBadgeEarned}
                              onCheckedChange={(checked) => {
                                setNotificationSettings({...notificationSettings, inAppBadgeEarned: checked})
                                handleToggleSpecificNotification('inAppBhagMilestones', checked)
                              }}
                              disabled={loading}
                            />
                            <Badge variant={notificationSettings.inAppBadgeEarned ? "default" : "secondary"}>
                              {notificationSettings.inAppBadgeEarned ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-2 p-3 bg-wa-green-50 border border-wa-green-200 rounded-lg">
                  <Bell className="h-5 w-5 text-wa-green-600 flex-shrink-0" />
                  <p className="text-sm text-wa-green-800">
                    These controls will enable or disable specific notification types for all users.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Announcement Banner Tab */}
      <TabsContent value="announcement" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Announcement Banner</CardTitle>
            <CardDescription>
              Display an announcement banner to all users across the site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="announcement-toggle" className="text-base font-semibold">
                  {announcementEnabled ? 'Announcement Active' : 'Announcement Inactive'}
                </Label>
                <p className="text-sm text-gray-600">
                  {announcementEnabled
                    ? 'Banner is visible to all users'
                    : 'Banner is hidden from users'}
                </p>
              </div>
              <Switch
                id="announcement-toggle"
                checked={announcementEnabled}
                onCheckedChange={setAnnouncementEnabled}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="announcement-type">Banner Type</Label>
              <Select value={announcementType} onValueChange={(value: any) => setAnnouncementType(value)}>
                <SelectTrigger id="announcement-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (Green)</SelectItem>
                  <SelectItem value="warning">Warning (Yellow)</SelectItem>
                  <SelectItem value="error">Error (Red)</SelectItem>
                  <SelectItem value="success">Success (Green)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="announcement-title">Title (optional)</Label>
              <Input
                id="announcement-title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Important Announcement"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                rows={3}
                placeholder="Enter your announcement message..."
                className="resize-none"
              />
            </div>

            <Button onClick={handleSaveAnnouncement} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Announcement
            </Button>

            {announcementEnabled && announcementMessage && (
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className={`
                  ${announcementType === 'info' ? 'bg-wa-green-50 border-wa-green-200 text-wa-green-900' : ''}
                  ${announcementType === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' : ''}
                  ${announcementType === 'error' ? 'bg-red-50 border-red-200 text-red-900' : ''}
                  ${announcementType === 'success' ? 'bg-green-50 border-green-200 text-green-900' : ''}
                  border p-4 rounded-lg
                `}>
                  {announcementTitle && (
                    <p className="font-semibold text-sm mb-1">{announcementTitle}</p>
                  )}
                  <p className="text-sm">{announcementMessage}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
