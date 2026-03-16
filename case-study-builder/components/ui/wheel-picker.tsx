'use client';

import {
  WheelPicker as WheelPickerPrimitive,
  WheelPickerWrapper as WheelPickerWrapperPrimitive,
  type WheelPickerOption,
  type WheelPickerClassNames,
} from '@ncdai/react-wheel-picker';
import { cn } from '@/lib/utils';

export type { WheelPickerOption };

/**
 * Styled WheelPickerWrapper component
 */
export function WheelPickerWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<typeof WheelPickerWrapperPrimitive>) {
  return (
    <WheelPickerWrapperPrimitive
      className={cn(
        'relative flex h-[140px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-background',
        className
      )}
      {...props}
    >
      {/* Selection highlight bar */}
      <div className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-10 -translate-y-1/2 rounded-md bg-muted/50 dark:bg-muted/30" />
      {/* Top gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-background to-transparent" />
      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-background to-transparent" />
      {children}
    </WheelPickerWrapperPrimitive>
  );
}

/**
 * Styled WheelPicker component
 */
const wheelPickerClassNames: WheelPickerClassNames = {
  optionItem:
    'cursor-pointer text-muted-foreground transition-colors data-[selected=true]:text-foreground data-[selected=true]:font-semibold',
};

export function WheelPicker<T extends string | number = string>({
  classNames,
  ...props
}: React.ComponentProps<typeof WheelPickerPrimitive<T>>) {
  return (
    <WheelPickerPrimitive<T>
      classNames={{
        ...wheelPickerClassNames,
        ...classNames,
      }}
      {...props}
    />
  );
}

/**
 * Create array of options for wheel picker
 */
export function waCreateWheelOptions(
  count: number,
  startFrom: number = 0,
  labelSuffix?: string
): WheelPickerOption<number>[] {
  return Array.from({ length: count }, (_, i) => {
    const value = i + startFrom;
    return {
      label: labelSuffix ? `${value} ${labelSuffix}` : String(value),
      value,
    };
  });
}

/**
 * Compact Time Unit Wheel Picker
 * Designed for selecting hours, days, weeks, months, years
 */
export function TimeUnitWheelPicker({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  options: WheelPickerOption<number>[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative flex h-[120px] w-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
        {/* Selection highlight bar */}
        <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-8 -translate-y-1/2 rounded-md bg-primary/10 dark:bg-primary/20" />
        {/* Top gradient fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-background to-transparent" />
        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-t from-background to-transparent" />
        <WheelPickerPrimitive<number>
          options={options}
          value={typeof value === 'string' ? parseInt(value) || 0 : value}
          onValueChange={onChange}
          classNames={{
            optionItem:
              'cursor-pointer text-sm text-muted-foreground transition-colors data-[selected=true]:text-foreground data-[selected=true]:font-bold',
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
