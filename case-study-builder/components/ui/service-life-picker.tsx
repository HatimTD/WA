'use client';

import { useState, useEffect } from 'react';
import Picker from 'react-mobile-picker';
import { Button } from '@/components/ui/button';
import { Clock, X, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ServiceLifeValue {
  hours: number;
  days: number;
  weeks: number;
  months: number;
  years: number;
}

interface ServiceLifePickerProps {
  value: ServiceLifeValue;
  onChange: (value: ServiceLifeValue) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

// Generate options for each time unit
const waGenerateOptions = (max: number): string[] => {
  return ['--', ...Array.from({ length: max }, (_, i) => String(i + 1))];
};

const TIME_OPTIONS = {
  hours: waGenerateOptions(100),
  days: waGenerateOptions(365),
  weeks: waGenerateOptions(52),
  months: waGenerateOptions(24),
  years: waGenerateOptions(30),
};

const TIME_LABELS: Record<keyof ServiceLifeValue, string> = {
  hours: 'Hours',
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
  years: 'Years',
};

const TIME_SHORT_LABELS: Record<keyof ServiceLifeValue, string> = {
  hours: 'H',
  days: 'D',
  weeks: 'W',
  months: 'M',
  years: 'Y',
};

const TIME_MAX_VALUES: Record<keyof ServiceLifeValue, number> = {
  hours: 100,
  days: 365,
  weeks: 52,
  months: 24,
  years: 30,
};

/**
 * Format the service life value for display
 */
function waFormatServiceLife(value: ServiceLifeValue): string {
  const parts: string[] = [];

  if (value.years > 0) parts.push(`${value.years}y`);
  if (value.months > 0) parts.push(`${value.months}mo`);
  if (value.weeks > 0) parts.push(`${value.weeks}w`);
  if (value.days > 0) parts.push(`${value.days}d`);
  if (value.hours > 0) parts.push(`${value.hours}h`);

  return parts.length > 0 ? parts.join(' ') : 'Select duration';
}

/**
 * Convert ServiceLifeValue to picker format
 */
function waToPickerValue(value: ServiceLifeValue): Record<string, string> {
  return {
    hours: value.hours > 0 ? String(value.hours) : '--',
    days: value.days > 0 ? String(value.days) : '--',
    weeks: value.weeks > 0 ? String(value.weeks) : '--',
    months: value.months > 0 ? String(value.months) : '--',
    years: value.years > 0 ? String(value.years) : '--',
  };
}

/**
 * Convert picker value back to ServiceLifeValue
 */
function waFromPickerValue(pickerValue: Record<string, string>): ServiceLifeValue {
  return {
    hours: pickerValue.hours === '--' ? 0 : parseInt(pickerValue.hours) || 0,
    days: pickerValue.days === '--' ? 0 : parseInt(pickerValue.days) || 0,
    weeks: pickerValue.weeks === '--' ? 0 : parseInt(pickerValue.weeks) || 0,
    months: pickerValue.months === '--' ? 0 : parseInt(pickerValue.months) || 0,
    years: pickerValue.years === '--' ? 0 : parseInt(pickerValue.years) || 0,
  };
}

/**
 * Individual column with +/- buttons and editable input for desktop control
 */
function TimeColumn({
  name,
  label,
  value,
  options,
  onChange,
  maxValue,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
  onChange: (newValue: string) => void;
  maxValue: number;
}) {
  const currentIndex = options.indexOf(value);
  const numericValue = value === '--' ? 0 : parseInt(value) || 0;

  const waIncrement = () => {
    if (currentIndex < options.length - 1) {
      onChange(options[currentIndex + 1]);
    }
  };

  const waDecrement = () => {
    if (currentIndex > 0) {
      onChange(options[currentIndex - 1]);
    }
  };

  const waHandleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input (will be treated as 0)
    if (inputValue === '') {
      onChange('--');
      return;
    }

    // Only allow numbers
    const num = parseInt(inputValue);
    if (!isNaN(num)) {
      // Clamp to valid range
      const clampedValue = Math.max(0, Math.min(num, maxValue));
      if (clampedValue === 0) {
        onChange('--');
      } else {
        onChange(String(clampedValue));
      }
    }
  };

  const waHandleInputBlur = () => {
    // Ensure value is valid on blur
    if (value === '' || value === '--') {
      onChange('--');
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Up button */}
      <button
        type="button"
        onClick={waIncrement}
        disabled={numericValue >= maxValue}
        className="p-1 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      {/* Editable value input with label inside */}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value === '--' ? '' : value}
          onChange={waHandleInputChange}
          onBlur={waHandleInputBlur}
          placeholder="0"
          className="w-14 h-14 text-center text-lg font-bold text-foreground bg-muted/50 rounded-lg border-2 border-wa-green-500 focus:outline-none focus:ring-2 focus:ring-wa-green-500 focus:border-wa-green-600 pt-4"
        />
        {/* Label aligned inside the box at top */}
        <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-xs font-bold text-wa-green-600 uppercase">
          {label}
        </span>
      </div>

      {/* Down button */}
      <button
        type="button"
        onClick={waDecrement}
        disabled={numericValue <= 0}
        className="p-1 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

export function ServiceLifePicker({
  value,
  onChange,
  label,
  required,
  className,
}: ServiceLifePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState<Record<string, string>>(waToPickerValue(value));
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync temp value when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempValue(waToPickerValue(value));
    }
  }, [isOpen, value]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const waHandleConfirm = () => {
    onChange(waFromPickerValue(tempValue));
    setIsOpen(false);
  };

  const waHandleCancel = () => {
    setTempValue(waToPickerValue(value));
    setIsOpen(false);
  };

  const waHandleReset = () => {
    const resetValue = { hours: '--', days: '--', weeks: '--', months: '--', years: '--' };
    setTempValue(resetValue);
  };

  const waUpdateColumn = (column: string, newValue: string) => {
    setTempValue(prev => ({ ...prev, [column]: newValue }));
  };

  const hasValue = value.hours > 0 || value.days > 0 || value.weeks > 0 || value.months > 0 || value.years > 0;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left min-w-[180px]',
          'border-border bg-background hover:border-wa-green-400 hover:bg-muted/50',
          hasValue ? 'text-foreground' : 'text-muted-foreground',
          className
        )}
      >
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          {waFormatServiceLife(value)}
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={waHandleCancel}
          />

          {/* Modal Container - centered on desktop, bottom sheet on mobile */}
          <div className={cn(
            'fixed z-50',
            // Mobile: bottom sheet
            'inset-x-0 bottom-0',
            // Desktop: centered
            'md:inset-0 md:flex md:items-center md:justify-center md:p-4'
          )}>
            <div
              className={cn(
                'bg-background shadow-2xl w-full',
                // Mobile: rounded top, full width
                'rounded-t-2xl',
                // Desktop: rounded all, max width, centered
                'md:rounded-2xl md:max-w-md'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <button
                  type="button"
                  onClick={waHandleCancel}
                  className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-base font-semibold">
                  {label || 'Select Duration'}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <button
                  type="button"
                  onClick={waHandleConfirm}
                  className="p-2 -m-2 text-wa-green-600 hover:text-wa-green-700 font-semibold transition-colors"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>

              {/* Desktop: Column buttons with +/- and editable input */}
              {!isMobile && (
                <div className="p-4">
                  <div className="flex justify-center gap-2">
                    {(Object.keys(TIME_OPTIONS) as Array<keyof typeof TIME_OPTIONS>).map((name) => (
                      <TimeColumn
                        key={name}
                        name={name}
                        label={TIME_SHORT_LABELS[name]}
                        value={tempValue[name]}
                        options={TIME_OPTIONS[name]}
                        onChange={(newValue) => waUpdateColumn(name, newValue)}
                        maxValue={TIME_MAX_VALUES[name]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile: Wheel picker */}
              {isMobile && (
                <>
                  {/* Column Labels */}
                  <div className="flex justify-around px-4 pt-3 pb-1">
                    {(Object.keys(TIME_SHORT_LABELS) as Array<keyof ServiceLifeValue>).map((key) => (
                      <span
                        key={key}
                        className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex-1 text-center"
                      >
                        {TIME_SHORT_LABELS[key]}
                      </span>
                    ))}
                  </div>

                  {/* Picker with highlight */}
                  <div className="relative px-2">
                    {/* Selection highlight bar */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-10 bg-wa-green-100 dark:bg-wa-green-900/30 rounded-lg pointer-events-none z-0" />

                    <Picker
                      value={tempValue}
                      onChange={setTempValue}
                      height={200}
                      itemHeight={40}
                      wheelMode="natural"
                    >
                      {(Object.keys(TIME_OPTIONS) as Array<keyof typeof TIME_OPTIONS>).map((name) => (
                        <Picker.Column key={name} name={name}>
                          {TIME_OPTIONS[name].map((option) => (
                            <Picker.Item key={option} value={option}>
                              {({ selected }) => (
                                <span
                                  className={cn(
                                    'text-lg transition-all',
                                    selected
                                      ? 'text-foreground font-bold'
                                      : 'text-muted-foreground/50'
                                  )}
                                >
                                  {option}
                                </span>
                              )}
                            </Picker.Item>
                          ))}
                        </Picker.Column>
                      ))}
                    </Picker>
                  </div>
                </>
              )}

              {/* Current Selection Preview */}
              <div className="px-4 py-2 bg-muted/30 text-center">
                <span className="text-sm text-muted-foreground">Selected: </span>
                <span className="text-sm font-semibold text-foreground">
                  {waFormatServiceLife(waFromPickerValue(tempValue))}
                </span>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 p-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={waHandleReset}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={waHandleConfirm}
                  className="flex-1 bg-wa-green-600 hover:bg-wa-green-700"
                >
                  Confirm
                </Button>
              </div>

              {/* Safe area for mobile */}
              <div className="h-safe-area-inset-bottom md:hidden" />
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Default empty service life value
 */
export const DEFAULT_SERVICE_LIFE: ServiceLifeValue = {
  hours: 0,
  days: 0,
  weeks: 0,
  months: 0,
  years: 0,
};
