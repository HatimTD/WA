'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  waValidateBulkImport,
  waBulkImportCaseStudies,
  waGetBulkImportTemplate,
  type BulkImportResult,
} from '@/lib/actions/waBulkImportActions';
import { parseCSV, parseExcelData, type BulkImportRow, type ParseResult, type ValidationError } from '@/lib/utils/waBulkImportParser';
import * as XLSX from 'xlsx';

type WizardStep = 'upload' | 'preview' | 'configure' | 'importing' | 'complete';

export default function BulkImportWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // File state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'excel'>('csv');

  // Parse results
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // Configuration
  const [importStatus, setImportStatus] = useState<'DRAFT' | 'SUBMITTED'>('DRAFT');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Import results
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let result: ParseResult;

      if (extension === 'csv') {
        setFileType('csv');
        const content = await file.text();
        result = parseCSV(content);
      } else if (extension === 'xlsx' || extension === 'xls') {
        setFileType('excel');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        result = parseExcelData(jsonData as Record<string, any>[]);
      } else {
        toast.error('Unsupported file format. Please use CSV or Excel (.xlsx, .xls)');
        setIsLoading(false);
        return;
      }

      setParseResult(result);

      if (result.errors.length > 0 && result.validRows === 0) {
        toast.error(`File has ${result.errors.length} validation errors. Please fix and re-upload.`);
      } else if (result.errors.length > 0) {
        toast.warning(`${result.validRows} valid rows found, ${result.errors.length} rows have errors`);
        setCurrentStep('preview');
      } else {
        toast.success(`${result.validRows} valid rows found`);
        setCurrentStep('preview');
      }
    } catch (error: any) {
      console.error('File processing error:', error);
      toast.error(`Failed to process file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const result = await waGetBulkImportTemplate();
    if (result.success && result.template) {
      const blob = new Blob([result.template], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'case-study-import-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } else {
      toast.error('Failed to download template');
    }
  };

  const handleStartImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setCurrentStep('importing');
    setImportProgress(0);
    setIsLoading(true);

    try {
      // Simulate progress during import
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await waBulkImportCaseStudies(parseResult.rows, {
        status: importStatus,
        skipDuplicates,
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setCurrentStep('complete');

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
      setCurrentStep('configure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setFileName(null);
    setParseResult(null);
    setImportResult(null);
    setImportProgress(0);
  };

  const getStepNumber = (step: WizardStep): number => {
    const steps: WizardStep[] = ['upload', 'preview', 'configure', 'importing', 'complete'];
    return steps.indexOf(step) + 1;
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', label: 'Upload' },
      { id: 'preview', label: 'Preview' },
      { id: 'configure', label: 'Configure' },
      { id: 'complete', label: 'Complete' },
    ];

    const currentIndex = steps.findIndex((s) => s.id === currentStep || (currentStep === 'importing' && s.id === 'complete'));

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                index < currentIndex
                  ? 'bg-wa-green-500 border-wa-green-500 text-white'
                  : index === currentIndex
                    ? 'border-wa-green-500 text-wa-green-500'
                    : 'border-gray-300 text-gray-400'
              }`}
            >
              {index < currentIndex ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                index <= currentIndex ? 'text-gray-900 dark:text-foreground' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-4 ${
                  index < currentIndex ? 'bg-wa-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold dark:text-foreground">Upload Case Studies</h2>
        <p className="text-gray-600 dark:text-muted-foreground mt-1">
          Upload a CSV or Excel file containing your case studies
        </p>
      </div>

      {/* Download Template */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? 'border-wa-green-500 bg-wa-green-50'
            : 'border-gray-300 hover:border-wa-green-400 dark:border-border'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-wa-green-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-muted-foreground">Processing file...</p>
          </div>
        ) : (
          <>
            <FileSpreadsheet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2 dark:text-foreground">
              Drag and drop your file here
            </p>
            <p className="text-gray-500 dark:text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              type="file"
              id="bulk-import-file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />
            <Button
              onClick={() => document.getElementById('bulk-import-file')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <p className="text-xs text-gray-400 dark:text-muted-foreground mt-4">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </>
        )}
      </div>

      {/* Format Info */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Required Columns</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Your file must include these required columns:</p>
          <div className="flex flex-wrap gap-1">
            {['type', 'customerName', 'industry', 'location', 'componentWorkpiece', 'workType', 'problemDescription', 'waSolution', 'waProduct'].map((col) => (
              <Badge key={col} variant="secondary" className="text-xs">
                {col}
              </Badge>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPreviewStep = () => {
    if (!parseResult) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold dark:text-foreground">Preview Data</h2>
            <p className="text-gray-600 dark:text-muted-foreground mt-1">
              Review the data before importing
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              {fileName}
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="dark:bg-card dark:border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-wa-green-600">{parseResult.totalRows}</p>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">Total Rows</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-card dark:border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{parseResult.validRows}</p>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">Valid Rows</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-card dark:border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{parseResult.errors.length}</p>
                <p className="text-sm text-gray-500 dark:text-muted-foreground">Errors</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Errors */}
        {parseResult.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
                {parseResult.errors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-sm">
                    Row {error.rowNumber}: {error.field} - {error.message}
                  </p>
                ))}
                {parseResult.errors.length > 10 && (
                  <p className="text-sm font-medium">
                    ...and {parseResult.errors.length - 10} more errors
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Preview Table */}
        {parseResult.rows.length > 0 && (
          <Card className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="text-base dark:text-foreground">Data Preview (first 5 rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Product</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.rows.slice(0, 5).map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell className="font-medium">{row.rowNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.type}</Badge>
                        </TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.industry}</TableCell>
                        <TableCell>{row.location}</TableCell>
                        <TableCell>{row.componentWorkpiece}</TableCell>
                        <TableCell>{row.waProduct}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Upload Different File
          </Button>
          <Button
            onClick={() => setCurrentStep('configure')}
            disabled={parseResult.validRows === 0}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold dark:text-foreground">Configure Import</h2>
        <p className="text-gray-600 dark:text-muted-foreground mt-1">
          Set options for your bulk import
        </p>
      </div>

      <Card className="dark:bg-card dark:border-border">
        <CardContent className="pt-6 space-y-6">
          {/* Import Status */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Initial Status</Label>
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
              Choose the status for imported case studies
            </p>
            <Select
              value={importStatus}
              onValueChange={(value: 'DRAFT' | 'SUBMITTED') => setImportStatus(value)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft (requires manual submission)</SelectItem>
                <SelectItem value="SUBMITTED">Submitted (for review)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skip Duplicates */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Skip Duplicates</Label>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                Skip rows that match existing case studies
              </p>
            </div>
            <Switch
              checked={skipDuplicates}
              onCheckedChange={setSkipDuplicates}
            />
          </div>

          {/* Summary */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Import Summary</AlertTitle>
            <AlertDescription>
              {parseResult?.validRows} case studies will be created as {importStatus.toLowerCase()}
              {skipDuplicates && ' (duplicates will be skipped)'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('preview')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleStartImport} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              Start Import
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-6 text-center py-12">
      <Loader2 className="h-16 w-16 mx-auto text-wa-green-500 animate-spin" />
      <div>
        <h2 className="text-xl font-semibold dark:text-foreground">Importing Case Studies</h2>
        <p className="text-gray-600 dark:text-muted-foreground mt-1">
          Please wait while we create your case studies...
        </p>
      </div>
      <div className="max-w-md mx-auto">
        <Progress value={importProgress} className="h-2" />
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2">
          {importProgress}% complete
        </p>
      </div>
    </div>
  );

  const renderCompleteStep = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-6 text-center py-8">
        {importResult.success ? (
          <CheckCircle2 className="h-20 w-20 mx-auto text-green-500" />
        ) : (
          <XCircle className="h-20 w-20 mx-auto text-red-500" />
        )}

        <div>
          <h2 className="text-xl font-semibold dark:text-foreground">
            {importResult.success ? 'Import Complete!' : 'Import Completed with Issues'}
          </h2>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">
            {importResult.message}
          </p>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <Card className="dark:bg-card dark:border-border">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                {importResult.totalRows}
              </p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-card dark:border-border">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">
                {importResult.successfulRows}
              </p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Success</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-card dark:border-border">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-red-600">
                {importResult.failedRows}
              </p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Errors */}
        {importResult.errors.length > 0 && (
          <Alert variant="destructive" className="max-w-lg mx-auto text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Import Errors</AlertTitle>
            <AlertDescription>
              <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                {importResult.errors.slice(0, 5).map((error, index) => (
                  <p key={index} className="text-sm">
                    Row {error.rowNumber}: {error.message}
                  </p>
                ))}
                {importResult.errors.length > 5 && (
                  <p className="text-sm font-medium">
                    ...and {importResult.errors.length - 5} more errors
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleReset}>
            Import More
          </Button>
          <Button onClick={() => router.push('/dashboard/my-cases')}>
            View My Cases
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      <Card className="dark:bg-card dark:border-border">
        <CardContent className="p-8">
          {currentStep === 'upload' && renderUploadStep()}
          {currentStep === 'preview' && renderPreviewStep()}
          {currentStep === 'configure' && renderConfigureStep()}
          {currentStep === 'importing' && renderImportingStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </CardContent>
      </Card>
    </div>
  );
}
