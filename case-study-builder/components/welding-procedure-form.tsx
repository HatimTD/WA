'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { waSaveWeldingProcedure, type WaWpsFormData } from '@/lib/actions/waWpsActions';
import { toast } from 'sonner';

type WeldingProcedureFormProps = {
  caseStudyId: string;
  existingData?: Partial<WaWpsFormData>;
};

export default function WeldingProcedureForm({ caseStudyId, existingData }: WeldingProcedureFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState<Omit<WaWpsFormData, 'caseStudyId'>>({
    // Base Metal
    baseMetalType: existingData?.baseMetalType || '',
    baseMetalGrade: existingData?.baseMetalGrade || '',
    baseMetalThickness: existingData?.baseMetalThickness || '',
    surfacePreparation: existingData?.surfacePreparation || '',
    // WA Product
    waProductName: existingData?.waProductName || '',
    waProductDiameter: existingData?.waProductDiameter || '',
    shieldingGas: existingData?.shieldingGas || '',
    shieldingFlowRate: existingData?.shieldingFlowRate || '',
    flux: existingData?.flux || '',
    standardDesignation: existingData?.standardDesignation || '',
    // Welding Parameters
    weldingProcess: existingData?.weldingProcess || '',
    currentType: existingData?.currentType || '',
    currentModeSynergy: existingData?.currentModeSynergy || '',
    wireFeedSpeed: existingData?.wireFeedSpeed || '',
    intensity: existingData?.intensity || '',
    voltage: existingData?.voltage || '',
    heatInput: existingData?.heatInput || '',
    weldingPosition: existingData?.weldingPosition || '',
    torchAngle: existingData?.torchAngle || '',
    stickOut: existingData?.stickOut || '',
    travelSpeed: existingData?.travelSpeed || '',
    // Oscillation
    oscillationWidth: existingData?.oscillationWidth || '',
    oscillationSpeed: existingData?.oscillationSpeed || '',
    oscillationStepOver: existingData?.oscillationStepOver || '',
    oscillationTempo: existingData?.oscillationTempo || '',
    // Temperature
    preheatTemperature: existingData?.preheatTemperature || '',
    interpassTemperature: existingData?.interpassTemperature || '',
    postheatTemperature: existingData?.postheatTemperature || '',
    pwhtDetails: existingData?.pwhtDetails || '',
    // Results
    layerNumbers: existingData?.layerNumbers || undefined,
    hardness: existingData?.hardness || '',
    defectsObserved: existingData?.defectsObserved || '',
    additionalNotes: existingData?.additionalNotes || '',
  });

  const handleChange = (field: keyof typeof values, value: string | number) => {
    setValues({ ...values, [field]: value });
  };

  const handleSave = async () => {
    // Validate required fields
    if (!values.waProductName || !values.weldingProcess) {
      toast.error('Please fill in WA Product Name and Welding Process (required fields)');
      return;
    }

    setIsSaving(true);

    try {
      const result = await waSaveWeldingProcedure({
        caseStudyId,
        ...values,
      });

      if (result.success) {
        toast.success('Welding Procedure Specification saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save WPS');
      }
    } catch (error) {
      console.error('[WeldingProcedureForm] Error:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const hasData = existingData && Object.keys(existingData).length > 0;

  return (
    <Card className="dark:bg-card dark:border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-wa-green-600 dark:text-primary" />
            <div>
              <CardTitle className="dark:text-foreground">Welding Procedure Specification (WPS)</CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                {hasData ? 'View or edit the welding parameters' : 'Add detailed welding parameters for this case study'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                {hasData ? 'View WPS' : 'Add WPS'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Base Metal Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Base Metal</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseMetalType" className="dark:text-foreground">Base Metal Type</Label>
                <Input
                  id="baseMetalType"
                  value={values.baseMetalType}
                  onChange={(e) => handleChange('baseMetalType', e.target.value)}
                  placeholder="e.g., Carbon Steel, Stainless Steel"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="baseMetalGrade" className="dark:text-foreground">Base Metal Grade</Label>
                <Input
                  id="baseMetalGrade"
                  value={values.baseMetalGrade}
                  onChange={(e) => handleChange('baseMetalGrade', e.target.value)}
                  placeholder="e.g., ASTM A36, 316L"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="baseMetalThickness" className="dark:text-foreground">Base Metal Thickness</Label>
                <Input
                  id="baseMetalThickness"
                  value={values.baseMetalThickness}
                  onChange={(e) => handleChange('baseMetalThickness', e.target.value)}
                  placeholder="e.g., 10mm, 0.5 inch"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="surfacePreparation" className="dark:text-foreground">Surface Preparation</Label>
                <Input
                  id="surfacePreparation"
                  value={values.surfacePreparation}
                  onChange={(e) => handleChange('surfacePreparation', e.target.value)}
                  placeholder="e.g., Grinding, Machining"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
            </div>
          </div>

          {/* WA Product Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">WA Product</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="waProductName" className="dark:text-foreground">
                  WA Product Name <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <Input
                  id="waProductName"
                  value={values.waProductName}
                  onChange={(e) => handleChange('waProductName', e.target.value)}
                  placeholder="e.g., Maxim 400, ENDURA 380"
                  required
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="waProductDiameter" className="dark:text-foreground">WA Product Diameter</Label>
                <Input
                  id="waProductDiameter"
                  value={values.waProductDiameter}
                  onChange={(e) => handleChange('waProductDiameter', e.target.value)}
                  placeholder="e.g., 1.2mm, 3/32 inch"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="shieldingGas" className="dark:text-foreground">Shielding Gas</Label>
                <Input
                  id="shieldingGas"
                  value={values.shieldingGas}
                  onChange={(e) => handleChange('shieldingGas', e.target.value)}
                  placeholder="e.g., Ar/CO2 80/20"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="shieldingFlowRate" className="dark:text-foreground">Shielding Flow Rate</Label>
                <Input
                  id="shieldingFlowRate"
                  value={values.shieldingFlowRate}
                  onChange={(e) => handleChange('shieldingFlowRate', e.target.value)}
                  placeholder="e.g., 15 L/min"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="flux" className="dark:text-foreground">Flux</Label>
                <Input
                  id="flux"
                  value={values.flux}
                  onChange={(e) => handleChange('flux', e.target.value)}
                  placeholder="e.g., Agglomerated"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="standardDesignation" className="dark:text-foreground">Standard Designation</Label>
                <Input
                  id="standardDesignation"
                  value={values.standardDesignation}
                  onChange={(e) => handleChange('standardDesignation', e.target.value)}
                  placeholder="e.g., AWS A5.29"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Welding Parameters Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Welding Parameters</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weldingProcess" className="dark:text-foreground">
                  Welding Process <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <Input
                  id="weldingProcess"
                  value={values.weldingProcess}
                  onChange={(e) => handleChange('weldingProcess', e.target.value)}
                  placeholder="e.g., FCAW, GMAW, SAW"
                  required
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="currentType" className="dark:text-foreground">Current Type</Label>
                <Input
                  id="currentType"
                  value={values.currentType}
                  onChange={(e) => handleChange('currentType', e.target.value)}
                  placeholder="e.g., DCEP, AC"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="currentModeSynergy" className="dark:text-foreground">Current Mode/Synergy</Label>
                <Input
                  id="currentModeSynergy"
                  value={values.currentModeSynergy}
                  onChange={(e) => handleChange('currentModeSynergy', e.target.value)}
                  placeholder="e.g., Spray, Pulse"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="wireFeedSpeed" className="dark:text-foreground">Wire Feed Speed</Label>
                <Input
                  id="wireFeedSpeed"
                  value={values.wireFeedSpeed}
                  onChange={(e) => handleChange('wireFeedSpeed', e.target.value)}
                  placeholder="e.g., 8 m/min"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="intensity" className="dark:text-foreground">Intensity (Current)</Label>
                <Input
                  id="intensity"
                  value={values.intensity}
                  onChange={(e) => handleChange('intensity', e.target.value)}
                  placeholder="e.g., 250A"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="voltage" className="dark:text-foreground">Voltage</Label>
                <Input
                  id="voltage"
                  value={values.voltage}
                  onChange={(e) => handleChange('voltage', e.target.value)}
                  placeholder="e.g., 28V"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="heatInput" className="dark:text-foreground">Heat Input</Label>
                <Input
                  id="heatInput"
                  value={values.heatInput}
                  onChange={(e) => handleChange('heatInput', e.target.value)}
                  placeholder="e.g., 1.5 kJ/mm"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="weldingPosition" className="dark:text-foreground">Welding Position</Label>
                <Input
                  id="weldingPosition"
                  value={values.weldingPosition}
                  onChange={(e) => handleChange('weldingPosition', e.target.value)}
                  placeholder="e.g., 1G (Flat), 2G (Horizontal)"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="torchAngle" className="dark:text-foreground">Torch Angle</Label>
                <Input
                  id="torchAngle"
                  value={values.torchAngle}
                  onChange={(e) => handleChange('torchAngle', e.target.value)}
                  placeholder="e.g., 15°, 90°"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="stickOut" className="dark:text-foreground">Stick Out (CTWD)</Label>
                <Input
                  id="stickOut"
                  value={values.stickOut}
                  onChange={(e) => handleChange('stickOut', e.target.value)}
                  placeholder="e.g., 20mm"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="travelSpeed" className="dark:text-foreground">Travel Speed</Label>
                <Input
                  id="travelSpeed"
                  value={values.travelSpeed}
                  onChange={(e) => handleChange('travelSpeed', e.target.value)}
                  placeholder="e.g., 30 cm/min"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Oscillation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Oscillation (if applicable)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="oscillationWidth" className="dark:text-foreground">Oscillation Width</Label>
                <Input
                  id="oscillationWidth"
                  value={values.oscillationWidth}
                  onChange={(e) => handleChange('oscillationWidth', e.target.value)}
                  placeholder="e.g., 10mm"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="oscillationSpeed" className="dark:text-foreground">Oscillation Speed</Label>
                <Input
                  id="oscillationSpeed"
                  value={values.oscillationSpeed}
                  onChange={(e) => handleChange('oscillationSpeed', e.target.value)}
                  placeholder="e.g., 20 mm/s"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="oscillationStepOver" className="dark:text-foreground">Step Over</Label>
                <Input
                  id="oscillationStepOver"
                  value={values.oscillationStepOver}
                  onChange={(e) => handleChange('oscillationStepOver', e.target.value)}
                  placeholder="e.g., 50%"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="oscillationTempo" className="dark:text-foreground">Tempo/Dwell</Label>
                <Input
                  id="oscillationTempo"
                  value={values.oscillationTempo}
                  onChange={(e) => handleChange('oscillationTempo', e.target.value)}
                  placeholder="e.g., 0.5s dwell"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Temperature Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Temperature Control</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preheatTemperature" className="dark:text-foreground">Preheat Temperature</Label>
                <Input
                  id="preheatTemperature"
                  value={values.preheatTemperature}
                  onChange={(e) => handleChange('preheatTemperature', e.target.value)}
                  placeholder="e.g., 150°C"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="interpassTemperature" className="dark:text-foreground">Interpass Temperature</Label>
                <Input
                  id="interpassTemperature"
                  value={values.interpassTemperature}
                  onChange={(e) => handleChange('interpassTemperature', e.target.value)}
                  placeholder="e.g., 200°C max"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="postheatTemperature" className="dark:text-foreground">Postheat Temperature</Label>
                <Input
                  id="postheatTemperature"
                  value={values.postheatTemperature}
                  onChange={(e) => handleChange('postheatTemperature', e.target.value)}
                  placeholder="e.g., 250°C"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="pwhtDetails" className="dark:text-foreground">PWHT Details</Label>
                <Input
                  id="pwhtDetails"
                  value={values.pwhtDetails}
                  onChange={(e) => handleChange('pwhtDetails', e.target.value)}
                  placeholder="e.g., 600°C for 2 hours"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Results & Observations</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="layerNumbers" className="dark:text-foreground">Number of Layers</Label>
                <Input
                  id="layerNumbers"
                  type="number"
                  value={values.layerNumbers || ''}
                  onChange={(e) => handleChange('layerNumbers', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 3"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="hardness" className="dark:text-foreground">Hardness Achieved</Label>
                <Input
                  id="hardness"
                  value={values.hardness}
                  onChange={(e) => handleChange('hardness', e.target.value)}
                  placeholder="e.g., 58-62 HRC"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="defectsObserved" className="dark:text-foreground">Defects Observed</Label>
                <Input
                  id="defectsObserved"
                  value={values.defectsObserved}
                  onChange={(e) => handleChange('defectsObserved', e.target.value)}
                  placeholder="e.g., None, Minor porosity"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="additionalNotes" className="dark:text-foreground">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={values.additionalNotes}
                  onChange={(e) => handleChange('additionalNotes', e.target.value)}
                  placeholder="Any additional observations, recommendations, or special considerations..."
                  className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t dark:border-border">
            <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Welding Procedure Specification'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
