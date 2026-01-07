'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import NetSuiteCustomerSearch from '@/components/netsuite-customer-search';
import { NetSuiteCustomer } from '@/lib/integrations/netsuite';
import LocationAutocomplete from '@/components/location-autocomplete';
import { useMasterList } from '@/lib/hooks/use-master-list';
import { Star, Plus, X } from 'lucide-react';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
  customerReadOnly?: boolean; // When customer was selected in Qualifier step
};

// Fallback values if Master List API fails
const FALLBACK_INDUSTRIES = [
  { id: 'mining', value: 'Mining & Quarrying', sortOrder: 0 },
  { id: 'cement', value: 'Cement', sortOrder: 1 },
  { id: 'steel', value: 'Steel & Metal Processing', sortOrder: 2 },
  { id: 'power', value: 'Power Generation', sortOrder: 3 },
  { id: 'pulp', value: 'Pulp & Paper', sortOrder: 4 },
  { id: 'oil', value: 'Oil & Gas', sortOrder: 5 },
  { id: 'chemical', value: 'Chemical & Petrochemical', sortOrder: 6 },
  { id: 'marine', value: 'Marine', sortOrder: 7 },
  { id: 'agriculture', value: 'Agriculture', sortOrder: 8 },
  { id: 'construction', value: 'Construction', sortOrder: 9 },
  { id: 'recycling', value: 'Recycling', sortOrder: 10 },
  { id: 'other', value: 'Other', sortOrder: 11 },
];

// Default wear types - actual values come from master data and can include custom types
const FALLBACK_WEAR_TYPES = [
  { id: 'abrasion', value: 'ABRASION', label: 'Abrasion', sortOrder: 0 },
  { id: 'impact', value: 'IMPACT', label: 'Impact', sortOrder: 1 },
  { id: 'corrosion', value: 'CORROSION', label: 'Corrosion', sortOrder: 2 },
  { id: 'temperature', value: 'TEMPERATURE', label: 'High Temperature', sortOrder: 3 },
  { id: 'metal_metal', value: 'METAL_METAL', label: 'Metal-Metal', sortOrder: 4 },
  { id: 'combination', value: 'COMBINATION', label: 'Combination', sortOrder: 5 },
];

