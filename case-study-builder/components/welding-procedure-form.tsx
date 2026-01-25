'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WaWpsFormData, WpsLayer } from '@/lib/actions/waWpsActions';

type WeldingProcedureFormProps = {
  caseStudyId: string;
  existingData?: Partial<WaWpsFormData>;
};

// Helper to display value or placeholder
function waDisplayValue(value: string | number | undefined | null, placeholder = '-'): string {
  if (value === undefined || value === null || value === '') return placeholder;
  return String(value);
}

export default function WeldingProcedureForm({ caseStudyId, existingData }: WeldingProcedureFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if we have layers (new structure) or legacy data
  const layers = existingData?.layers as WpsLayer[] | undefined;
  const hasLayers = layers && layers.length > 0;
  const hasData = existingData && Object.keys(existingData).length > 0;

  if (!hasData) {
    return (
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-wa-green-600 dark:text-primary" />
            <div>
              <CardTitle className="dark:text-foreground">Welding Procedure Specification (WPS)</CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                No WPS data available for this case study
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-card dark:border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-wa-green-600 dark:text-primary" />
            <div>
              <CardTitle className="dark:text-foreground">Welding Procedure Specification (WPS)</CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                {hasLayers ? `${layers.length} layer(s) documented` : 'View welding parameters'}
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
                View WPS
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
                <Label className="text-sm text-muted-foreground">Base Metal Type</Label>
                <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.baseMetalType)}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Surface Preparation</Label>
                <p className="font-medium dark:text-foreground">
                  {waDisplayValue(existingData?.surfacePreparation)}
                  {existingData?.surfacePreparationOther && ` - ${existingData.surfacePreparationOther}`}
                </p>
              </div>
            </div>
          </div>

          {/* Welding Layers Section */}
          {hasLayers ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Welding Layers
              </h3>
              {layers.map((layer, index) => (
                <div key={layer.id || index} className="border border-border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-wa-green-600 dark:text-primary">
                    Layer {index + 1}
                    {layer.waProductName && ` - ${layer.waProductName}`}
                  </h4>

                  {/* WA Consumables */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">WA Consumables</h5>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Product Name</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.waProductName)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Diameter</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.waProductDiameter)} {layer.waProductDiameter && 'mm'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Process</Label>
                        <p className="font-medium dark:text-foreground">
                          {waDisplayValue(layer.weldingProcess)}
                          {layer.weldingProcessOther && ` - ${layer.weldingProcessOther}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Technique</Label>
                        <p className="font-medium dark:text-foreground">
                          {waDisplayValue(layer.technique)}
                          {layer.techniqueOther && ` - ${layer.techniqueOther}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Welding Position</Label>
                        <p className="font-medium dark:text-foreground">
                          {waDisplayValue(layer.weldingPosition)}
                          {layer.weldingPositionOther && ` - ${layer.weldingPositionOther}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Torch Position</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.torchAngle)}</p>
                      </div>
                      {/* Shielding Gas - Only show for FCAW, GTAW, or Other processes */}
                      {(layer.weldingProcess === 'FCAW' || layer.weldingProcess === 'GTAW' || layer.weldingProcess === 'Other') && layer.shieldingGas && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Shielding Gas</Label>
                          <p className="font-medium dark:text-foreground">
                            {waDisplayValue(layer.shieldingGas)}
                            {layer.shieldingGasOther && ` - ${layer.shieldingGasOther}`}
                          </p>
                        </div>
                      )}
                      {/* Flow Rate - Only show when shielding gas is selected and not self-shielded */}
                      {layer.shieldingFlowRate && layer.shieldingGas && layer.shieldingGas !== 'Self shielded' && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Flow Rate (L/min)</Label>
                          <p className="font-medium dark:text-foreground">{layer.shieldingFlowRate}</p>
                        </div>
                      )}
                      {layer.flux && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Flux</Label>
                          <p className="font-medium dark:text-foreground">
                            {layer.flux}
                            {layer.fluxOther && ` - ${layer.fluxOther}`}
                          </p>
                        </div>
                      )}
                      {layer.standardDesignation && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Standard Designation</Label>
                          <p className="font-medium dark:text-foreground">{layer.standardDesignation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WA Parameters */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">WA Parameters</h5>
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Stick-out</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.stickOut)} {layer.stickOut && 'mm'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Type of Current</Label>
                        <p className="font-medium dark:text-foreground">
                          {waDisplayValue(layer.currentType)}
                          {layer.currentTypeOther && ` - ${layer.currentTypeOther}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Welding Mode</Label>
                        <p className="font-medium dark:text-foreground">
                          {waDisplayValue(layer.currentModeSynergy)}
                          {layer.currentModeSynergyOther && ` - ${layer.currentModeSynergyOther}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Wire Feed Speed</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.wireFeedSpeed)} {layer.wireFeedSpeed && 'm/min'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Intensity</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.intensity)} {layer.intensity && 'A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Voltage</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.voltage)} {layer.voltage && 'V'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Welding Speed</Label>
                        <p className="font-medium dark:text-foreground">{waDisplayValue(layer.travelSpeed)} {layer.travelSpeed && 'cm/min'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Oscillation Details */}
                  {(layer.oscillationAmplitude || layer.oscillationPeriod || layer.oscillationTempos) && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">Oscillation Details</h5>
                      <div className="grid md:grid-cols-3 gap-3 text-sm">
                        {layer.oscillationAmplitude && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Amplitude</Label>
                            <p className="font-medium dark:text-foreground">{layer.oscillationAmplitude} mm</p>
                          </div>
                        )}
                        {layer.oscillationPeriod && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Period</Label>
                            <p className="font-medium dark:text-foreground">{layer.oscillationPeriod} s</p>
                          </div>
                        )}
                        {layer.oscillationTempos && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Tempos</Label>
                            <p className="font-medium dark:text-foreground">{layer.oscillationTempos} s</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Legacy WA Product Display */
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">WA Product</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">WA Product Name</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.waProductName)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">WA Product Diameter</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.waProductDiameter)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Shielding Gas</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.shieldingGas)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Shielding Flow Rate</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.shieldingFlowRate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Flux</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.flux)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Standard Designation</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.standardDesignation)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Welding Parameters</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Welding Process</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.weldingProcess)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Type</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.currentType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Mode/Synergy</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.currentModeSynergy)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Wire Feed Speed</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.wireFeedSpeed)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Intensity (Current)</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.intensity)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Voltage</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.voltage)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Travel Speed</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.travelSpeed)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Welding Position</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.weldingPosition)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Torch Angle</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.torchAngle)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Stick Out (CTWD)</Label>
                    <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.stickOut)}</p>
                  </div>
                </div>
              </div>

              {/* Legacy Oscillation */}
              {(existingData?.oscillationWidth || existingData?.oscillationSpeed) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Oscillation</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Oscillation Width</Label>
                      <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.oscillationWidth)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Oscillation Speed</Label>
                      <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.oscillationSpeed)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Heating Procedure Section */}
          {(existingData?.preheatingTemp || existingData?.interpassTemp || existingData?.postheatingTemp ||
            existingData?.preheatTemperature || existingData?.interpassTemperature || existingData?.postheatTemperature) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Heating Procedure</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Preheating Temperature</Label>
                  <p className="font-medium dark:text-foreground">
                    {waDisplayValue(existingData?.preheatingTemp || existingData?.preheatTemperature)} {(existingData?.preheatingTemp || existingData?.preheatTemperature) && '°C'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Interpass Temperature</Label>
                  <p className="font-medium dark:text-foreground">
                    {waDisplayValue(existingData?.interpassTemp || existingData?.interpassTemperature)} {(existingData?.interpassTemp || existingData?.interpassTemperature) && '°C'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Postheating Temperature</Label>
                  <p className="font-medium dark:text-foreground">
                    {waDisplayValue(existingData?.postheatingTemp || existingData?.postheatTemperature)} {(existingData?.postheatingTemp || existingData?.postheatTemperature) && '°C'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PWHT Section */}
          {existingData?.pwhtRequired === 'Y' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Post Weld Heat Treatment (PWHT)</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Heating Rate</Label>
                  <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.pwhtHeatingRate)} {existingData?.pwhtHeatingRate && '°C/h'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Temperature & Holding Time</Label>
                  <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.pwhtTempHoldingTime)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Cooling Rate</Label>
                  <p className="font-medium dark:text-foreground">{waDisplayValue(existingData?.pwhtCoolingRate)} {existingData?.pwhtCoolingRate && '°C/h'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Legacy PWHT Details */}
          {existingData?.pwhtDetails && !existingData?.pwhtRequired && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">PWHT Details</h3>
              <p className="font-medium dark:text-foreground">{existingData.pwhtDetails}</p>
            </div>
          )}

          {/* Documents Section */}
          {existingData?.documents && (existingData.documents as any[]).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Supporting Documents</h3>
              <div className="space-y-2">
                {(existingData.documents as any[]).map((doc: any, index: number) => {
                  const isImage = doc.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.name);

                  return (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">{doc.name}</span>
                      {doc.url && (
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.name}
                            className="text-sm text-wa-green-600 hover:underline px-2 py-1 rounded hover:bg-wa-green-50"
                          >
                            {isImage ? 'View' : 'Download'}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Notes Section */}
          {existingData?.additionalNotes && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Additional Notes</h3>
              <p className="font-medium dark:text-foreground whitespace-pre-wrap">{existingData.additionalNotes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
