'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VoiceInputDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      connectivity: {},
      permissions: {},
      speechAPI: {},
    };

    // 1. Check environment
    results.environment = {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      href: window.location.href,
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent,
      language: navigator.language,
    };

    // 2. Check Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    results.speechAPI = {
      supported: !!SpeechRecognition,
      type: SpeechRecognition ? (window as any).SpeechRecognition ? 'native' : 'webkit' : 'none',
    };

    // 3. Check permissions
    try {
      if (navigator.permissions) {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        results.permissions.microphone = micPermission.state;
      } else {
        results.permissions.microphone = 'API not available';
      }
    } catch (e) {
      results.permissions.microphone = 'Unable to check';
    }

    // 4. Check internet connectivity
    results.connectivity.online = navigator.onLine;

    // Try to ping Google's public DNS (via fetch to a reliable endpoint)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      results.connectivity.googleReachable = true;
    } catch (e: any) {
      results.connectivity.googleReachable = false;
      results.connectivity.googleError = e.message;
    }

    // Try to reach a Speech API endpoint (testing connectivity)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // This won't actually work without proper auth, but it tests if we can reach the domain
      const response = await fetch('https://www.google.com/speech-api/v1/recognize', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      results.connectivity.speechAPIReachable = true;
    } catch (e: any) {
      results.connectivity.speechAPIReachable = false;
      results.connectivity.speechAPIError = e.message;
    }

    // REAL TEST: Actually try to initialize Speech Recognition API
    results.connectivity.speechAPIRealTest = 'not_tested';
    if (SpeechRecognition) {
      try {
        const testRecognition = new SpeechRecognition();
        testRecognition.lang = 'en-US';

        // Set up a promise to catch network errors
        const testPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            testRecognition.stop();
            resolve({ success: true, message: 'Started successfully (stopped before completing)' });
          }, 2000);

          testRecognition.onerror = (event: any) => {
            clearTimeout(timeout);
            testRecognition.stop();
            reject({ error: event.error, message: event.message });
          };

          testRecognition.onstart = () => {
            console.log('[Diagnostics] Speech API test started successfully');
          };

          try {
            testRecognition.start();
          } catch (err: any) {
            clearTimeout(timeout);
            reject({ error: 'start_failed', message: err.message });
          }
        });

        const testResult: any = await testPromise;
        results.connectivity.speechAPIRealTest = 'success';
        results.connectivity.speechAPIRealTestMessage = testResult.message;
      } catch (err: any) {
        results.connectivity.speechAPIRealTest = 'failed';
        results.connectivity.speechAPIRealTestError = err.error;
        results.connectivity.speechAPIRealTestMessage = err.message || 'Unknown error';

        // If we get a network error in the real test, that's the actual issue
        if (err.error === 'network') {
          results.connectivity.speechAPIReachable = false;
          results.connectivity.speechAPIError = 'Speech API network test failed - firewall/VPN/antivirus blocking';
        }
      }
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: boolean | string | undefined) => {
    if (status === true || status === 'granted' || status === 'prompt') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (status === false || status === 'denied') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-wa-green-600" />
          Voice Input Diagnostics
        </CardTitle>
        <CardDescription>
          Run diagnostics to identify voice input issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running diagnostics...
            </>
          ) : (
            'Run Diagnostics'
          )}
        </Button>

        {diagnostics && (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                Environment
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostics.environment.isSecureContext)}
                  <span>Secure Context: {diagnostics.environment.isSecureContext ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(
                    diagnostics.environment.hostname === 'localhost' ||
                    diagnostics.environment.hostname === '127.0.0.1' ||
                    diagnostics.environment.protocol === 'https:'
                  )}
                  <span>URL: {diagnostics.environment.href}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Speech API</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostics.speechAPI.supported)}
                  <span>Supported: {diagnostics.speechAPI.supported ? `Yes (${diagnostics.speechAPI.type})` : 'No'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Permissions</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostics.permissions.microphone)}
                  <span>Microphone: {diagnostics.permissions.microphone}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Network Connectivity</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostics.connectivity.online)}
                  <span>Browser Online: {diagnostics.connectivity.online ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostics.connectivity.googleReachable)}
                  <span>
                    Google Reachable: {diagnostics.connectivity.googleReachable ? 'Yes' : 'No'}
                    {!diagnostics.connectivity.googleReachable && diagnostics.connectivity.googleError && (
                      <span className="text-red-600"> ({diagnostics.connectivity.googleError})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostics.connectivity.speechAPIReachable)}
                  <span>
                    Speech API Reachable: {diagnostics.connectivity.speechAPIReachable ? 'Yes' : 'No'}
                    {!diagnostics.connectivity.speechAPIReachable && diagnostics.connectivity.speechAPIError && (
                      <span className="text-red-600"> ({diagnostics.connectivity.speechAPIError})</span>
                    )}
                  </span>
                </div>
                {diagnostics.connectivity.speechAPIRealTest && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-wa-green-50 rounded border border-wa-green-200">
                    {getStatusIcon(diagnostics.connectivity.speechAPIRealTest === 'success')}
                    <div className="flex-1">
                      <span className="font-semibold text-sm">
                        Real Speech API Test: {diagnostics.connectivity.speechAPIRealTest === 'success' ? 'PASSED ✓' : 'FAILED ✗'}
                      </span>
                      {diagnostics.connectivity.speechAPIRealTest === 'success' && (
                        <p className="text-xs text-gray-600 mt-1">
                          {diagnostics.connectivity.speechAPIRealTestMessage}
                        </p>
                      )}
                      {diagnostics.connectivity.speechAPIRealTest === 'failed' && (
                        <div className="text-xs mt-1">
                          <p className="text-red-600 font-semibold">
                            Error: {diagnostics.connectivity.speechAPIRealTestError}
                          </p>
                          <p className="text-gray-600">
                            {diagnostics.connectivity.speechAPIRealTestMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-orange-600">Recommendations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {!diagnostics.environment.isSecureContext && (
                  <li>Use localhost or HTTPS (currently: {diagnostics.environment.protocol}//{diagnostics.environment.hostname})</li>
                )}
                {!diagnostics.speechAPI.supported && (
                  <li>Browser doesn't support Speech API. Try Chrome or Edge.</li>
                )}
                {diagnostics.permissions.microphone === 'denied' && (
                  <li>Microphone permission denied. Enable in browser settings.</li>
                )}
                {!diagnostics.connectivity.online && (
                  <li>No internet connection detected.</li>
                )}
                {!diagnostics.connectivity.googleReachable && (
                  <li>Cannot reach Google servers. Check firewall, VPN, or internet connection.</li>
                )}
                {diagnostics.connectivity.online && !diagnostics.connectivity.speechAPIReachable && (
                  <li>Speech API endpoints blocked. Check firewall or corporate network settings.</li>
                )}
                {diagnostics.connectivity.speechAPIRealTest === 'failed' && diagnostics.connectivity.speechAPIRealTestError === 'network' && (
                  <li className="text-red-600 font-semibold">
                    ⚠️ REAL TEST FAILED: Speech API is blocked by firewall/VPN/antivirus.
                    <div className="ml-6 mt-2 space-y-1 text-sm">
                      <div>Try these fixes:</div>
                      <div>1. Temporarily disable Windows Firewall</div>
                      <div>2. Temporarily disable antivirus software</div>
                      <div>3. Disconnect from VPN</div>
                      <div>4. Try incognito mode (Ctrl+Shift+N)</div>
                      <div>5. Check if using Brave Browser - disable Shields for localhost</div>
                    </div>
                  </li>
                )}
                {diagnostics.environment.isSecureContext &&
                 diagnostics.speechAPI.supported &&
                 diagnostics.connectivity.online &&
                 diagnostics.connectivity.googleReachable &&
                 diagnostics.connectivity.speechAPIRealTest === 'success' && (
                  <li className="text-green-600 font-semibold">✓ All checks passed including REAL test! Voice input works.</li>
                )}
                {diagnostics.environment.isSecureContext &&
                 diagnostics.speechAPI.supported &&
                 diagnostics.connectivity.online &&
                 diagnostics.connectivity.googleReachable &&
                 diagnostics.connectivity.speechAPIRealTest === 'failed' &&
                 diagnostics.connectivity.speechAPIRealTestError !== 'network' && (
                  <li className="text-orange-600">
                    Basic checks passed but real test failed: {diagnostics.connectivity.speechAPIRealTestError}
                  </li>
                )}
              </ul>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                View full diagnostic data
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
