'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import CRMCustomerSearch, { CRMCustomer } from '@/components/crm-customer-search';
import LocationAutocomplete from '@/components/location-autocomplete';
import { useMasterList } from '@/lib/hooks/use-master-list';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
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

const FALLBACK_WEAR_TYPES = [
  { id: 'abrasion', value: 'Abrasion', sortOrder: 0 },
  { id: 'impact', value: 'Impact', sortOrder: 1 },
  { id: 'corrosion', value: 'Corrosion', sortOrder: 2 },
  { id: 'temperature', value: 'High Temperature', sortOrder: 3 },
  { id: 'combination', value: 'Combination', sortOrder: 4 },
];

export default function StepTwo({ formData, updateFormData }: Props) {
  // Fetch master list data from API
  const { items: industries, isLoading: industriesLoading } = useMasterList('Industry', FALLBACK_INDUSTRIES);
  const { items: wearTypes, isLoading: wearTypesLoading } = useMasterList('WearType', FALLBACK_WEAR_TYPES);

  const toggleWearType = (value: string) => {
    const current = formData.wearType || [];
    const updated = current.includes(value)
      ? current.filter((w) => w !== value)
      : [...current, value];
    updateFormData({ wearType: updated });
  };

  const handleCRMCustomerSelect = (customer: CRMCustomer) => {
    // Auto-fill fields from CRM data (Insightly or NetSuite)
    const updates: Partial<CaseStudyFormData> = {
      customerName: customer.name,
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

    // Store CRM source for tracking (could be added to form data if needed)
    console.log(`[CRM] Customer selected from ${customer.source}:`, customer.name);

    updateFormData(updates);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Name - Dual CRM Integration (BRD 3.4D) */}
        <CRMCustomerSearch
          value={formData.customerName}
          onChange={(value) => updateFormData({ customerName: value })}
          onCustomerSelect={handleCRMCustomerSelect}
          label="Customer Name"
          required
          placeholder="Search CRM customers or enter new..."
          defaultCRM="insightly"
        />

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="dark:text-foreground">
            Industry <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Select value={formData.industry} onValueChange={(value) => updateFormData({ industry: value })} disabled={industriesLoading}>
            <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder={industriesLoading ? "Loading..." : "Select industry"} />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              {industries.map((industry) => (
                <SelectItem key={industry.id} value={industry.value}>
                  {industry.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {/* General Dimensions - BRD 3.3 Required */}
        <div className="space-y-2">
          <Label htmlFor="generalDimensions" className="dark:text-foreground">
            General Dimensions <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Input
            id="generalDimensions"
            value={formData.generalDimensions}
            onChange={(e) => updateFormData({ generalDimensions: e.target.value })}
            placeholder="e.g., 500mm x 200mm"
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
      </div>

      {/* Wear Type */}
      <div className="space-y-3">
        <Label className="dark:text-foreground">
          Type of Wear <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          {wearTypesLoading ? 'Loading wear types...' : 'Select all that apply'}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wearTypes.map((wear) => (
            <div key={wear.id} className="flex items-center space-x-2">
              <Checkbox
                id={wear.id}
                checked={formData.wearType?.includes(wear.value)}
                onCheckedChange={() => toggleWearType(wear.value)}
                disabled={wearTypesLoading}
              />
              <Label htmlFor={wear.id} className="font-normal cursor-pointer dark:text-foreground">
                {wear.value}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