export default function StepTwo({ formData, updateFormData, customerReadOnly = false }: Props) {
  // Fetch master list data from API
  const { items: industries, isLoading: industriesLoading } = useMasterList('Industry', FALLBACK_INDUSTRIES);
  const { items: wearTypes, isLoading: wearTypesLoading } = useMasterList('WearType', FALLBACK_WEAR_TYPES);

  // Helper to check if a wearType value is selected (case-insensitive)
  const waIsWearTypeSelected = (value: string): boolean => {
    const current = formData.wearType || [];
    return current.some((w) => w.toUpperCase() === value.toUpperCase());
  };

  const toggleWearType = (value: string) => {
    const current = formData.wearType || [];
    // Normalize to uppercase for Prisma enum compatibility
    const normalizedValue = value.toUpperCase();
    const isSelected = current.some((w) => w.toUpperCase() === normalizedValue);

    const updated = isSelected
      ? current.filter((w) => w.toUpperCase() !== normalizedValue)
      : [...current, normalizedValue]; // Store as uppercase
    updateFormData({ wearType: updated });
  };

  const handleCustomerSelect = (customer: NetSuiteCustomer) => {
    // Auto-fill fields from NetSuite customer data
    const updates: Partial<CaseStudyFormData> = {
      customerName: customer.companyName,
    };

    if (customer.city) {
      updates.location = customer.city;
    }
    if (customer.country) {
      updates.country = customer.country;
    }
    if (customer.industry) {
      updates.industry = customer.industry;
    }

    console.log(`[NetSuite] Customer selected:`, customer.companyName);

    updateFormData(updates);
  };

  return (
    <div className="space-y-6">
      {/* Case Study Title - Full width */}
      <div className="space-y-2">
        <Label htmlFor="title" className="dark:text-foreground">
          Case Study Title <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., Crusher Hammer Rebuild - ABC Mining"
          className="dark:bg-input dark:border-border dark:text-foreground"
          required
        />
        <p className="text-xs text-muted-foreground">
          A descriptive title that summarizes this case study
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Name - Read-only if selected in Qualifier step, otherwise searchable */}
        {customerReadOnly && formData.customerName ? (
          <div className="space-y-2">
            <Label className="dark:text-foreground">
              Customer Name <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-gray-50 dark:bg-muted border-border">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
                <span className="text-primary text-lg">🏢</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{formData.customerName}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Selected in previous step • Go back to change
                </p>
              </div>
            </div>
          </div>
        ) : (
          <NetSuiteCustomerSearch
            value={formData.customerName}
            onChange={(value) => updateFormData({ customerName: value })}
            onCustomerSelect={handleCustomerSelect}
            label="Customer Name"
            required
            placeholder="Click to search customers..."
          />
        )}

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="dark:text-foreground">
            Industry <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          {(() => {
            const isOther = formData.industry && !industries.some(i => i.value === formData.industry);
            const selectValue = isOther ? '__OTHER__' : formData.industry;
            return (
              <>
                <Select
                  value={selectValue}
                  onValueChange={(value) => {
                    if (value === '__OTHER__') {
                      updateFormData({ industry: '__CUSTOM__' }); // Trigger custom input
                    } else {
                      updateFormData({ industry: value });
                    }
                  }}
                  disabled={industriesLoading}
                >
                  <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                    <SelectValue placeholder={industriesLoading ? "Loading..." : "Select industry"} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-popover dark:border-border">
                    {industries
                      .filter((industry) => industry.value.toLowerCase() !== 'other')
                      .map((industry) => (
                        <SelectItem key={industry.id} value={industry.value}>
                          {industry.value}
                        </SelectItem>
                      ))}
                    <SelectItem value="__OTHER__">Other (specify)</SelectItem>
                  </SelectContent>
                </Select>
                {/* Show custom input when "Other" is selected */}
                {isOther && (
                  <Input
                    placeholder="Enter custom industry..."
                    value={formData.industry === '__CUSTOM__' ? '' : formData.industry}
                    onChange={(e) => updateFormData({ industry: e.target.value || '__CUSTOM__' })}
                    className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                    autoFocus
                  />
                )}
              </>
            );
          })()}
        </div>

        {/* Location - Google Places Autocomplete */}
        <LocationAutocomplete
          value={formData.location}
          onChange={(value) => updateFormData({ location: value })}
          onPlaceSelect={(place) => {
            updateFormData({
              location: place.city || place.fullAddress,
              country: place.country || formData.country,
            });
          }}
          label="Location (City/Plant)"
          required
          placeholder="Search for a city..."
        />

        {/* Country - Auto-filled from location selection */}
        <div className="space-y-2">
          <Label htmlFor="country" className="dark:text-foreground">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => updateFormData({ country: e.target.value })}
            placeholder="Auto-filled from location or enter manually"
            className="dark:bg-input dark:border-border dark:text-foreground"
          />
        </div>

        {/* Component/Workpiece */}
        <div className="space-y-2">
          <Label htmlFor="componentWorkpiece" className="dark:text-foreground">
            Component/Workpiece <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Input
            id="componentWorkpiece"
            value={formData.componentWorkpiece}
            onChange={(e) => updateFormData({ componentWorkpiece: e.target.value })}
            placeholder="e.g., Crusher Hammers"
            className="dark:bg-input dark:border-border dark:text-foreground"
            required
          />
        </div>

        {/* Work Type */}
        <div className="space-y-2">
          <Label htmlFor="workType" className="dark:text-foreground">
            Work Type <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Select value={formData.workType} onValueChange={(value) => updateFormData({ workType: value as any })}>
            <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder="Select work type" />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              <SelectItem value="WORKSHOP">Workshop</SelectItem>
              <SelectItem value="ON_SITE">On Site</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Type - Preventive, Corrective, etc. */}
        <div className="space-y-2">
          <Label htmlFor="jobType" className="dark:text-foreground">
            Job Type <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Select
            value={formData.jobType}
            onValueChange={(value) => {
              updateFormData({ jobType: value as any });
              if (value !== 'OTHER') {
                updateFormData({ jobTypeOther: '' });
              }
            }}
          >
            <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              <SelectItem value="PREVENTIVE">Preventive</SelectItem>
              <SelectItem value="CORRECTIVE">Corrective</SelectItem>
              <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
              <SelectItem value="OTHER">Other (specify)</SelectItem>
            </SelectContent>
          </Select>
          {formData.jobType === 'OTHER' && (
            <Input
              placeholder="Enter custom job type..."
              value={formData.jobTypeOther}
              onChange={(e) => updateFormData({ jobTypeOther: e.target.value })}
              className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
              autoFocus
            />
          )}
        </div>

        {/* Base Metal - BRD 3.3 Required */}
        <div className="space-y-2">
          <Label htmlFor="baseMetal" className="dark:text-foreground">
            Base Metal <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Input
            id="baseMetal"
            value={formData.baseMetal}
            onChange={(e) => updateFormData({ baseMetal: e.target.value })}
            placeholder="e.g., Mild Steel"
            className="dark:bg-input dark:border-border dark:text-foreground"
            required
          />
        </div>

        {/* Unit System Selector */}
        <div className="space-y-2">
          <Label className="dark:text-foreground">Unit System</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateFormData({ unitSystem: 'METRIC' })}
              className={`
                flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all
                ${formData.unitSystem === 'METRIC'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                }
              `}
            >
              Metric (mm, cm)
            </button>
            <button
              type="button"
              onClick={() => updateFormData({ unitSystem: 'IMPERIAL' })}
              className={`
                flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all
                ${formData.unitSystem === 'IMPERIAL'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                }
              `}
            >
              Imperial (in, ft)
            </button>
          </div>
        </div>

        {/* General Dimensions - BRD 3.3 Required */}
        <div className="space-y-2">
          <Label htmlFor="generalDimensions" className="dark:text-foreground">
            General Dimensions <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Input
            id="generalDimensions"
            value={formData.generalDimensions}
            onChange={(e) => updateFormData({ generalDimensions: e.target.value })}
            placeholder={formData.unitSystem === 'IMPERIAL' ? 'e.g., 20in x 8in' : 'e.g., 500mm x 200mm'}
            className="dark:bg-input dark:border-border dark:text-foreground"
            required
          />
        </div>

        {/* OEM - Original Equipment Manufacturer (BRD Section 5) */}
        <div className="space-y-2">
          <Label htmlFor="oem" className="dark:text-foreground">OEM (Original Equipment Manufacturer)</Label>
          <Input
            id="oem"
            value={formData.oem}
            onChange={(e) => updateFormData({ oem: e.target.value })}
            placeholder="e.g., Caterpillar, Komatsu, Liebherr"
            className="dark:bg-input dark:border-border dark:text-foreground"
          />
        </div>

        {/* Job Duration - Hours + Days + Weeks combined */}
        <div className="space-y-2">
          <Label className="dark:text-foreground">Job Duration</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                value={formData.jobDurationHours || ''}
                onChange={(e) => updateFormData({ jobDurationHours: e.target.value })}
                placeholder="0"
                className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
              />
              <span className="text-sm text-muted-foreground font-medium">h</span>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                value={formData.jobDurationDays || ''}
                onChange={(e) => updateFormData({ jobDurationDays: e.target.value })}
                placeholder="0"
                className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
              />
              <span className="text-sm text-muted-foreground font-medium">d</span>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                value={formData.jobDurationWeeks || ''}
                onChange={(e) => updateFormData({ jobDurationWeeks: e.target.value })}
                placeholder="0"
                className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
              />
              <span className="text-sm text-muted-foreground font-medium">w</span>
            </div>
          </div>
        </div>
      </div>

      {/* Type of Wear - Star rating */}
      <div className="space-y-2">
        <Label className="dark:text-foreground flex items-center gap-1.5 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Type of Wear <span className="text-red-500 dark:text-red-400">*</span>
        </Label>

        {wearTypesLoading ? (
          <span className="text-xs text-muted-foreground">Loading...</span>
        ) : (
          <div className="space-y-1.5">
            {wearTypes.map((wear) => {
              const displayLabel = (wear as any).label || wear.value;
              const severity = formData.wearSeverities?.[wear.value.toUpperCase()] || 0;

              return (
                <div key={wear.id} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-24 shrink-0">{displayLabel}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          const newSeverity = severity === level ? 0 : level;
                          const newSeverities = { ...formData.wearSeverities };
                          const wearKey = wear.value.toUpperCase();

                          if (newSeverity === 0) {
                            delete newSeverities[wearKey];
                            updateFormData({
                              wearType: (formData.wearType || []).filter(w => w.toUpperCase() !== wearKey),
                              wearSeverities: newSeverities
                            });
                          } else {
                            const currentTypes = formData.wearType || [];
                            const hasType = currentTypes.some(w => w.toUpperCase() === wearKey);
                            updateFormData({
                              wearType: hasType ? currentTypes : [...currentTypes, wearKey],
                              wearSeverities: { ...newSeverities, [wearKey]: newSeverity }
                            });
                          }
                        }}
                        className="p-0.5 transition-transform hover:scale-110"
                        aria-label={`${displayLabel} severity ${level}`}
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            level <= severity
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-transparent text-gray-300 dark:text-gray-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Other wear types - multiple entries */}
            {(formData.wearTypeOthers || []).map((other, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Other..."
                  value={other.name}
                  onChange={(e) => {
                    const newOthers = [...(formData.wearTypeOthers || [])];
                    newOthers[index] = { ...newOthers[index], name: e.target.value };
                    updateFormData({ wearTypeOthers: newOthers });
                  }}
                  className="h-6 text-xs w-24 shrink-0 dark:bg-input dark:border-border"
                />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        const newOthers = [...(formData.wearTypeOthers || [])];
                        newOthers[index] = {
                          ...newOthers[index],
                          severity: other.severity === level ? 0 : level
                        };
                        updateFormData({ wearTypeOthers: newOthers });
                      }}
                      className="p-0.5 transition-transform hover:scale-110"
                      aria-label={`${other.name || 'Other'} severity ${level}`}
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          level <= other.severity
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent text-gray-300 dark:text-gray-600 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newOthers = (formData.wearTypeOthers || []).filter((_, i) => i !== index);
                    updateFormData({ wearTypeOthers: newOthers });
                  }}
                  className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove other wear type"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add Other button */}
            <button
              type="button"
              onClick={() => {
                const newOthers = [...(formData.wearTypeOthers || []), { name: '', severity: 0 }];
                updateFormData({ wearTypeOthers: newOthers });
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add other</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
