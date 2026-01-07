'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CaseStudyFormData } from '@/app/dashboard/new/page';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

export default function StepWPS({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* BRD 3.3 Required Fields Notice */}
      <div className="bg-wa-green-50 border border-wa-green-200 rounded-lg p-4 dark:bg-accent dark:border-primary">
        <p className="text-sm text-wa-green-800 dark:text-muted-foreground">
          <span className="font-semibold dark:text-foreground">Tech Case Requirement:</span> WPS (Welding Procedure Specification) documentation is required for TECH and STAR case studies. Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </div>

      {/* Base Metal Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Base Metal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baseMetalType" className="dark:text-foreground">
              Base Metal Type <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="baseMetalType"
              value={formData.wps?.baseMetalType || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, baseMetalType: e.target.value } })}
              placeholder="e.g., Carbon Steel, Stainless Steel"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseMetalGrade" className="dark:text-foreground">Base Metal Grade</Label>
            <Input
              id="baseMetalGrade"
              value={formData.wps?.baseMetalGrade || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, baseMetalGrade: e.target.value } })}
              placeholder="e.g., ASTM A36, 316L"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseMetalThickness" className="dark:text-foreground">Base Metal Thickness</Label>
            <Input
              id="baseMetalThickness"
              value={formData.wps?.baseMetalThickness || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, baseMetalThickness: e.target.value } })}
              placeholder="e.g., 10mm, 0.5 inch"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surfacePreparation" className="dark:text-foreground">
              Surface Preparation <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="surfacePreparation"
              value={formData.wps?.surfacePreparation || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, surfacePreparation: e.target.value } })}
              placeholder="e.g., Grinding, Sandblasting"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>
        </div>
      </div>

      {/* WA Product Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">WA Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="waProductName" className="dark:text-foreground">WA Product Name <span className="text-red-500 dark:text-red-400">*</span></Label>
            <Input
              id="waProductName"
              value={formData.wps?.waProductName || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, waProductName: e.target.value } })}
              placeholder="e.g., CHROMIUM CARBIDE 600"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waProductDiameter" className="dark:text-foreground">Wire Diameter</Label>
            <Input
              id="waProductDiameter"
              value={formData.wps?.waProductDiameter || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, waProductDiameter: e.target.value } })}
              placeholder={formData.unitSystem === 'IMPERIAL' ? 'e.g., 0.047in, 0.063in' : 'e.g., 1.2mm, 1.6mm, 2.4mm'}
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Diameter of the welding wire used ({formData.unitSystem === 'IMPERIAL' ? 'inches' : 'millimeters'})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shieldingGas" className="dark:text-foreground">
              Shielding Gas <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="shieldingGas"
              value={formData.wps?.shieldingGas || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, shieldingGas: e.target.value } })}
              placeholder="e.g., Ar + 20% CO2"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shieldingFlowRate" className="dark:text-foreground">Shielding Flow Rate</Label>
            <Input
              id="shieldingFlowRate"
              value={formData.wps?.shieldingFlowRate || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, shieldingFlowRate: e.target.value } })}
              placeholder="e.g., 15 L/min"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flux" className="dark:text-foreground">Flux</Label>
            <Input
              id="flux"
              value={formData.wps?.flux || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, flux: e.target.value } })}
              placeholder="e.g., Neutral flux"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="standardDesignation" className="dark:text-foreground">Standard Designation</Label>
            <Input
              id="standardDesignation"
              value={formData.wps?.standardDesignation || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, standardDesignation: e.target.value } })}
              placeholder="e.g., AWS A5.18"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Welding Parameters Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Welding Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weldingProcess" className="dark:text-foreground">Welding Process <span className="text-red-500 dark:text-red-400">*</span></Label>
            <Input
              id="weldingProcess"
              value={formData.wps?.weldingProcess || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, weldingProcess: e.target.value } })}
              placeholder="e.g., FCAW, GMAW, SMAW"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentType" className="dark:text-foreground">Current Type</Label>
            <Input
              id="currentType"
              value={formData.wps?.currentType || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, currentType: e.target.value } })}
              placeholder="e.g., DC+, AC"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentModeSynergy" className="dark:text-foreground">Current Mode/Synergy</Label>
            <Input
              id="currentModeSynergy"
              value={formData.wps?.currentModeSynergy || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, currentModeSynergy: e.target.value } })}
              placeholder="e.g., CV, Synergic"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wireFeedSpeed" className="dark:text-foreground">Wire Feed Speed</Label>
            <Input
              id="wireFeedSpeed"
              value={formData.wps?.wireFeedSpeed || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, wireFeedSpeed: e.target.value } })}
              placeholder="e.g., 7 m/min"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity" className="dark:text-foreground">Intensity (Current)</Label>
            <Input
              id="intensity"
              value={formData.wps?.intensity || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, intensity: e.target.value } })}
              placeholder="e.g., 200A"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voltage" className="dark:text-foreground">Voltage</Label>
            <Input
              id="voltage"
              value={formData.wps?.voltage || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, voltage: e.target.value } })}
              placeholder="e.g., 26V"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heatInput" className="dark:text-foreground">Heat Input</Label>
            <Input
              id="heatInput"
              value={formData.wps?.heatInput || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, heatInput: e.target.value } })}
              placeholder="e.g., 1.5 kJ/mm"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weldingPosition" className="dark:text-foreground">
              Welding Position <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="weldingPosition"
              value={formData.wps?.weldingPosition || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, weldingPosition: e.target.value } })}
              placeholder="e.g., Flat (1G), Horizontal (2G)"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="torchAngle" className="dark:text-foreground">Torch Angle</Label>
            <Input
              id="torchAngle"
              value={formData.wps?.torchAngle || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, torchAngle: e.target.value } })}
              placeholder="e.g., 10-15°"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stickOut" className="dark:text-foreground">Stick Out / CTWD</Label>
            <Input
              id="stickOut"
              value={formData.wps?.stickOut || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, stickOut: e.target.value } })}
              placeholder="e.g., 15mm"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="travelSpeed" className="dark:text-foreground">Travel Speed</Label>
            <Input
              id="travelSpeed"
              value={formData.wps?.travelSpeed || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, travelSpeed: e.target.value } })}
              placeholder="e.g., 30 cm/min"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Oscillation Section - BRD 3.3 Required */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">
          Oscillation Details <span className="text-sm font-normal text-muted-foreground">(At least width or speed required)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="oscillationWidth" className="dark:text-foreground">
              Oscillation Width <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="oscillationWidth"
              value={formData.wps?.oscillationWidth || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationWidth: e.target.value } })}
              placeholder="e.g., 12mm"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oscillationSpeed" className="dark:text-foreground">Oscillation Speed</Label>
            <Input
              id="oscillationSpeed"
              value={formData.wps?.oscillationSpeed || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationSpeed: e.target.value } })}
              placeholder="e.g., 50 mm/s"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oscillationStepOver" className="dark:text-foreground">Step Over %</Label>
            <Input
              id="oscillationStepOver"
              value={formData.wps?.oscillationStepOver || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationStepOver: e.target.value } })}
              placeholder="e.g., 50%"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oscillationTempo" className="dark:text-foreground">Oscillation Tempo</Label>
            <Input
              id="oscillationTempo"
              value={formData.wps?.oscillationTempo || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationTempo: e.target.value } })}
              placeholder="e.g., 0.3s left, 0.3s right"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Temperature Section - BRD 3.3 Required */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">
          Temperature Management <span className="text-sm font-normal text-muted-foreground">(At least preheat or interpass required)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preheatTemperature" className="dark:text-foreground">
              Preheat Temperature <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="preheatTemperature"
              value={formData.wps?.preheatTemperature || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, preheatTemperature: e.target.value } })}
              placeholder="e.g., 150°C"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interpassTemperature" className="dark:text-foreground">Interpass Temperature</Label>
            <Input
              id="interpassTemperature"
              value={formData.wps?.interpassTemperature || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, interpassTemperature: e.target.value } })}
              placeholder="e.g., Max 250°C"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postheatTemperature" className="dark:text-foreground">Postheat Temperature</Label>
            <Input
              id="postheatTemperature"
              value={formData.wps?.postheatTemperature || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, postheatTemperature: e.target.value } })}
              placeholder="e.g., 300°C"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pwhtDetails" className="dark:text-foreground">PWHT Details</Label>
            <Input
              id="pwhtDetails"
              value={formData.wps?.pwhtDetails || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, pwhtDetails: e.target.value } })}
              placeholder="e.g., 600°C for 2 hours"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Results & Observations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="layerNumbers" className="dark:text-foreground">Number of Layers</Label>
            <Input
              id="layerNumbers"
              type="number"
              value={formData.wps?.layerNumbers || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, layerNumbers: parseInt(e.target.value) || undefined } })}
              placeholder="e.g., 3"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hardness" className="dark:text-foreground">Hardness</Label>
            <Input
              id="hardness"
              value={formData.wps?.hardness || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, hardness: e.target.value } })}
              placeholder="e.g., 60-65 HRC"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="defectsObserved" className="dark:text-foreground">Defects Observed</Label>
            <Textarea
              id="defectsObserved"
              value={formData.wps?.defectsObserved || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, defectsObserved: e.target.value } })}
              placeholder="e.g., No defects observed, Minor porosity"
              className="min-h-[80px] dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="additionalNotes" className="dark:text-foreground">
              Additional WPS Notes <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Textarea
              id="additionalNotes"
              value={formData.wps?.additionalNotes || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, additionalNotes: e.target.value } })}
              placeholder="Any additional observations, recommendations, or key WPS details..."
              className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground">
              Document any additional welding considerations, safety notes, or quality observations
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
