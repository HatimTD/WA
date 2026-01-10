'use client';

import { useMasterList } from '@/lib/hooks/use-master-list';

const FALLBACK_WEAR_TYPES = [
  { id: 'abrasion', value: 'ABRASION', label: 'Abrasion', sortOrder: 0 },
  { id: 'impact', value: 'IMPACT', label: 'Impact', sortOrder: 1 },
  { id: 'metal_metal', value: 'METAL_METAL', label: 'Metal-metal', sortOrder: 2 },
  { id: 'temperature', value: 'TEMPERATURE', label: 'Temperature', sortOrder: 3 },
  { id: 'corrosion', value: 'CORROSION', label: 'Corrosion', sortOrder: 4 },
  { id: 'other', value: 'OTHER', label: 'Other (*)', sortOrder: 5 },
];

type WearSeverities = Record<string, number>;

type WearTypeOther = {
  name: string;
  severity: number;
};

type Props = {
  wearTypes: string[];
  wearSeverities?: WearSeverities | null;
  wearTypeOthers?: WearTypeOther[] | null;
  segments?: number;
  showOnlySelected?: boolean;
};

/**
 * PDF-style compact wear type progress bars
 * Matches the exact design from progressbar.png - tiny thin horizontal dashes
 */
export default function WearTypeProgressBar({
  wearTypes,
  wearSeverities,
  wearTypeOthers,
  segments = 6,
  showOnlySelected = false,
}: Props) {
  const { items: masterWearTypes } = useMasterList('WearType', FALLBACK_WEAR_TYPES);
  const normalizedWearTypes = wearTypes.map((w) => w.toUpperCase());

  const waGetSeverity = (wearTypeValue: string): number => {
    if (!wearSeverities) return 0;
    const normalized = wearTypeValue.toUpperCase();
    return wearSeverities[normalized] || wearSeverities[wearTypeValue] || 0;
  };

  const waIsSelected = (wearTypeValue: string): boolean => {
    return normalizedWearTypes.includes(wearTypeValue.toUpperCase());
  };

  const displayWearTypes = showOnlySelected
    ? masterWearTypes.filter((wt) => waIsSelected(wt.value))
    : masterWearTypes;

  const customWearTypes = wearTypes.filter(
    (wt) => !masterWearTypes.some((m) => m.value.toUpperCase() === wt.toUpperCase())
  );

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 4,
  };

  const segmentsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 3,
  };

  return (
    <div className="inline-block font-sans">
      {displayWearTypes.map((wearType) => {
        const isSelected = waIsSelected(wearType.value);
        const severity = isSelected ? waGetSeverity(wearType.value) : 0;
        const displayLabel = (wearType as any).label || wearType.value;

        return (
          <div key={wearType.id || wearType.value} style={rowStyle}>
            <span className="text-xs text-foreground w-28 flex-shrink-0">{displayLabel}</span>
            <div style={segmentsContainerStyle}>
              {Array.from({ length: segments }).map((_, idx) => (
                <div
                  key={idx}
                  className={idx < severity ? 'bg-wa-green-600' : 'bg-gray-300 dark:bg-gray-600'}
                  style={{ width: 22, height: 8 }}
                />
              ))}
            </div>
          </div>
        );
      })}
      {customWearTypes.map((customType) => {
        const severity = waGetSeverity(customType);
        return (
          <div key={customType} style={rowStyle}>
            <span className="text-xs text-foreground w-28 flex-shrink-0">{customType}</span>
            <div style={segmentsContainerStyle}>
              {Array.from({ length: segments }).map((_, idx) => (
                <div
                  key={idx}
                  className={idx < severity ? 'bg-wa-green-600' : 'bg-gray-300 dark:bg-gray-600'}
                  style={{ width: 22, height: 8 }}
                />
              ))}
            </div>
          </div>
        );
      })}
      {/* User-added "Other" wear types */}
      {wearTypeOthers && wearTypeOthers.length > 0 && wearTypeOthers.map((other, index) => (
        <div key={`other-${index}`} style={rowStyle}>
          <span className="text-xs text-foreground w-28 flex-shrink-0">{other.name || 'Other'}</span>
          <div style={segmentsContainerStyle}>
            {Array.from({ length: segments }).map((_, idx) => (
              <div
                key={idx}
                className={idx < other.severity ? 'bg-wa-green-600' : 'bg-gray-300 dark:bg-gray-600'}
                style={{ width: 22, height: 8 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Interactive version for forms - clickable segments matching progressbar.png style
 */
export function InteractiveWearTypeBar({
  label,
  value,
  maxValue = 6,
  onChange,
}: {
  label: string;
  value: number;
  maxValue?: number;
  onChange: (newValue: number) => void;
}) {
  return (
    <div className="flex items-center mb-1 font-sans">
      <span className="text-xs text-foreground w-28 flex-shrink-0">
        {label}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: maxValue }).map((_, idx) => {
          const level = idx + 1;
          const isFilled = idx < value;
          return (
            <button
              key={idx}
              type="button"
              className={`no-min-touch transition-colors ${
                isFilled
                  ? 'bg-wa-green-600 hover:bg-wa-green-500'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-wa-green-200 dark:hover:bg-wa-green-800'
              }`}
              onClick={() => onChange(value === level ? 0 : level)}
              style={{
                width: 22,
                height: 8,
                minWidth: 22,
                minHeight: 8,
                maxWidth: 22,
                maxHeight: 8,
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
              }}
              aria-label={`Set ${label} to ${level}`}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Badge display for list cards
 */
export function WearTypeBadges({
  wearTypes,
  maxDisplay = 3,
}: {
  wearTypes: string[];
  maxDisplay?: number;
}) {
  const displayed = wearTypes.slice(0, maxDisplay);
  const remaining = wearTypes.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayed.map((wear) => (
        <span
          key={wear}
          className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium bg-wa-green-100 text-wa-green-800 dark:bg-wa-green-900/30 dark:text-wa-green-400"
        >
          {wear}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          +{remaining}
        </span>
      )}
    </div>
  );
}
