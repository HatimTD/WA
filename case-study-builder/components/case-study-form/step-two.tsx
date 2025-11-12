import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseStudyFormData } from '@/app/dashboard/new/page';

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

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Name */}
        <div className="space-y-2">
          <Label htmlFor="customerName">
            Customer Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => updateFormData({ customerName: e.target.value })}
            placeholder="e.g., ABC Mining Corp"
            required
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">
            Industry <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.industry} onValueChange={(value) => updateFormData({ industry: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">
            Location (City/Plant) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => updateFormData({ location: e.target.value })}
            placeholder="e.g., Perth Plant"
            required
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => updateFormData({ country: e.target.value })}
            placeholder="e.g., Australia"
          />
        </div>

        {/* Component/Workpiece */}
        <div className="space-y-2">
          <Label htmlFor="componentWorkpiece">
            Component/Workpiece <span className="text-red-500">*</span>
          </Label>
          <Input
            id="componentWorkpiece"
            value={formData.componentWorkpiece}
            onChange={(e) => updateFormData({ componentWorkpiece: e.target.value })}
            placeholder="e.g., Crusher Hammers"
            required
          />
        </div>

        {/* Work Type */}
        <div className="space-y-2">
          <Label htmlFor="workType">
            Work Type <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.workType} onValueChange={(value) => updateFormData({ workType: value as any })}>
            <SelectTrigger>
              <SelectValue placeholder="Select work type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WORKSHOP">Workshop</SelectItem>
              <SelectItem value="ON_SITE">On Site</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Base Metal */}
        <div className="space-y-2">
          <Label htmlFor="baseMetal">Base Metal</Label>
          <Input
            id="baseMetal"
            value={formData.baseMetal}
            onChange={(e) => updateFormData({ baseMetal: e.target.value })}
            placeholder="e.g., Mild Steel"
          />
        </div>

        {/* General Dimensions */}
        <div className="space-y-2">
          <Label htmlFor="generalDimensions">General Dimensions</Label>
          <Input
            id="generalDimensions"
            value={formData.generalDimensions}
            onChange={(e) => updateFormData({ generalDimensions: e.target.value })}
            placeholder="e.g., 500mm x 200mm"
          />
        </div>
      </div>

      {/* Wear Type */}
      <div className="space-y-3">
        <Label>
          Type of Wear <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {WEAR_TYPES.map((wear) => (
            <div key={wear.value} className="flex items-center space-x-2">
              <Checkbox
                id={wear.value}
                checked={formData.wearType?.includes(wear.value)}
                onCheckedChange={() => toggleWearType(wear.value)}
              />
              <Label htmlFor={wear.value} className="font-normal cursor-pointer">
                {wear.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
