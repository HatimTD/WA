import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import CRMCustomerSearch, { CRMCustomer } from '@/components/crm-customer-search';
import LocationAutocomplete from '@/components/location-autocomplete';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

const INDUSTRIES = [
  'Mining & Quarrying',
  'Cement',
  'Steel & Metal Processing',
  'Power Generation',
  'Pulp & Paper',
  'Oil & Gas',
  'Chemical & Petrochemical',
  'Marine',
  'Agriculture',
  'Construction',
  'Recycling',
  'Other',
];

const WEAR_TYPES = [
  { value: 'ABRASION', label: 'Abrasion' },
  { value: 'IMPACT', label: 'Impact' },
  { value: 'CORROSION', label: 'Corrosion' },
  { value: 'TEMPERATURE', label: 'High Temperature' },
  { value: 'COMBINATION', label: 'Combination' },
];

export default function StepTwo({ formData, updateFormData }: Props) {
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
          <Select value={formData.industry} onValueChange={(value) => updateFormData({ industry: value })}>
            <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
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

        {/* Base Metal */}
        <div className="space-y-2">
          <Label htmlFor="baseMetal" className="dark:text-foreground">Base Metal</Label>
          <Input
            id="baseMetal"
            value={formData.baseMetal}
            onChange={(e) => updateFormData({ baseMetal: e.target.value })}
            placeholder="e.g., Mild Steel"
            className="dark:bg-input dark:border-border dark:text-foreground"
          />
        </div>

        {/* General Dimensions */}
        <div className="space-y-2">
          <Label htmlFor="generalDimensions" className="dark:text-foreground">General Dimensions</Label>
          <Input
            id="generalDimensions"
            value={formData.generalDimensions}
            onChange={(e) => updateFormData({ generalDimensions: e.target.value })}
            placeholder="e.g., 500mm x 200mm"
            className="dark:bg-input dark:border-border dark:text-foreground"
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
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {WEAR_TYPES.map((wear) => (
            <div key={wear.value} className="flex items-center space-x-2">
              <Checkbox
                id={wear.value}
                checked={formData.wearType?.includes(wear.value)}
                onCheckedChange={() => toggleWearType(wear.value)}
              />
              <Label htmlFor={wear.value} className="font-normal cursor-pointer dark:text-foreground">
                {wear.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
