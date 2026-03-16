'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Database,
  Users,
  Package,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  dataSource?: string;
  dataSourceStatus?: {
    configured: string;
    activeSource: string;
    netsuiteConfigured: boolean;
    mockData: {
      customers: number;
      items: number;
    };
  };
  debugInfo?: {
    timestamp: string;
    method: string;
    url: string;
    status?: number;
    headers?: any;
  };
}

export default function NetSuiteTestPanel() {
  const [testType, setTestType] = useState<'customer' | 'item'>('customer');
  const [specificId, setSpecificId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [dataSourceStatus, setDataSourceStatus] = useState<any>(null);

  // Check configuration status
  const checkConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/netsuite/check-config');
      const data = await response.json();
      setConfigStatus(data);

      if (!data.configured) {
        toast.error('NetSuite credentials not configured');
      } else {
        toast.success('NetSuite credentials configured');
      }
    } catch (error) {
      console.error('Config check error:', error);
      toast.error('Failed to check configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Test RESTlet connection
  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const params = new URLSearchParams({
        type: testType,
        ...(specificId && { id: specificId }),
      });

      const response = await fetch(`/api/admin/netsuite/test?${params}`);
      const data = await response.json();

      setTestResult(data);

      // Update data source status from test result
      if (data.dataSourceStatus) {
        setDataSourceStatus(data.dataSourceStatus);
      }

      if (data.success) {
        toast.success(`Connection successful! Using ${data.dataSource || 'unknown'} data source.`);
      } else {
        toast.error(`Connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      const errorResult: TestResult = {
        success: false,
        message: 'Request failed',
        error: (error as Error).message,
      };
      setTestResult(errorResult);
      toast.error('Test request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-wa-green-600 dark:text-primary" />
            Configuration Status
          </CardTitle>
          <CardDescription>Check if NetSuite credentials are properly configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkConfig} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Configuration
              </>
            )}
          </Button>

          {configStatus && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant={configStatus.configured ? 'default' : 'destructive'}>
                  {configStatus.configured ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Configured
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Configured
                    </>
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-muted-foreground">Account ID:</p>
                  <p className="font-mono">{configStatus.accountId || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-muted-foreground">Consumer Key:</p>
                  <p className="font-mono">
                    {configStatus.hasConsumerKey ? '••••••••' : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-muted-foreground">Token ID:</p>
                  <p className="font-mono">
                    {configStatus.hasTokenId ? '••••••••' : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-muted-foreground">RESTlet URL:</p>
                  <p className="font-mono text-xs break-all">
                    {configStatus.restletUrl || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Source Status Card */}
      {dataSourceStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Data Source Status
            </CardTitle>
            <CardDescription>
              Shows which data source is currently being used (NetSuite or Mock Database)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active Source Badge */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-muted-foreground">
                Active Source:
              </span>
              <Badge
                variant={dataSourceStatus.activeSource === 'netsuite' ? 'default' : 'secondary'}
                className="text-base px-3 py-1"
              >
                {dataSourceStatus.activeSource === 'netsuite' ? '🌐 NetSuite' : '💾 Mock Database'}
              </Badge>
            </div>

            {/* Configured Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-muted-foreground mb-1">Configured Mode:</p>
                <Badge variant="outline" className="font-mono">
                  {dataSourceStatus.configured.toUpperCase()}
                </Badge>
                {dataSourceStatus.configured === 'auto' && (
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    Auto-detects best available source
                  </p>
                )}
              </div>

              <div>
                <p className="text-gray-500 dark:text-muted-foreground mb-1">NetSuite Status:</p>
                <Badge variant={dataSourceStatus.netsuiteConfigured ? 'default' : 'secondary'}>
                  {dataSourceStatus.netsuiteConfigured ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Configured
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Configured
                    </>
                  )}
                </Badge>
              </div>
            </div>

            {/* Mock Data Counts */}
            {dataSourceStatus.mockData && (
              <div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">
                  Mock Database Records:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {dataSourceStatus.mockData.customers}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-muted-foreground">Customers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {dataSourceStatus.mockData.items}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-muted-foreground">Items</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Environment Variable Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>To change data source:</strong> Set <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">NETSUITE_DATA_SOURCE</code> in <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">.env.local</code> to:
                <ul className="list-disc ml-4 mt-1">
                  <li><code className="font-mono">netsuite</code> - Use NetSuite only</li>
                  <li><code className="font-mono">mock</code> - Use mock database only</li>
                  <li><code className="font-mono">auto</code> - Auto-detect (default)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Connection Test Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Test RESTlet Connection
          </CardTitle>
          <CardDescription>
            Test OAuth 1.0 authentication and RESTlet endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Common Issues Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Common Issues:</strong>
              <ul className="list-disc ml-4 mt-2 text-sm space-y-1">
                <li>Role must NOT have "Web Services Only" restriction</li>
                <li>Role needs "Web Services" permission</li>
                <li>Token must have access to RESTlet script (10293)</li>
                <li>Integration must have Token-Based Authentication enabled</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Test Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="test-type">Test Type</Label>
            <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
              <SelectTrigger id="test-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Customer
                  </div>
                </SelectItem>
                <SelectItem value="item">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Item (Product)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specific ID Input */}
          <div className="space-y-2">
            <Label htmlFor="specific-id">
              Specific ID (optional)
              <span className="text-gray-500 dark:text-muted-foreground ml-2">
                Leave empty to fetch all
              </span>
            </Label>
            <Input
              id="specific-id"
              type="text"
              placeholder={testType === 'item' ? 'e.g., 176542' : 'e.g., 1001'}
              value={specificId}
              onChange={(e) => setSpecificId(e.target.value)}
            />
          </div>

          {/* Test Button */}
          <Button onClick={testConnection} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results Card */}
      {testResult && (
        <Card className={testResult.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">Test Successful</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600">Test Failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                Message:
              </p>
              <p className="text-base">{testResult.message}</p>
            </div>

            {/* Error */}
            {testResult.error && (
              <div>
                <p className="text-sm font-medium text-red-600">Error:</p>
                <p className="text-sm font-mono bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  {testResult.error}
                </p>
              </div>
            )}

            {/* Debug Info */}
            {testResult.debugInfo && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                  Debug Information:
                </p>
                <div className="bg-gray-50 dark:bg-accent p-3 rounded space-y-2 text-sm font-mono">
                  <div>
                    <span className="text-gray-500">Timestamp:</span>{' '}
                    {testResult.debugInfo.timestamp}
                  </div>
                  <div>
                    <span className="text-gray-500">Method:</span>{' '}
                    {testResult.debugInfo.method}
                  </div>
                  <div>
                    <span className="text-gray-500">URL:</span>{' '}
                    <span className="text-xs break-all">{testResult.debugInfo.url}</span>
                  </div>
                  {testResult.debugInfo.status && (
                    <div>
                      <span className="text-gray-500">Status:</span>{' '}
                      <Badge variant={testResult.debugInfo.status === 200 ? 'default' : 'destructive'}>
                        {testResult.debugInfo.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Data */}
            {testResult.data && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                  Response Data:
                </p>
                <pre className="bg-gray-50 dark:bg-accent p-3 rounded text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}

            {/* Recommendations */}
            {!testResult.success && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Troubleshooting Steps:</strong>
                  <ol className="list-decimal ml-4 mt-2 text-sm space-y-1">
                    <li>Verify the token role does NOT have "Web Services Only" restriction</li>
                    <li>Check if the integration has "Token-Based Authentication" enabled</li>
                    <li>Ensure the role has "Web Services" permission</li>
                    <li>Verify the token is active in NetSuite (Setup → Access Tokens)</li>
                    <li>Check if there are IP restrictions on the integration</li>
                    <li>Confirm the RESTlet script (10293) is deployed and accessible</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
