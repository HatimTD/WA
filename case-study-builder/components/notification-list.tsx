'use client';

import { useState, useEffect } from 'react';
import { Check, CheckCheck, Trash2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  waGetRecentNotifications,
  waMarkNotificationAsRead,
  waMarkAllNotificationsAsRead,
  waDeleteNotification,
} from '@/lib/actions/waNotificationActions';
import { Notification } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface NotificationListProps {
  onUpdate?: () => void;
  onClose?: () => void;
}

export function NotificationList({ onUpdate, onClose }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    const data = await waGetRecentNotifications(20);
    setNotifications(data);
    setLoading(false);
  }

  async function handleMarkAsRead(notificationId: string, link?: string | null) {
    await waMarkNotificationAsRead(notificationId);
    await loadNotifications();
    onUpdate?.();

    if (link) {
      onClose?.(); // Close dropdown before navigating
      router.push(link);
    }
  }

  async function handleMarkAllAsRead() {
    await waMarkAllNotificationsAsRead();
    await loadNotifications();
    onUpdate?.();
  }

  async function handleDelete(notificationId: string, e: React.MouseEvent) {
    e.stopPropagation();
    await waDeleteNotification(notificationId);
    await loadNotifications();
    onUpdate?.();
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      CASE_APPROVED: '✅',
      CASE_REJECTED: '❌',
      NEW_COMMENT: '💬',
      BADGE_EARNED: '🏆',
      BHAG_MILESTONE: '🎯',
    };
    return icons[type] || '🔔';
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No notifications yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[500px]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Notifications</h3>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="h-8 text-xs"
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="overflow-y-auto divide-y">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`group relative p-4 hover:bg-accent cursor-pointer transition-colors ${
              !notification.read ? 'bg-accent/50' : ''
            }`}
            onClick={() =>
              handleMarkAsRead(notification.id, notification.link)
            }
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{notification.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {getRelativeTime(notification.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-wa-green-500" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(notification.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
