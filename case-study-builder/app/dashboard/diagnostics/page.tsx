import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VoiceInputDiagnostics from '@/components/voice-input-diagnostics';
import OpenAIDiagnostics from '@/components/openai-diagnostics';
import { AlertCircle } from 'lucide-react';

export default function DiagnosticsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-wa-green-600" />
          System Diagnostics
        </h1>
        <p className="text-gray-600 mt-2">
          Test voice input, OpenAI integration, and troubleshoot common issues
        </p>
      </div>

      <OpenAIDiagnostics />

      <Card role="article" className="bg-wa-green-50 border-wa-green-200">
        <CardHeader>
          <CardTitle className="text-wa-green-900">About Voice Input Network Errors</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>
            Chrome's Web Speech API sends audio to Google's cloud servers for processing.
            Network errors occur when the browser cannot reach these servers.
          </p>

          <div>
            <p className="font-semibold mb-2">Common causes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Wrong URL:</strong> Must use <code className="bg-wa-green-100 px-1 rounded">http://localhost:3010</code> (NOT network IP address)</li>
              <li><strong>No internet:</strong> Speech API requires active internet connection</li>
              <li><strong>Windows Firewall:</strong> Most common cause - Windows Defender Firewall blocking Chrome's network access</li>
              <li><strong>Antivirus software:</strong> Security software blocking Google servers (Avast, Norton, McAfee, etc.)</li>
              <li><strong>VPN interference:</strong> Some VPNs block the Speech API endpoints</li>
              <li><strong>Corporate network:</strong> Workplace firewalls may block consumer Google services</li>
              <li><strong>DNS issues:</strong> Cannot resolve Google's Speech API domain names</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">Quick fixes to try (in order):</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Ensure you're accessing <code className="bg-wa-green-100 px-1 rounded">http://localhost:3010</code></li>
              <li>Check your internet connection (test by opening google.com)</li>
              <li><strong>Windows Firewall:</strong> Temporarily disable Windows Defender Firewall (Control Panel → System and Security → Windows Defender Firewall → Turn off)</li>
              <li><strong>Antivirus:</strong> Temporarily disable your antivirus software</li>
              <li><strong>VPN:</strong> Disconnect from any VPN service</li>
              <li>Try Chrome in incognito mode (Ctrl+Shift+N)</li>
              <li>Try a different network (mobile hotspot) to rule out network restrictions</li>
              <li>Add Chrome exception to Windows Firewall (if above works)</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-3 rounded">
            <p className="font-semibold text-orange-800 mb-2">⚠️ Most Likely Fix for Your Error:</p>
            <p className="text-sm mb-3">
              Since you're on localhost with secure context but still getting network errors, this is almost certainly caused by one of these:
            </p>
            <div className="text-sm space-y-2 ml-4">
              <div>
                <strong className="text-orange-900">1. Brave Browser Shields (Most Common):</strong>
                <p className="text-gray-700 ml-4 mt-1">
                  Brave's privacy shields block Google services by default. <strong>Click the Brave icon (lion) in the address bar → Turn off "Shields" for localhost</strong>
                </p>
              </div>
              <div>
                <strong className="text-orange-900">2. Windows Firewall/Antivirus:</strong>
                <p className="text-gray-700 ml-4 mt-1">
                  Security software blocking browser network access to Google servers. Temporarily disable to test.
                </p>
              </div>
              <div>
                <strong className="text-orange-900">3. Browser Extensions:</strong>
                <p className="text-gray-700 ml-4 mt-1">
                  Ad blockers or privacy extensions (uBlock Origin, Privacy Badger, etc.) may block the Speech API.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-wa-green-50 border border-wa-green-200 p-3 rounded mt-3">
            <p className="font-semibold text-wa-green-800 mb-2">🦁 Brave Browser Fix (Recommended):</p>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>Look for the <strong>Brave icon (lion)</strong> in the address bar on the right</li>
              <li>Click it to open the Shields panel</li>
              <li>Toggle <strong>"Shields"</strong> to OFF for localhost:3010</li>
              <li>Refresh the page and try voice input again</li>
            </ol>
            <p className="text-xs text-gray-600 mt-2">
              Alternative: Try in <strong>Chrome</strong> browser which has better Web Speech API support
            </p>
          </div>
        </CardContent>
      </Card>

      <VoiceInputDiagnostics />

      <Card role="article">
        <CardHeader>
          <CardTitle>Alternative Solutions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>
            If voice input continues to fail after trying the fixes above:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Use the AI Assist feature instead:</strong> The AI-powered text improvement,
              summarization, and translation features work without voice input
            </li>
            <li>
              <strong>Type your content manually:</strong> All form fields support standard text input
            </li>
            <li>
              <strong>Try a different browser:</strong> Test in Chrome, Edge, or another Chromium-based browser
            </li>
            <li>
              <strong>Use a different network:</strong> Try from home network, mobile hotspot, or public WiFi
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
