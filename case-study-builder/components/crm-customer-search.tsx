'use client';

/**
 * Unified CRM Customer Search Component (BRD 3.4D - Dual CRM Strategy)
 *
 * Supports both Insightly CRM and NetSuite ERP for customer lookup.
 * Per BRD:
 * - Insightly: Primary CRM for sales pipeline and Challenge Qualifier
 * - NetSuite: ERP for finance/accounting customer data
 *
 * Allows users to switch between CRM sources or search both simultaneously.
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { waSearchInsightlyOrganizations } from '@/lib/actions/waInsightlyActions';
import { waSearchNetSuiteCustomers } from '@/lib/actions/waNetsuiteActions';
import { InsightlyOrganization } from '@/lib/integrations/insightly';
import { NetSuiteCustomer } from '@/lib/integrations/netsuite';
import { Loader2, Building2, MapPin, Globe, Factory, Phone, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Unified customer type for display
export type CRMCustomer = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  phone?: string;
  website?: string;
  source: 'insightly' | 'netsuite';
  rawData: InsightlyOrganization | NetSuiteCustomer;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect?: (customer: CRMCustomer) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  defaultCRM?: 'insightly' | 'netsuite' | 'both';
};

export default function CRMCustomerSearch({
  value,
  onChange,
  onCustomerSelect,
  label = 'Customer Name',
  required = false,
  placeholder = 'Search CRM customers or enter new...',
  className,
  defaultCRM = 'insightly', // Insightly is primary per BRD
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeCRM, setActiveCRM] = useState<'insightly' | 'netsuite' | 'both'>(defaultCRM);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        const results: CRMCustomer[] = [];

        // Search Insightly
        if (activeCRM === 'insightly' || activeCRM === 'both') {
          const insightlyResult = await waSearchInsightlyOrganizations(searchQuery);
          if (insightlyResult.success && insightlyResult.organizations) {
            results.push(
              ...insightlyResult.organizations.map((org): CRMCustomer => ({
                id: `insightly-${org.id}`,
                name: org.name,
                city: org.city,
                state: org.state,
                country: org.country,
                industry: org.industry,
                phone: org.phone,
                website: org.website,
                source: 'insightly',
                rawData: org,
              }))
            );
          }
        }

        // Search NetSuite
        if (activeCRM === 'netsuite' || activeCRM === 'both') {
          const netsuiteResult = await waSearchNetSuiteCustomers(searchQuery);
          if (netsuiteResult.success && netsuiteResult.customers) {
            results.push(
              ...netsuiteResult.customers.map((cust): CRMCustomer => ({
                id: `netsuite-${cust.id}`,
                name: cust.companyName,
                city: cust.city,
                country: cust.country,
                industry: cust.industry,
                source: 'netsuite',
                rawData: cust,
              }))
            );
          }
        }

        // Sort: Exact matches first, then by source priority (Insightly first)
        results.sort((a, b) => {
          const aExact = a.name.toLowerCase() === searchQuery.toLowerCase();
          const bExact = b.name.toLowerCase() === searchQuery.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          if (a.source === 'insightly' && b.source !== 'insightly') return -1;
          if (a.source !== 'insightly' && b.source === 'insightly') return 1;
          return 0;
        });

        setCustomers(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error('CRM search error:', error);
        setCustomers([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, activeCRM]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleCustomerSelect = (customer: CRMCustomer) => {
    onChange(customer.name);
    setSearchQuery(customer.name);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onCustomerSelect) {
      onCustomerSelect(customer);
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    // Keep the current value as manual entry
    if (onCustomerSelect) {
      onCustomerSelect({
        id: `manual-${Date.now()}`,
        name: value,
        source: 'insightly', // Default to Insightly for new entries
        rawData: {} as any,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || customers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < customers.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < customers.length) {
          handleCustomerSelect(customers[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getSourceBadge = (source: 'insightly' | 'netsuite') => {
    if (source === 'insightly') {
      return (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          Insightly
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
        NetSuite
      </span>
    );
  };

  return (
    <div ref={wrapperRef} className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="crm-customer-search" className="dark:text-foreground">
          {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </Label>

        {/* CRM Source Selector */}
        <Tabs value={activeCRM} onValueChange={(v) => setActiveCRM(v as any)} className="h-7">
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="insightly" className="h-6 px-2 text-xs">
              Insightly
            </TabsTrigger>
            <TabsTrigger value="netsuite" className="h-6 px-2 text-xs">
              NetSuite
            </TabsTrigger>
            <TabsTrigger value="both" className="h-6 px-2 text-xs">
              Both
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative">
        <Input
          id="crm-customer-search"
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (customers.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="dark:bg-input dark:border-border dark:text-foreground pr-10"
          required={required}
          autoComplete="off"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-popover border border-border dark:border-border rounded-md shadow-lg max-h-[350px] overflow-y-auto">
            {customers.length > 0 ? (
              <div className="py-1">
                {customers.map((customer, index) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-accent dark:hover:bg-accent transition-colors',
                      'focus:bg-accent dark:focus:bg-accent focus:outline-none',
                      selectedIndex === index && 'bg-accent dark:bg-accent'
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'mt-0.5 p-2 rounded',
                        customer.source === 'insightly'
                          ? 'bg-blue-100 dark:bg-blue-900/50'
                          : 'bg-purple-100 dark:bg-purple-900/50'
                      )}>
                        <Building2 className={cn(
                          'h-4 w-4',
                          customer.source === 'insightly'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-purple-600 dark:text-purple-400'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground dark:text-foreground truncate">
                            {customer.name}
                          </span>
                          {getSourceBadge(customer.source)}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                          {customer.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{customer.city}{customer.state ? `, ${customer.state}` : ''}</span>
                            </div>
                          )}
                          {customer.country && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>{customer.country}</span>
                            </div>
                          )}
                          {customer.industry && (
                            <div className="flex items-center gap-1">
                              <Factory className="h-3 w-3" />
                              <span>{customer.industry}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Add new customer option */}
                {searchQuery.length >= 2 && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="w-full px-4 py-3 text-left hover:bg-accent dark:hover:bg-accent transition-colors border-t border-border"
                  >
                    <div className="flex items-center gap-3 text-primary">
                      <Plus className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Create new customer: "{value}"
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ) : (
              searchQuery.length >= 2 && !isLoading && (
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center mb-3">
                    No customers found for "{searchQuery}"
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleCreateNew}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create new customer
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {searchQuery.length >= 2 && (
        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
          {isLoading
            ? `Searching ${activeCRM === 'both' ? 'Insightly & NetSuite' : activeCRM}...`
            : `${customers.length} customer(s) found in ${activeCRM === 'both' ? 'both CRMs' : activeCRM}`}
        </p>
      )}
    </div>
  );
}
