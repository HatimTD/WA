'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { waGetAllCustomersForCache, waSearchNetSuiteCustomers } from '@/lib/actions/waNetsuiteActions';
import { NetSuiteCustomer } from '@/lib/integrations/netsuite';
import { Loader2, Building2, MapPin, Globe, Factory, Search, X, ChevronRight, FileText, Star, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { indexedDBCache } from '@/lib/cache/indexeddb-client';

// Extended customer type with optional case study info
// Case study data may be unavailable when using cached data (trade-off for speed)
type CustomerWithOptionalCases = NetSuiteCustomer & {
  caseStudyCount?: number;
  recentCaseStudies?: Array<{
    id: string;
    title: string | null;
    type: string;
    status: string;
    createdAt: Date;
  }>;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect?: (customer: NetSuiteCustomer) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export default function NetSuiteCustomerSearch({
  value,
  onChange,
  onCustomerSelect,
  label = 'Customer Name',
  required = false,
  placeholder = 'Click to search customers...',
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CustomerWithOptionalCases[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOptionalCases | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Subsidiary filtering for CONTRIBUTOR users
  const [userSubsidiaries, setUserSubsidiaries] = useState<{
    shouldFilter: boolean;
    subsidiaryIds: string[];
  } | null>(null);

  // Fetch user's subsidiaries on mount for filtering
  useEffect(() => {
    async function fetchUserSubsidiaries() {
      try {
        const response = await fetch('/api/user/subsidiaries');
        const result = await response.json();

        if (result.success && result.data) {
          setUserSubsidiaries({
            shouldFilter: result.data.shouldFilter,
            subsidiaryIds: result.data.subsidiaryIds,
          });
        }
      } catch (error) {
        console.error('[Customer Search] Failed to fetch user subsidiaries:', error);
      }
    }

    fetchUserSubsidiaries();
  }, []);

  // Sync internal state with value prop (for when parent resets value)
  useEffect(() => {
    if (!value && selectedCustomer) {
      setSelectedCustomer(null);
    }
  }, [value, selectedCustomer]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.length < 2) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Wait for user subsidiaries to load before filtering
        if (userSubsidiaries === null) {
          console.log('[Customer Search] Waiting for user subsidiaries to load...');
          setIsLoading(false);
          return;
        }

        let filteredCustomers: CustomerWithOptionalCases[] = [];

        // Try hybrid cache approach first
        try {
          // 1. Try IndexedDB cache first (browser-side)
          const cacheKey = 'netsuite:customers:all';
          let allCustomers = await indexedDBCache.get<CustomerWithOptionalCases[]>(cacheKey);

          // Check if cached data is stale (missing subsidiarynohierarchy field)
          if (allCustomers && allCustomers.length > 0) {
            // Check a larger sample to be more confident about data quality
            const sampleSize = Math.min(50, allCustomers.length);
            const sample = allCustomers.slice(0, sampleSize);
            const withSubsidiary = sample.filter(c => c.subsidiarynohierarchy && c.subsidiarynohierarchy !== '').length;
            const percentageWithData = (withSubsidiary / sampleSize) * 100;

            // If less than 80% have subsidiary data, consider it stale
            if (percentageWithData < 80) {
              console.log('[Hybrid Cache] ⚠️ STALE CACHE DETECTED - Low subsidiary data quality');
              console.log(`[Hybrid Cache] Only ${percentageWithData.toFixed(1)}% have subsidiary data`);
              console.log('[Hybrid Cache] Clearing old cache and refetching from server...');
              await indexedDBCache.del(cacheKey);
              allCustomers = null; // Force refetch
            } else {
              console.log(`[Hybrid Cache] IndexedDB HIT - ${allCustomers.length} customers (${percentageWithData.toFixed(1)}% have subsidiary data)`);
            }
          }

          if (!allCustomers || allCustomers.length === 0) {
            // 2. Not in IndexedDB or stale cache, fetch from server
            if (allCustomers && allCustomers.length === 0) {
              console.log('[Hybrid Cache] IndexedDB has empty data, clearing and refetching...');
              await indexedDBCache.del(cacheKey);
            } else {
              console.log('[Hybrid Cache] IndexedDB MISS, fetching from server...');
            }

            const result = await waGetAllCustomersForCache();

            if (result.success && result.customers && result.customers.length > 0) {
              allCustomers = result.customers;
              // 3. Cache in IndexedDB for 1 week
              await indexedDBCache.set(cacheKey, allCustomers, 604800000);
              console.log(`[Hybrid Cache] Cached ${allCustomers.length} customers in IndexedDB (with subsidiary data)`);
            }
          }

          // 4. Filter customers client-side based on search query AND subsidiaries
          if (allCustomers && allCustomers.length > 0) {
            const lowerQuery = searchQuery.toLowerCase();

            filteredCustomers = allCustomers
              .filter((customer) => {
                // Search query filter
                const companyName = (customer.companyName || '').toLowerCase();
                const entityId = (customer.entityId || '').toLowerCase();
                const city = (customer.city || '').toLowerCase();
                const industry = (customer.industry || '').toLowerCase();

                const matchesQuery = companyName.includes(lowerQuery) ||
                                    entityId.includes(lowerQuery) ||
                                    city.includes(lowerQuery) ||
                                    industry.includes(lowerQuery);

                if (!matchesQuery) return false;

                // Subsidiary filter (CONTRIBUTOR only)
                if (userSubsidiaries?.shouldFilter) {
                  // If customer has no subsidiary field, exclude them
                  if (!customer.subsidiarynohierarchy) {
                    return false;
                  }

                  // Check if customer's subsidiary matches any of user's subsidiaries
                  return userSubsidiaries.subsidiaryIds.includes(customer.subsidiarynohierarchy);
                }

                return true;
              })
              .slice(0, 10);
          }
        } catch (cacheError) {
          console.warn('[Hybrid Cache] Failed:', cacheError);
        }

        // FALLBACK: If hybrid cache returned nothing, use the old working search
        if (filteredCustomers.length === 0) {
          console.log('[Fallback] Hybrid cache empty, using direct search...');
          const fallbackResult = await waSearchNetSuiteCustomers(searchQuery);
          if (fallbackResult.success && fallbackResult.customers) {
            filteredCustomers = fallbackResult.customers;
            console.log(`[Fallback] Got ${filteredCustomers.length} customers from direct search`);
          }
        }

        setCustomers(filteredCustomers);

      } catch (error) {
        console.error('Search error:', error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, userSubsidiaries]); // Re-run when subsidiaries load

  const handleCustomerSelect = (customer: CustomerWithOptionalCases) => {
    setSelectedCustomer(customer);
    onChange(customer.companyName);
    setIsOpen(false);
    setSearchQuery('');
    setCustomers([]);

    if (onCustomerSelect) {
      // Pass base customer data to parent (without case study info)
      onCustomerSelect(customer);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(null);
    onChange('');
  };

  const handleOpenModal = () => {
    setSearchQuery('');
    setCustomers([]);
    setIsOpen(true);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="dark:text-foreground">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </Label>

      {/* Selector - use div to avoid nested button issue */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenModal();
          }
        }}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all cursor-pointer',
          'bg-white dark:bg-input hover:bg-gray-50 dark:hover:bg-accent',
          'border-border dark:border-border',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background',
          (selectedCustomer || value) ? 'border-primary dark:border-primary' : ''
        )}
      >
        {selectedCustomer ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">
                  {selectedCustomer.companyName}
                </span>
                {(selectedCustomer.caseStudyCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                    <FileText className="h-3 w-3" />
                    {selectedCustomer.caseStudyCount} case{selectedCustomer.caseStudyCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="font-medium text-primary">{selectedCustomer.entityId}</span>
                {selectedCustomer.city && (
                  <>
                    <span>•</span>
                    <span>{selectedCustomer.city}</span>
                  </>
                )}
                {selectedCustomer.country && (
                  <>
                    <span>•</span>
                    <span>{selectedCustomer.country}</span>
                  </>
                )}
              </div>
              {/* Show recent case study titles */}
              {selectedCustomer.recentCaseStudies && selectedCustomer.recentCaseStudies.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  Latest: {selectedCustomer.recentCaseStudies[0].title || 'Untitled case study'}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : value ? (
          /* Show existing value from props (e.g., when editing a case) */
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="font-medium text-foreground truncate">
                {value}
              </span>
              <div className="text-xs text-muted-foreground mt-0.5">
                Click to search and update customer
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Search className="h-5 w-5" />
            <span>{placeholder}</span>
          </div>
        )}
        {!selectedCustomer && !value && (
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Search Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b dark:border-border">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Search Customer
            </DialogTitle>
            <DialogDescription>
              Search by company name or customer ID (e.g., E9008)
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="px-6 py-4 border-b dark:border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type at least 2 characters to search..."
                className="pl-10 pr-10 h-12 text-base dark:bg-input"
                autoComplete="off"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px]">
            {/* Loading State */}
            {isLoading && searchQuery.length >= 2 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Searching customers...</span>
              </div>
            )}

            {/* Results List */}
            {!isLoading && customers.length > 0 && (
              <div className="divide-y dark:divide-border">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className={cn(
                      'w-full px-6 py-4 text-left transition-colors',
                      'hover:bg-accent dark:hover:bg-accent',
                      'focus:bg-accent dark:focus:bg-accent focus:outline-none'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Company Name with Case Study Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-base">
                            {customer.companyName}
                          </span>
                          {(customer.caseStudyCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              <FileText className="h-3 w-3" />
                              {customer.caseStudyCount} case{customer.caseStudyCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Entity ID */}
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium text-primary">{customer.entityId}</span>
                          <span className="mx-2">•</span>
                          <span>ID: {customer.internalId}</span>
                        </div>

                        {/* Location Info */}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          {customer.city && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{customer.city}</span>
                            </div>
                          )}
                          {customer.country && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5" />
                              <span>{customer.country}</span>
                            </div>
                          )}
                          {customer.industry && (
                            <div className="flex items-center gap-1.5">
                              <Factory className="h-3.5 w-3.5" />
                              <span>{customer.industry}</span>
                            </div>
                          )}
                        </div>

                        {/* Recent Case Studies */}
                        {customer.recentCaseStudies && customer.recentCaseStudies.length > 0 && (
                          <div className="mt-3 pt-2 border-t dark:border-border">
                            <div className="text-xs font-medium text-muted-foreground mb-1.5">Recent Case Studies:</div>
                            <div className="space-y-1">
                              {customer.recentCaseStudies.slice(0, 2).map((cs) => (
                                <div key={cs.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {cs.type === 'STAR' && <Star className="h-3 w-3 text-yellow-500" />}
                                  {cs.type === 'TECH' && <Cpu className="h-3 w-3 text-purple-500" />}
                                  {cs.type === 'APPLICATION' && <FileText className="h-3 w-3 text-green-500" />}
                                  <span className="truncate">{cs.title || 'Untitled'}</span>
                                  <span className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-medium',
                                    cs.status === 'PUBLISHED' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                                    cs.status === 'APPROVED' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                    cs.status === 'SUBMITTED' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                                    cs.status === 'DRAFT' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                  )}>
                                    {cs.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && customers.length === 0 && searchQuery.length >= 2 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                  <Building2 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="font-semibold text-foreground mb-1">Customer not found</p>
                <p className="text-sm text-muted-foreground">
                  No customers match "{searchQuery}"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Contact support to add this customer to NetSuite
                </p>
              </div>
            )}

            {/* Empty State - Before Search */}
            {!isLoading && customers.length === 0 && searchQuery.length < 2 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">Search for a customer</p>
                <p className="text-sm text-muted-foreground">
                  Enter a company name or customer ID to get started
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
