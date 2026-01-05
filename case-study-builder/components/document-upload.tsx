'use client';

import { useState } from 'react';
import { Upload, X, File, FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { waUploadDocument, waDeleteDocument } from '@/lib/actions/waDocumentUploadActions';
import { toast } from 'sonner';

type Props = {
  onDocumentsChange: (documents: string[]) => void;
  existingDocuments?: string[];
  maxDocuments?: number;
};

export default function DocumentUpload({ onDocumentsChange, existingDocuments = [], maxDocuments = 5 }: Props) {
  const [documents, setDocuments] = useState<string[]>(existingDocuments);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-wa-green-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="h-8 w-8 text-orange-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      const fileNameWithExt = parts[parts.length - 1];
      // Remove any query parameters
      const fileName = fileNameWithExt.split('?')[0];
      // Decode URL encoding
      return decodeURIComponent(fileName);
    } catch {
      return 'Document';
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the max limit
    if (documents.length + files.length > maxDocuments) {
      toast.error(`Maximum ${maxDocuments} documents allowed`);
      return;
    }

    setUploading(true);
    const uploadedDocs: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        const formData = new FormData();
        formData.append('file', file);

        const result = await waUploadDocument(formData);

        if (result.success && result.url) {
          uploadedDocs.push(result.url);
          console.log('[DocumentUpload] Document uploaded:', result.fileName);
        } else {
          toast.error(result.error || 'Failed to upload document');
          console.error('[DocumentUpload] Upload failed:', result.error);
        }
      }

      if (uploadedDocs.length > 0) {
        const newDocuments = [...documents, ...uploadedDocs];
        setDocuments(newDocuments);
        onDocumentsChange(newDocuments);
        toast.success(`${uploadedDocs.length} document(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('[DocumentUpload] Error:', error);
      toast.error('An error occurred while uploading');
    } finally {
      setUploading(false);
      setUploadProgress('');
      // Reset the input
      event.target.value = '';
    }
  };

  const handleRemoveDocument = async (url: string, index: number) => {
    try {
      // Extract public_id from Cloudinary URL
      const publicIdMatch = url.match(/\/case-studies\/documents\/([^/]+)$/);
      if (publicIdMatch) {
        const publicId = `case-studies/documents/${publicIdMatch[1].split('.')[0]}`;
        await waDeleteDocument(publicId);
      }

      const newDocuments = documents.filter((_, i) => i !== index);
      setDocuments(newDocuments);
      onDocumentsChange(newDocuments);
      toast.success('Document removed');
    } catch (error) {
      console.error('[DocumentUpload] Error removing document:', error);
      toast.error('Failed to remove document');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-wa-green-400 transition-colors">
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />

        <div className="space-y-2">
          <input
            type="file"
            id="document-upload"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || documents.length >= maxDocuments}
          />
          <label htmlFor="document-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || documents.length >= maxDocuments}
              onClick={() => document.getElementById('document-upload')?.click()}
            >
              {uploading ? uploadProgress : 'Choose Documents'}
            </Button>
          </label>

          <p className="text-xs text-muted-foreground">
            PDF, Word, Excel, PowerPoint, TXT (max 20MB each)
          </p>
          <p className="text-xs text-muted-foreground">
            {documents.length} / {maxDocuments} documents uploaded
          </p>
        </div>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="relative border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0">
                {getFileIcon(doc)}
              </div>

              <div className="flex-1 min-w-0">
                <a
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-wa-green-600 hover:underline truncate block"
                >
                  {getFileName(doc)}
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  Click to view document
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveDocument(doc, index)}
                className="flex-shrink-0 p-2 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Remove document"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
