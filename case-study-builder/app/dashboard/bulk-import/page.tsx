'use client';

import { Upload } from 'lucide-react';
import BulkImportWizard from '@/components/bulk-import-wizard';

export default function BulkImportPage() {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-foreground">Bulk Import</h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">
            Import multiple case studies from CSV or Excel files
          </p>
        </div>
        <Upload className="h-12 w-12 text-wa-green-500 dark:text-primary" />
      </div>

      {/* Wizard */}
      <BulkImportWizard />
    </div>
  );
}
