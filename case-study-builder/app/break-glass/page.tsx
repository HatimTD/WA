'use client';

/**
 * Break-Glass Admin Login Page
 *
 * Emergency access page per WA Policy Section 3.1.
 * This page should only be used when normal authentication is unavailable.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield, Clock, LogOut } from 'lucide-react';

interface BreakGlassStatus {
  enabled: boolean;
  authenticated: boolean;
  expired?: boolean;
  session?: {
    email: string;
    expiresAt: number;
    remainingMinutes: number;
  };
}

export default function BreakGlassPage() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BreakGlassStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check current session status
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch('/api/auth/break-glass');
        const data = await response.json();
        setStatus(data);
      } catch {
        setError('Failed to check break-glass status');
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, []);

  // Handle break-glass login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/break-glass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      // Refresh status
      const statusResponse = await fetch('/api/auth/break-glass');
      const statusData = await statusResponse.json();
      setStatus(statusData);
      setKey('');
    } catch {
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/break-glass', { method: 'DELETE' });
      setStatus({ enabled: true, authenticated: false });
    } catch {
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-600">Checking access status...</div>
      </div>
    );
  }

  // If break-glass is not enabled
  if (!status?.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Break-Glass Access Disabled
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Emergency admin access is not currently enabled.
            Contact your system administrator if you need emergency access.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full"
            variant="outline"
          >
            Return to Normal Login
          </Button>
        </div>
      </div>
    );
  }

  // If already authenticated
  if (status?.authenticated && status.session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border-2 border-amber-500">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Break-Glass Session Active
          </h1>
          <p className="text-center text-amber-600 font-semibold mb-6">
            Emergency Admin Access Enabled
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Session expires in {status.session.remainingMinutes} minutes
              </span>
            </div>
            <p className="text-sm text-amber-700">
              Logged in as: {status.session.email}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> All actions during this session are being
              logged and monitored. Use break-glass access only for emergency
              situations as per WA Policy Section 3.1.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 text-red-600 hover:bg-red-50"
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              End Break-Glass Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border-2 border-red-500">
        <div className="flex items-center justify-center mb-6">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Break-Glass Emergency Access
        </h1>
        <p className="text-center text-red-600 font-semibold mb-6">
          WA Policy Section 3.1 - Emergency Admin Access
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">
            <strong>Warning:</strong> This access method is for emergency use only.
            All access attempts and actions are logged and monitored.
            Unauthorized use will result in disciplinary action.
          </p>
        </div>

        {status?.expired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-700">
              Your previous session has expired. Please authenticate again if
              emergency access is still required.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="break-glass-key" className="text-gray-700">
              Emergency Access Key
            </Label>
            <Input
              id="break-glass-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter break-glass key"
              required
              className="mt-1"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading || !key}
          >
            {loading ? 'Authenticating...' : 'Request Emergency Access'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <Button
            onClick={() => router.push('/login')}
            variant="ghost"
            className="w-full text-gray-600"
          >
            Return to Normal Login
          </Button>
        </div>
      </div>
    </div>
  );
}
