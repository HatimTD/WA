'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Wifi, WifiOff, HardDrive, Trash2, RefreshCw } from 'lucide-react';
import { getStorageEstimate, clearOfflineData, clearExpiredCache } from '@/lib/db/utils';
import { syncService } from '@/lib/sync/syncService';

interface OfflineConfig {
  enabled: boolean;
  cacheDurations: {
    databaseCases: number; // hours
    libraryContent: number; // days
    savedCases: number; // days
    analytics: number; // hours
    leaderboard: number; // hours
    staticAssets: number; // days
    images: number; // days
  };
  syncSettings: {
    autoSyncInterval: number; // seconds
    maxRetries: number;
  };
}

const DEFAULT_CONFIG: OfflineConfig = {
  enabled: true,
  cacheDurations: {
    databaseCases: 24,
    libraryContent: 7,
    savedCases: 7,
    analytics: 1,
    leaderboard: 1,
    staticAssets: 30,
    images: 30,
  },
  syncSettings: {
    autoSyncInterval: 30,
    maxRetries: 3,
  },
};

export function OfflineSettings() {
  const [config, setConfig] = useState<OfflineConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, percentage: 0 });

  useEffect(() => {
    loadConfig();
    loadStorageInfo();
  }, []);

  async function loadConfig() {
    try {
      const response = await fetch('/api/system-config/offline_config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(JSON.parse(data.config.value));
        }
      } else if (response.status === 403) {
        // User is not an admin, use default config
        console.log('[OfflineSettings] User is not admin, using default config');
      } else if (response.status === 401) {
        // User is not authenticated
        console.log('[OfflineSettings] User not authenticated');
      }
    } catch (error) {
      console.error('[OfflineSettings] Error loading config:', error);
    }
  }

  async function loadStorageInfo() {
    try {
      const info = await getStorageEstimate();
      setStorageInfo(info);
    } catch (error) {
      console.error('[OfflineSettings] Error loading storage:', error);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch('/api/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'offline_config',
          value: JSON.stringify(config),
        }),
      });

      if (response.ok) {
        toast.success('Offline settings saved successfully');

        // Reload service worker with new config
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_CONFIG',
            config,
          });
        }
      } else {
        toast.error('Failed to save offline settings');
      }
    } catch (error) {
      console.error('[OfflineSettings] Save error:', error);
      toast.error('Failed to save offline settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCache() {
    if (!confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await clearOfflineData();
      await loadStorageInfo();
      toast.success('Offline cache cleared successfully');
    } catch (error) {
      console.error('[OfflineSettings] Clear error:', error);
      toast.error('Failed to clear offline cache');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearExpired() {
    setLoading(true);
    try {
      await clearExpiredCache();
      await loadStorageInfo();
      toast.success('Expired cache cleared successfully');
    } catch (error) {
      console.error('[OfflineSettings] Clear expired error:', error);
      toast.error('Failed to clear expired cache');
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncNow() {
    setLoading(true);
    try {
      const result = await syncService.syncAll();
      if (result.success) {
        toast.success(`Synced ${result.synced} changes successfully`);
      } else {
        toast.warning(`Synced ${result.synced} changes with ${result.errors} errors`);
      }
    } catch (error) {
      console.error('[OfflineSettings] Sync error:', error);
      toast.error('Failed to sync offline changes');
    } finally {
      setLoading(false);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Offline Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {config.enabled ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            Offline Mode
          </CardTitle>
          <CardDescription>
            Enable or disable offline functionality for all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Offline Mode</Label>
              <p className="text-sm text-muted-foreground">
                Users can access content and sync changes when offline
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Cache Duration Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Duration Settings</CardTitle>
          <CardDescription>
            Configure how long different types of data are cached offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="databaseCases">Database Cases (hours)</Label>
              <Input
                id="databaseCases"
                type="number"
                min="1"
                value={config.cacheDurations.databaseCases}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cacheDurations: {
                      ...config.cacheDurations,
                      databaseCases: parseInt(e.target.value) || 24,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="libraryContent">Library Content (days)</Label>
              <Input
                id="libraryContent"
                type="number"
                min="1"
                value={config.cacheDurations.libraryContent}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cacheDurations: {
                      ...config.cacheDurations,
                      libraryContent: parseInt(e.target.value) || 7,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="savedCases">Saved Cases (days)</Label>
              <Input
                id="savedCases"
                type="number"
                min="1"
                value={config.cacheDurations.savedCases}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cacheDurations: {
                      ...config.cacheDurations,
                      savedCases: parseInt(e.target.value) || 7,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="analytics">Analytics (hours)</Label>
              <Input
                id="analytics"
                type="number"
                min="1"
                value={config.cacheDurations.analytics}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cacheDurations: {
                      ...config.cacheDurations,
                      analytics: parseInt(e.target.value) || 1,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaderboard">Leaderboard (hours)</Label>
              <Input
                id="leaderboard"
                type="number"
                min="1"
                value={config.cacheDurations.leaderboard}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cacheDurations: {
                      ...config.cacheDurations,
                      leaderboard: parseInt(e.target.value) || 1,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staticAssets">Static Assets (days)</Label>
              <Input
                id="staticAssets"
                type="number"
                min="1"
                value={config.cacheDurations.staticAssets}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cacheDurations: {
                      ...config.cacheDurations,
                      staticAssets: parseInt(e.target.value) || 30,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images (days)</Label>
              <Input
                id="images"
                type="number"
                min="1"
                value={config.cacheDurations.images}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cacheDurations: {
                      ...config.cacheDurations,
                      images: parseInt(e.target.value) || 30,
                    },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure automatic sync behavior when users come back online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="autoSyncInterval">Auto Sync Interval (seconds)</Label>
              <Input
                id="autoSyncInterval"
                type="number"
                min="10"
                value={config.syncSettings.autoSyncInterval}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    syncSettings: {
                      ...config.syncSettings,
                      autoSyncInterval: parseInt(e.target.value) || 30,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                How often to automatically sync changes when online
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries">Max Sync Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                min="1"
                max="10"
                value={config.syncSettings.maxRetries}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    syncSettings: {
                      ...config.syncSettings,
                      maxRetries: parseInt(e.target.value) || 3,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum retry attempts for failed syncs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Information
          </CardTitle>
          <CardDescription>
            View and manage offline storage usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {formatBytes(storageInfo.usage)}</span>
              <span>Quota: {formatBytes(storageInfo.quota)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-wa-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {storageInfo.percentage.toFixed(1)}% of available storage used
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearExpired}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Expired
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearCache}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStorageInfo}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Offline Settings'}
        </Button>
      </div>
    </div>
  );
}
