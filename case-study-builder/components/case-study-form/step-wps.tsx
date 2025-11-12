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
      {/* Base Metal Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Base Metal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baseMetalType">Base Metal Type</Label>
            <Input
              id="baseMetalType"
              value={formData.wps?.baseMetalType || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, baseMetalType: e.target.value } })}
              placeholder="e.g., Carbon Steel, Stainless Steel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseMetalGrade">Base Metal Grade</Label>
            <Input
              id="baseMetalGrade"
              value={formData.wps?.baseMetalGrade || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, baseMetalGrade: e.target.value } })}
              placeholder="e.g., ASTM A36, 316L"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseMetalThickness">Base Metal Thickness</Label>
            <Input
              id="baseMetalThickness"
              value={formData.wps?.baseMetalThickness || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, baseMetalThickness: e.target.value } })}
              placeholder="e.g., 10mm, 0.5 inch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surfacePreparation">Surface Preparation</Label>
            <Input
              id="surfacePreparation"
              value={formData.wps?.surfacePreparation || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, surfacePreparation: e.target.value } })}
              placeholder="e.g., Grinding, Sandblasting"
            />
          </div>
        </div>
      </div>

      {/* WA Product Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">WA Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="waProductName">WA Product Name <span className="text-red-500">*</span></Label>
            <Input
              id="waProductName"
              value={formData.wps?.waProductName || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, waProductName: e.target.value } })}
              placeholder="e.g., CHROMIUM CARBIDE 600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waProductDiameter">Product Diameter</Label>
            <Input
              id="waProductDiameter"
              value={formData.wps?.waProductDiameter || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, waProductDiameter: e.target.value } })}
              placeholder="e.g., 1.2mm, 2.4mm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shieldingGas">Shielding Gas</Label>
            <Input
              id="shieldingGas"
              value={formData.wps?.shieldingGas || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, shieldingGas: e.target.value } })}
              placeholder="e.g., Ar + 20% CO2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shieldingFlowRate">Shielding Flow Rate</Label>
            <Input
              id="shieldingFlowRate"
              value={formData.wps?.shieldingFlowRate || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, shieldingFlowRate: e.target.value } })}
              placeholder="e.g., 15 L/min"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flux">Flux</Label>
            <Input
              id="flux"
              value={formData.wps?.flux || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, flux: e.target.value } })}
              placeholder="e.g., Neutral flux"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="standardDesignation">Standard Designation</Label>
            <Input
              id="standardDesignation"
              value={formData.wps?.standardDesignation || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, standardDesignation: e.target.value } })}
              placeholder="e.g., AWS A5.18"
            />
          </div>
        </div>
      </div>

      {/* Welding Parameters Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Welding Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weldingProcess">Welding Process <span className="text-red-500">*</span></Label>
            <Input
              id="weldingProcess"
              value={formData.wps?.weldingProcess || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, weldingProcess: e.target.value } })}
              placeholder="e.g., FCAW, GMAW, SMAW"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentType">Current Type</Label>
            <Input
              id="currentType"
              value={formData.wps?.currentType || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, currentType: e.target.value } })}
              placeholder="e.g., DC+, AC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentModeSynergy">Current Mode/Synergy</Label>
            <Input
              id="currentModeSynergy"
              value={formData.wps?.currentModeSynergy || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, currentModeSynergy: e.target.value } })}
              placeholder="e.g., CV, Synergic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wireFeedSpeed">Wire Feed Speed</Label>
            <Input
              id="wireFeedSpeed"
              value={formData.wps?.wireFeedSpeed || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, wireFeedSpeed: e.target.value } })}
              placeholder="e.g., 7 m/min"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity">Intensity (Current)</Label>
            <Input
              id="intensity"
              value={formData.wps?.intensity || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, intensity: e.target.value } })}
              placeholder="e.g., 200A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voltage">Voltage</Label>
            <Input
              id="voltage"
              value={formData.wps?.voltage || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, voltage: e.target.value } })}
              placeholder="e.g., 26V"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heatInput">Heat Input</Label>
            <Input
              id="heatInput"
              value={formData.wps?.heatInput || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, heatInput: e.target.value } })}
              placeholder="e.g., 1.5 kJ/mm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weldingPosition">Welding Position</Label>
            <Input
              id="weldingPosition"
              value={formData.wps?.weldingPosition || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, weldingPosition: e.target.value } })}
              placeholder="e.g., Flat (1G), Horizontal (2G)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="torchAngle">Torch Angle</Label>
            <Input
              id="torchAngle"
              value={formData.wps?.torchAngle || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, torchAngle: e.target.value } })}
              placeholder="e.g., 10-15°"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stickOut">Stick Out / CTWD</Label>
            <Input
              id="stickOut"
              value={formData.wps?.stickOut || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, stickOut: e.target.value } })}
              placeholder="e.g., 15mm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="travelSpeed">Travel Speed</Label>
            <Input
              id="travelSpeed"
              value={formData.wps?.travelSpeed || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, travelSpeed: e.target.value } })}
              placeholder="e.g., 30 cm/min"
            />
          </div>
        </div>
      </div>

      {/* Oscillation Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Oscillation (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="oscillationWidth">Oscillation Width</Label>
            <Input
              id="oscillationWidth"
              value={formData.wps?.oscillationWidth || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationWidth: e.target.value } })}
              placeholder="e.g., 12mm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oscillationSpeed">Oscillation Speed</Label>
            <Input
              id="oscillationSpeed"
              value={formData.wps?.oscillationSpeed || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationSpeed: e.target.value } })}
              placeholder="e.g., 50 mm/s"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oscillationStepOver">Step Over %</Label>
            <Input
              id="oscillationStepOver"
              value={formData.wps?.oscillationStepOver || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationStepOver: e.target.value } })}
              placeholder="e.g., 50%"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oscillationTempo">Oscillation Tempo</Label>
            <Input
              id="oscillationTempo"
              value={formData.wps?.oscillationTempo || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, oscillationTempo: e.target.value } })}
              placeholder="e.g., 0.3s left, 0.3s right"
            />
          </div>
        </div>
      </div>

      {/* Temperature Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Temperature Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preheatTemperature">Preheat Temperature</Label>
            <Input
              id="preheatTemperature"
              value={formData.wps?.preheatTemperature || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, preheatTemperature: e.target.value } })}
              placeholder="e.g., 150°C"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interpassTemperature">Interpass Temperature</Label>
            <Input
              id="interpassTemperature"
              value={formData.wps?.interpassTemperature || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, interpassTemperature: e.target.value } })}
              placeholder="e.g., Max 250°C"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postheatTemperature">Postheat Temperature</Label>
            <Input
              id="postheatTemperature"
              value={formData.wps?.postheatTemperature || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, postheatTemperature: e.target.value } })}
              placeholder="e.g., 300°C"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pwhtDetails">PWHT Details</Label>
            <Input
              id="pwhtDetails"
              value={formData.wps?.pwhtDetails || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, pwhtDetails: e.target.value } })}
              placeholder="e.g., 600°C for 2 hours"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Results & Observations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="layerNumbers">Number of Layers</Label>
            <Input
              id="layerNumbers"
              type="number"
              value={formData.wps?.layerNumbers || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, layerNumbers: parseInt(e.target.value) || undefined } })}
              placeholder="e.g., 3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hardness">Hardness</Label>
            <Input
              id="hardness"
              value={formData.wps?.hardness || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, hardness: e.target.value } })}
              placeholder="e.g., 60-65 HRC"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="defectsObserved">Defects Observed</Label>
            <Textarea
              id="defectsObserved"
              value={formData.wps?.defectsObserved || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, defectsObserved: e.target.value } })}
              placeholder="e.g., No defects observed, Minor porosity"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={formData.wps?.additionalNotes || ''}
              onChange={(e) => updateFormData({ wps: { ...formData.wps, additionalNotes: e.target.value } })}
              placeholder="Any additional observations or recommendations..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Technical Requirement</p>
        <p>WPS (Welding Procedure Specification) is required for TECH and STAR case studies to document technical welding parameters.</p>
      </div>
    </div>
  );
}
