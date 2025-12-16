'use client';

/**
 * Insightly Customer Search Component (BRD 3.4D - CRM Integration)
 *
 * Provides customer search functionality using Insightly CRM API.
 * Per BRD, this should be used for Challenge Qualifier customer selection.
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waSearchInsightlyOrganizations } from '@/lib/actions/waInsightlyActions';
import { InsightlyOrganization } from '@/lib/integrations/insightly';
import { Loader2, Building2, MapPin, Globe, Factory, Phone, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect?: (customer: InsightlyOrganization) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export default function InsightlyCustomerSearch({
  value,
  onChange,
  onCustomerSelect,
  label = 'Customer Name',
  required = false,
  placeholder = 'Search Insightly CRM customers...',
  className,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<InsightlyOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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
        const result = await waSearchInsightlyOrganizations(searchQuery);
        if (result.success && result.organizations) {
          setCustomers(result.organizations);
          setIsOpen(result.organizations.length > 0);
        } else {
          setCustomers([]);
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Insightly search error:', error);
        setCustomers([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleCustomerSelect = (customer: InsightlyOrganization) => {
    onChange(customer.name);
    setSearchQuery(customer.name);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onCustomerSelect) {
      onCustomerSelect(customer);
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

  return (
    <div ref={wrapperRef} className={cn('space-y-2', className)}>
      <Label htmlFor="insightly-customer-search" className="dark:text-foreground">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </Label>

      <div className="relative">
        <Input
          id="insightly-customer-search"
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

        {/* Insightly badge */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              CRM
            </span>
          </div>
        )}

        {/* Dropdown */}
        {isOpen && customers.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-popover border border-border dark:border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
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
                    <div className="mt-0.5 p-2 bg-blue-100 dark:bg-blue-900/50 rounded">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground dark:text-foreground truncate">
                        {customer.name}
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                        ID: {customer.id}
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
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.website && (
                          <div className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{customer.website}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {isOpen && !isLoading && customers.length === 0 && searchQuery.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-popover border border-border dark:border-border rounded-md shadow-lg">
            <div className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground text-center">
              No customers found for "{searchQuery}"
              <br />
              <span className="text-xs">You can still enter the name manually</span>
            </div>
          </div>
        )}
      </div>

      {searchQuery.length >= 2 && (
        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
          {isLoading ? 'Searching Insightly CRM...' : `${customers.length} customer(s) found`}
        </p>
      )}
    </div>
  );
}
