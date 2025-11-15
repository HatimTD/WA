'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md dark:bg-card dark:border-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <CardTitle className="text-2xl text-gray-900 dark:text-foreground">
            You're Offline
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-muted-foreground">
            It looks like you've lost your internet connection. Please check your connection and try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              What you can do offline:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• View previously cached pages</li>
              <li>• Access saved case studies</li>
              <li>• Continue working on draft cases</li>
            </ul>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-muted-foreground">
            Your work will be automatically synced when you're back online
          </p>
        </CardContent>
      </Card>
    </div>
  );
}