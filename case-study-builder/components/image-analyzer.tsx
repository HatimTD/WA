'use client';

/**
 * Image Analyzer Component
 *
 * Allows users to upload images and extract text/data using AI-powered OCR.
 * Supports case studies, data sheets, and general documents.
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Upload, Loader2, FileText, Copy, Check, X } from 'lucide-react';

type ContentType = 'text' | 'data_sheet' | 'case_study' | 'technical_specs' | 'general';

interface AnalysisResult {
  success: boolean;
  contentType?: ContentType;
  extractedText?: string;
  structuredData?: Record<string, string | undefined>;
  confidence?: number;
  notes?: string;
  error?: string;
  text?: string;
  productName?: string;
  specifications?: Record<string, string>;
  composition?: Record<string, string>;
  applications?: string[];
}

interface ImageAnalyzerProps {
  onExtractedData?: (data: AnalysisResult) => void;
  defaultContentType?: ContentType;
}

export function ImageAnalyzer({
  onExtractedData,
  defaultContentType = 'case_study',
}: ImageAnalyzerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>(defaultContentType);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      alert('Image size must be less than 20MB');
      return;
    }

    // Read and preview the file
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/image-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imagePreview,
          contentType,
          action: contentType === 'data_sheet' ? 'data_sheet' : 'analyze',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success && onExtractedData) {
        onExtractedData(data);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to analyze image. Please try again.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyText = () => {
    const textToCopy = result?.extractedText || result?.text || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Content Type:</Label>
        <Select
          value={contentType}
          onValueChange={(value) => setContentType(value as ContentType)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="case_study">Case Study</SelectItem>
            <SelectItem value="data_sheet">Data Sheet</SelectItem>
            <SelectItem value="technical_specs">Technical Specs</SelectItem>
            <SelectItem value="text">General Text</SelectItem>
            <SelectItem value="general">Auto-Detect</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          imagePreview
            ? 'border-wa-green-500 bg-wa-green-50'
            : 'border-gray-300 hover:border-wa-green-400 hover:bg-gray-50'
        }`}
      >
        {imagePreview ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-lg shadow-md"
              />
              <button
                onClick={handleClear}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-wa-green-600 hover:bg-wa-green-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-full p-4">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Upload an image to extract text and data
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Image
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Supports JPEG, PNG, GIF, WebP (max 20MB)
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Analysis Results */}
      {result && (
        <div
          className={`border rounded-lg p-4 ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          {result.success ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-800">Analysis Complete</h3>
                {result.confidence && (
                  <span className="text-sm text-green-600">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </span>
                )}
              </div>

              {/* Structured Data */}
              {result.structuredData && Object.keys(result.structuredData).length > 0 && (
                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="text-sm font-medium mb-2">Extracted Fields:</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(result.structuredData)
                      .filter(([, value]) => value)
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </dt>
                          <dd className="text-gray-900">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              )}

              {/* Data Sheet Results */}
              {result.productName && (
                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="text-sm font-medium mb-2">Product: {result.productName}</h4>
                  {result.specifications && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Specifications:</span>
                      <ul className="text-sm">
                        {Object.entries(result.specifications).map(([key, value]) => (
                          <li key={key}>
                            {key}: {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.applications && result.applications.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Applications:</span>
                      <ul className="text-sm list-disc list-inside">
                        {result.applications.map((app, i) => (
                          <li key={i}>{app}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Text */}
              {(result.extractedText || result.text) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Extracted Text:</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyText}
                      className="h-8"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-white rounded-lg p-3 border max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {result.extractedText || result.text}
                    </pre>
                  </div>
                </div>
              )}

              {result.notes && (
                <p className="text-sm text-amber-600">{result.notes}</p>
              )}
            </div>
          ) : (
            <div className="text-red-700">
              <h3 className="font-semibold mb-1">Analysis Failed</h3>
              <p className="text-sm">{result.error || 'An unknown error occurred'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageAnalyzer;
