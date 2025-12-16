'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { waSummarizeText, waTranslateText, waImproveText } from '@/lib/actions/waOpenaiActions';

export default function OpenAIDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runOpenAITests = async () => {
    setIsRunning(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {
        summarize: { status: 'pending', result: null, error: null },
        translate: { status: 'pending', result: null, error: null },
        improve: { status: 'pending', result: null, error: null },
      },
      overallStatus: 'running',
    };

    const testText = 'This is a test of the OpenAI API integration. We are testing if the API key is configured correctly and can successfully communicate with OpenAI servers.';

    // Test 1: Summarize
    console.log('[OpenAI Diagnostics] Testing summarize...');
    try {
      const summarizeResult = await waSummarizeText(testText, 20);
      if (summarizeResult.success && summarizeResult.summary) {
        results.tests.summarize = {
          status: 'success',
          result: summarizeResult.summary,
          error: null,
        };
        console.log('[OpenAI Diagnostics] ✓ Summarize test passed');
      } else {
        results.tests.summarize = {
          status: 'failed',
          result: null,
          error: summarizeResult.error || 'Unknown error',
        };
        console.error('[OpenAI Diagnostics] ✗ Summarize test failed:', summarizeResult.error);
      }
    } catch (error: any) {
      results.tests.summarize = {
        status: 'failed',
        result: null,
        error: error.message || 'Unknown error',
      };
      console.error('[OpenAI Diagnostics] ✗ Summarize test exception:', error);
    }

    // Test 2: Improve Text
    console.log('[OpenAI Diagnostics] Testing improve text...');
    try {
      const improveResult = await waImproveText(testText);
      if (improveResult.success && improveResult.improvedText) {
        results.tests.improve = {
          status: 'success',
          result: improveResult.improvedText,
          error: null,
        };
        console.log('[OpenAI Diagnostics] ✓ Improve text test passed');
      } else {
        results.tests.improve = {
          status: 'failed',
          result: null,
          error: improveResult.error || 'Unknown error',
        };
        console.error('[OpenAI Diagnostics] ✗ Improve text test failed:', improveResult.error);
      }
    } catch (error: any) {
      results.tests.improve = {
        status: 'failed',
        result: null,
        error: error.message || 'Unknown error',
      };
      console.error('[OpenAI Diagnostics] ✗ Improve text test exception:', error);
    }

    // Test 3: Translate
    console.log('[OpenAI Diagnostics] Testing translate...');
    try {
      const translateResult = await waTranslateText(testText, 'Spanish');
      if (translateResult.success && translateResult.translatedText) {
        results.tests.translate = {
          status: 'success',
          result: translateResult.translatedText,
          error: null,
        };
        console.log('[OpenAI Diagnostics] ✓ Translate test passed');
      } else {
        results.tests.translate = {
          status: 'failed',
          result: null,
          error: translateResult.error || 'Unknown error',
        };
        console.error('[OpenAI Diagnostics] ✗ Translate test failed:', translateResult.error);
      }
    } catch (error: any) {
      results.tests.translate = {
        status: 'failed',
        result: null,
        error: error.message || 'Unknown error',
      };
      console.error('[OpenAI Diagnostics] ✗ Translate test exception:', error);
    }

    // Determine overall status
    const allPassed = Object.values(results.tests).every((test: any) => test.status === 'success');
    const somePassed = Object.values(results.tests).some((test: any) => test.status === 'success');

    if (allPassed) {
      results.overallStatus = 'success';
      console.log('[OpenAI Diagnostics] ✓ All tests passed!');
    } else if (somePassed) {
      results.overallStatus = 'partial';
      console.warn('[OpenAI Diagnostics] ⚠ Some tests failed');
    } else {
      results.overallStatus = 'failed';
      console.error('[OpenAI Diagnostics] ✗ All tests failed');
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (status === 'failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          OpenAI API Diagnostics
        </CardTitle>
        <CardDescription>
          Test if your OpenAI API key is configured correctly and working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runOpenAITests} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running tests...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Test OpenAI API
            </>
          )}
        </Button>

        {testResults && (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
            {/* Overall Status */}
            <div className="flex items-center gap-2 p-3 bg-white rounded border">
              {testResults.overallStatus === 'success' && (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <div className="font-semibold text-green-700">All Tests Passed!</div>
                    <div className="text-sm text-gray-600">OpenAI API is working correctly</div>
                  </div>
                </>
              )}
              {testResults.overallStatus === 'partial' && (
                <>
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                  <div>
                    <div className="font-semibold text-orange-700">Some Tests Failed</div>
                    <div className="text-sm text-gray-600">OpenAI API partially working</div>
                  </div>
                </>
              )}
              {testResults.overallStatus === 'failed' && (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <div>
                    <div className="font-semibold text-red-700">All Tests Failed</div>
                    <div className="text-sm text-gray-600">OpenAI API not working</div>
                  </div>
                </>
              )}
            </div>

            {/* Individual Test Results */}
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>

              {/* Summarize Test */}
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.tests.summarize.status)}
                  <span className="font-medium">Text Summarization</span>
                </div>
                {testResults.tests.summarize.status === 'success' ? (
                  <div className="text-sm text-gray-600 ml-7">
                    <div className="font-medium text-green-700 mb-1">Result:</div>
                    <div className="bg-green-50 p-2 rounded text-xs italic">
                      "{testResults.tests.summarize.result}"
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600 ml-7">
                    <div className="font-medium mb-1">Error:</div>
                    <div className="bg-red-50 p-2 rounded text-xs">
                      {testResults.tests.summarize.error}
                    </div>
                  </div>
                )}
              </div>

              {/* Improve Text Test */}
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.tests.improve.status)}
                  <span className="font-medium">Text Improvement</span>
                </div>
                {testResults.tests.improve.status === 'success' ? (
                  <div className="text-sm text-gray-600 ml-7">
                    <div className="font-medium text-green-700 mb-1">Result:</div>
                    <div className="bg-green-50 p-2 rounded text-xs italic">
                      "{testResults.tests.improve.result}"
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600 ml-7">
                    <div className="font-medium mb-1">Error:</div>
                    <div className="bg-red-50 p-2 rounded text-xs">
                      {testResults.tests.improve.error}
                    </div>
                  </div>
                )}
              </div>

              {/* Translate Test */}
              <div className="bg-white p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.tests.translate.status)}
                  <span className="font-medium">Translation (to Spanish)</span>
                </div>
                {testResults.tests.translate.status === 'success' ? (
                  <div className="text-sm text-gray-600 ml-7">
                    <div className="font-medium text-green-700 mb-1">Result:</div>
                    <div className="bg-green-50 p-2 rounded text-xs italic">
                      "{testResults.tests.translate.result}"
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600 ml-7">
                    <div className="font-medium mb-1">Error:</div>
                    <div className="bg-red-50 p-2 rounded text-xs">
                      {testResults.tests.translate.error}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Troubleshooting */}
            {testResults.overallStatus !== 'success' && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 text-orange-600">Troubleshooting:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Check that OPENAI_API_KEY is set in .env.local</li>
                  <li>Verify the API key is valid (not expired or revoked)</li>
                  <li>Ensure your OpenAI account has credits/billing enabled</li>
                  <li>Check your internet connection</li>
                  <li>Verify firewall is not blocking api.openai.com</li>
                  <li>Try restarting the development server</li>
                </ul>
              </div>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                View full diagnostic data
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
