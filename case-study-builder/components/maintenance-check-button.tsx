'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHECK_INTERVAL = 30000; // Check every 30 seconds

export default function MaintenanceCheckButton() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check on mount
    checkMaintenanceStatus(true);

    // Set up periodic checking
    const intervalId = setInterval(() => checkMaintenanceStatus(true), CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  const checkMaintenanceStatus = async (autoRedirect = false) => {
    if (isChecking) return;

    try {
      setIsChecking(true);
      setMessage('');

      const response = await fetch('/api/maintenance-status', {
        cache: 'no-store',
      });

      if (!response.ok) {
        setMessage('Failed to check status. Please try again.');
        return;
      }

      const data = await response.json();
      const { maintenanceMode } = data;

      if (!maintenanceMode) {
        // Maintenance is off, redirect to home
        console.log('[Maintenance Page] Maintenance ended, redirecting...');
        router.push('/dashboard');
      } else if (!autoRedirect) {
        // Manual check and still under maintenance
        setMessage('The site is still under maintenance. Please check back later.');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('[Maintenance Page] Error checking status:', error);
      setMessage('Error checking status. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualCheck = () => {
    checkMaintenanceStatus(false);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleManualCheck}
        disabled={isChecking}
        className="bg-gradient-to-r from-wa-green-500 to-purple-600 hover:from-wa-green-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200"
      >
        {isChecking ? (
          <>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <RefreshCw className="h-5 w-5 mr-2" />
            Check if Maintenance Ended
          </>
        )}
      </Button>

      {message && (
        <div className="p-4 bg-wa-green-50 border border-wa-green-200 rounded-lg text-center">
          <p className="text-sm text-wa-green-800">{message}</p>
        </div>
      )}
    </div>
  );
}
