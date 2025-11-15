'use client';

import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { getAnnouncement } from '@/lib/actions/system-settings-actions';

interface Announcement {
  enabled: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      const data = await getAnnouncement();
      if (data.enabled) {
        setAnnouncement(data);

        // Check if user has dismissed this announcement
        const dismissedKey = `announcement_dismissed_${data.title}_${data.message}`;
        const isDismissed = localStorage.getItem(dismissedKey);
        setDismissed(!!isDismissed);
      }
    }

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      const dismissedKey = `announcement_dismissed_${announcement.title}_${announcement.message}`;
      localStorage.setItem(dismissedKey, 'true');
      setDismissed(true);
    }
  };

  if (!announcement || !announcement.enabled || dismissed) {
    return null;
  }

  const getStyles = () => {
    switch (announcement.type) {
      case 'info':
        return {
          bg: 'bg-wa-green-50 border-wa-green-200',
          text: 'text-wa-green-900',
          icon: <Info className="h-5 w-5 text-wa-green-600" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-900',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-900',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        };
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-900',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-900',
          icon: <Info className="h-5 w-5 text-gray-600" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.bg} border-b ${styles.text} px-4 py-3`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">{styles.icon}</div>
            <div className="flex-1">
              {announcement.title && (
                <p className="font-semibold text-sm">{announcement.title}</p>
              )}
              <p className="text-sm">{announcement.message}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors ${styles.text}`}
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
