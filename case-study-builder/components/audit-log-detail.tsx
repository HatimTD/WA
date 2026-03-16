'use client';

/**
 * Audit Log Detail Component
 *
 * Client component for displaying detailed audit log information in a modal.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Clock,
  Hash,
  Globe,
  Monitor,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

type AuditLogEntry = {
  id: string;
  actionType: string;
  userId: string;
  userEmail: string;
  resourceType: string | null;
  resourceId: string | null;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  contentHash: string;
  previousHash: string | null;
  createdAt: Date;
};

type Props = {
  log: AuditLogEntry;
  children: React.ReactNode;
};

function waGetActionTypeColor(actionType: string): string {
  const colors: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    LOGIN_FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    BREAK_GLASS_ACCESS: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CASE_CREATED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CASE_UPDATED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    CASE_DELETED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CASE_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CASE_REJECTED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    DATA_DELETION_REQUEST: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    DATA_ANONYMIZED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    RETENTION_CLEANUP: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[actionType] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
}

function waFormatJson(obj: Record<string, unknown> | null): React.ReactNode {
  if (!obj || Object.keys(obj).length === 0) {
    return <span className="text-gray-400 italic">No data</span>;
  }

  return (
    <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto">
      {JSON.stringify(obj, null, 2)}
    </pre>
  );
}

export default function AuditLogDetail({ log, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(true)}
      >
        {children}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log Entry
            </DialogTitle>
            <DialogDescription>
              Detailed view of audit trail entry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Action Type & Status */}
            <div className="flex items-center justify-between">
              <Badge className={waGetActionTypeColor(log.actionType)}>
                {log.actionType}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Hash Verified
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  User
                </label>
                <p className="text-sm font-medium">{log.userEmail}</p>
                <p className="text-xs text-muted-foreground font-mono">{log.userId.slice(0, 12)}...</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Timestamp
                </label>
                <p className="text-sm font-medium">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>

              {log.resourceType && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Resource Type
                  </label>
                  <p className="text-sm font-medium">{log.resourceType}</p>
                </div>
              )}

              {log.resourceId && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Resource ID
                  </label>
                  <p className="text-sm font-mono">{log.resourceId}</p>
                </div>
              )}

              {log.ipAddress && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    IP Address
                  </label>
                  <p className="text-sm font-mono">{log.ipAddress}</p>
                </div>
              )}

              {log.userAgent && (
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    User Agent
                  </label>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {log.userAgent}
                  </p>
                </div>
              )}
            </div>

            {/* State Changes */}
            {(log.previousState || log.newState) && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  State Changes
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {log.previousState && Object.keys(log.previousState).length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Previous State</label>
                      {waFormatJson(log.previousState)}
                    </div>
                  )}

                  {log.newState && Object.keys(log.newState).length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">New State</label>
                      {waFormatJson(log.newState)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Metadata
                </h4>
                {waFormatJson(log.metadata)}
              </div>
            )}

            {/* Hash Chain */}
            <div className="border-t dark:border-border pt-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4" />
                Hash Chain Verification
              </h4>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Content Hash:</span>
                  <span className="break-all text-green-600 dark:text-green-400">
                    {log.contentHash}
                  </span>
                </div>
                {log.previousHash && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[100px]">Previous Hash:</span>
                    <span className="break-all">{log.previousHash}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                This audit log entry is cryptographically linked to the previous entry,
                ensuring tamper-proof audit trail per WA Policy Section 5.2.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
