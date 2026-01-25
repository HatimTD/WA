'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileUp, X, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { CaseStudyFormData } from '@/app/dashboard/new/page';

// WA Products list (same as step-four)
const WA_PRODUCTS = [
  "CAST NICI-G", "CAST NICI-O", "CAST NIFE-G", "CAVITALLOY", "CHROMECORE 12 4V-G",
  "CHROMECORE 410-G", "CHROMECORE 410-O", "CHROMECORE 410-S", "CHROMECORE 410NiMo-S",
  "CHROMECORE 4115-G", "CHROMECORE 414-G", "CHROMECORE 414-O", "CHROMECORE 414-S",
  "CHROMECORE 4142N-O", "CHROMECORE 4142N-S", "CHROMECORE 4142NX-S", "CHROMECORE 414COILER-S",
  "CHROMECORE 414DN-O", "CHROMECORE 414DN-S", "CHROMECORE 414MM-S", "CHROMECORE 414N-O",
  "CHROMECORE 414N-S", "CHROMECORE 414NX-G", "CHROMECORE 414NX-O", "CHROMECORE 414NX-S",
  "CHROMECORE 414NXLC-G", "CHROMECORE 417 4Cu-G", "CHROMECORE 417 4Cu-S", "CHROMECORE 420-G",
  "CHROMECORE 420-O", "CHROMECORE 420-S", "CHROMECORE 421Cr-S", "CHROMECORE 423Cr-S",
  "CHROMECORE 430-G", "CHROMECORE 430-O", "CHROMECORE 430-S", "CHROMECORE 430N-S",
  "CHROMECORE 434DN-O", "CHROMECORE 434DN-S", "CHROMECORE 434N-O", "CHROMECORE 434N-S",
  "CHROMECORE 592-S", "CHROMECORE B 13 4-G", "CHROMECORE B 16 5 1-G", "CHROMECORE DN-S",
  "CHROMECORE M 13 1-G", "CHROMECORE M 13 4-G", "CHROMECORE M 410NiMo-G", "CHROMECORE S 410-G",
  "CHROMECORE S 420-G", "CHROMECORE V 410NiMo-G", "CORBRONZE 302-G", "CORRESIST-O",
  "DRILL-GUARD CC", "DRILL-GUARD Nb", "DRILL-GUARD Nb SEAMLESS", "GAMMA 182", "GAMMA 254",
  "GAMMA 276", "GAMMA 400", "GAMMA 4648", "GAMMA 625", "GAMMA V 276", "GAMMA V 4648",
  "GAMMA V 625", "GAMMA V CRYO", "GROOVALLOY", "HARDFACE 168Nb-O", "HARDFACE 19 9 6-G",
  "HARDFACE 19 9 6-O", "HARDFACE 19 9 6-S", "HARDFACE 250-S", "HARDFACE 28 3HC-G",
  "HARDFACE 350-O", "HARDFACE 350-S", "HARDFACE 38-S", "HARDFACE 40-G", "HARDFACE 45-G",
  "HARDFACE 450-S", "HARDFACE 45W-G", "HARDFACE 50Cr-G", "HARDFACE 50W-G", "HARDFACE 55Cr-G",
  "HARDFACE 55WCo-G", "HARDFACE 600-S", "HARDFACE 60Mo-G", "HARDFACE 751", "HARDFACE AP-G",
  "HARDFACE AP-O", "HARDFACE AP-S", "HARDFACE APRAIL-O", "HARDFACE AR-G", "HARDFACE ARM7-G",
  "HARDFACE B-G", "HARDFACE B-O", "HARDFACE B-S", "HARDFACE BN-LD", "HARDFACE BN-O",
  "HARDFACE BNC-O", "HARDFACE BUF-O", "HARDFACE BUF-S", "HARDFACE CHROMEFREE-G",
  "HARDFACE CN-O", "HARDFACE CN-S", "HARDFACE CNB-O", "HARDFACE CNV-O", "HARDFACE CNV-S",
  "HARDFACE CV-O", "HARDFACE D-G", "HARDFACE D-S", "HARDFACE DCO-G", "HARDFACE DCO-O",
  "HARDFACE DCO-S", "HARDFACE DIAMOND", "HARDFACE DUALHARD C-S", "HARDFACE FC-O",
  "HARDFACE HC-LD", "HARDFACE HC-O", "HARDFACE HC-S", "HARDFACE HC20-O", "HARDFACE HC333-O",
  "HARDFACE HCB05-O", "HARDFACE HCFP-O", "HARDFACE HCNB-O", "HARDFACE HCP-O", "HARDFACE HW52-S",
  "HARDFACE HW59-S", "HARDFACE L-G", "HARDFACE L-O", "HARDFACE L-S", "HARDFACE LC-O",
  "HARDFACE LP-G", "HARDFACE MAXEXTRACT", "HARDFACE MAXEXTRACT PLUS", "HARDFACE MAXIMPACT",
  "HARDFACE MC-O", "HARDFACE Nb-G", "HARDFACE NCWB", "HARDFACE NICARB60", "HARDFACE NICARBW",
  "HARDFACE NICARBW-LD", "HARDFACE NM-G", "HARDFACE NM-O", "HARDFACE NM14-O",
  "HARDFACE P 6000-O", "HARDFACE P-G", "HARDFACE P-O", "HARDFACE P-S", "HARDFACE R-S",
  "HARDFACE R25-S", "HARDFACE R35-S", "HARDFACE R55-S", "HARDFACE R58-G",
  "HARDFACE STAINCARBW", "HARDFACE STEELCARBW", "HARDFACE T-G", "HARDFACE T-O", "HARDFACE T-S",
  "HARDFACE TIC-O", "HARDFACE TICM-O", "HARDFACE TLN-O", "HARDFACE TN-O", "HARDFACE VMOLC-G",
  "HARDFACE VN-O", "HARDFACE VNB-O", "HARDFACE W-G", "HARDFACE W-O", "HARDFACE W-S",
  "HARDFACE WA212", "HARDFACE WA8620-S", "HARDFACE WLC-G", "HARDFACE WLC-O", "HARDFACE WLC-S",
  "HARDFACE WM-G", "HARDFACE WMOLC-G", "HARDFACE WNb-S", "HARDFACE X-G",
  "HARDFACE ZUCAR SPATTER MAKER", "HARDSPRAY 140-TS", "HARDSPRAY HB4-TS",
  "HARDSPRAY NI Al5-TS", "HARDSPRAY NI CBS-TS", "HARDSPRAY NI Cr20-TS", "HARDSPRAY NI WC-TS",
  "ROBODUR BN", "ROBODUR K 250", "ROBODUR K 350", "ROBODUR K 400", "ROBODUR K 450",
  "ROBODUR K 600", "ROBODUR K 650", "ROBODUR K CERAMIC", "ROBODUR K Nb", "ROBODUR M 13Mn",
  "ROBOFIL B 700", "ROBOFIL B 71", "ROBOFIL B Ni1", "ROBOFIL B NiMo", "ROBOFIL M 700",
  "ROBOFIL M 71", "ROBOFIL M Ni1", "ROBOFIL M NiMo", "ROBOFIL R 71+", "ROBOFIL R Ni2+",
  "ROBOFIL T4", "ROBOTOOL 34W-G", "ROBOTOOL 45W-G", "ROBOTOOL 46-G", "ROBOTOOL 47-G",
  "ROBOTOOL 49W-G", "ROBOTOOL 54W-G", "ROBOTOOL 58-G", "SPEEDAl 4043", "SPEEDAl 5183",
  "SPEEDAl 5356", "SPEEDARC T11", "SPEEDARC T4", "STELLOY 1-G", "STELLOY 1-LD", "STELLOY 12-G",
  "STELLOY 188-LD", "STELLOY 190-G", "STELLOY 21-G", "STELLOY 21-LD", "STELLOY 21-O",
  "STELLOY 21-TIG", "STELLOY 25-G", "STELLOY 25-LD", "STELLOY 6-G", "STELLOY 6-LD",
  "STELLOY 6-O", "STELLOY 6-TIG", "STELLOY 6BC-G", "STELLOY 6BC-TIG", "STELLOY 6HC-G",
  "STELLOY C-G", "STELLOY C-O", "STELLOY C-S", "STELLOY CCo-G", "STELLOY NI519Co2-G",
  "STELLOY NI520-G", "TETRA S 20 9 3-G", "TETRA S 22 9 3L-G", "TETRA S 307-G",
  "TETRA S 308L-G", "TETRA S 309L-G", "TETRA S 309LMo-G", "TETRA S 312-G", "TETRA S 316L-G",
  "TETRA S 317L-G", "TETRA S 318L-G", "TETRA S 347L-G", "TETRA S B 22 9 3L-G",
  "TETRA S B 309HT-G", "TETRA S B 310-G", "TETRA S B 316NFL-G", "TETRA S B D57L-G",
  "TETRA S D57L-G", "TETRA S D750-G", "TETRA S D760-G", "TETRA S LD62-G", "TETRA V 16 8 2-G",
  "TETRA V 20 9 3-G", "TETRA V 22 9 3L-G", "TETRA V 307-G", "TETRA V 308H-G", "TETRA V 308L-G",
  "TETRA V 308XL-G", "TETRA V 309H-G", "TETRA V 309HT-G", "TETRA V 309L-G", "TETRA V 309LMo-G",
  "TETRA V 309LNb-G", "TETRA V 310-G", "TETRA V 312-G", "TETRA V 316H-G", "TETRA V 316L-G",
  "TETRA V 316XL-G", "TETRA V 317L-G", "TETRA V 318L-G", "TETRA V 329-G", "TETRA V 347H-G",
  "TETRA V 347L-G", "TETRA V 904L-G", "TETRA V D57L-G", "TETRA V D750-G", "TETRA V D760-G",
  "TETRA V DISSIM-G", "TETRA V LD62-G", "TRI S 19 17 5L-O", "TRI S 308L-O", "TRI S 309HF-O",
  "TRI S 309L-O", "TRI S 309LMo-O", "TRI S 309SD-O", "TRI S 312-O", "TRI S 316L-O",
  "TRI S RW-O", "TRI V 19 9 6-O", "TUBE S 20 9 3-G", "TUBE S 21 16 5N-G", "TUBE S 22 9 3L-G",
  "TUBE S 22 9 3L-S", "TUBE S 308H-S", "TUBE S 308L-G", "TUBE S 308L-S", "TUBE S 309HT-G",
  "TUBE S 309HT-S", "TUBE S 309L-G", "TUBE S 309L-S", "TUBE S 309LMo-G", "TUBE S 309LMo-S",
  "TUBE S 309LNb-G", "TUBE S 310-S", "TUBE S 312-G", "TUBE S 316L-G", "TUBE S 316L-S",
  "TUBE S 318L-G", "TUBE S 318L-S", "TUBE S 329-G", "TUBE S 347H-G", "TUBE S 347H-S",
  "TUBE S 347L-G", "TUBE S 347L-S", "TUBE S 361-G", "TUBE S 904L-G", "TUBE S 904L-S",
  "TUBE S D57L-G", "TUBE S D57L-S", "TUBE S D750-G", "TUBE S LD62-G", "WA CAST BI-NIFE-E",
  "WA CAST Ni-E", "WA GAMMA 182-E", "WA HARDFACE AP-E", "WA HARDFACE CN-E", "WA HARDFACE CN-TE",
  "WA HARDFACE CNV-TE", "WA HARDFACE HC-E", "WA HARDFACE HC-TE", "WA HARDFACE HC40-TE",
  "WA HARDFACE STEELCARBW25-TE", "WA HARDFACE STEELCARBW45-TE", "WA MNI 625", "WA MNI 82",
  "WA MSS 308L", "WA MSS 309L", "WA MSS 316L", "WA MSS 410NiMo", "WA SPEEDARC 6013-E",
  "WA SPEEDARC 7016-E", "WA SPEEDARC 7018-1-E", "WA SPEEDARC 7018-E", "WA SPRAY 13Cr-TS",
  "WA SPRAY CuAl9-TS", "WA TCO 21", "WA TCO 6", "WA TETRA V 307-E", "WA TETRA V 308L-E",
  "WA TETRA V 309L-E", "WA TETRA V 312-E", "WA TETRA V 316L-E", "WA TSS 308L", "WA TSS 309L",
  "WA TSS 316L", "WA TUB CS 71", "WA TUB CS 81Ni1", "WA TUB SS 12", "WA TUB SS 16L",
  "WA TUB SS 8L", "WA TUB SS 9L", "WA TUB SS R16L", "WA TUB SS R8L", "WA TUB SS R9L",
  "WAROD 308L", "WAROD 309L", "WAROD 316L", "WAROD 347", "HARDFACE NICARBWHT"
];

// Dropdown options
const SURFACE_PREP_OPTIONS = ['Grinding', 'Machining', 'Blasting', 'Brushing', 'None', 'Other'];
const PROCESS_OPTIONS = ['FCAW', 'SAW', 'SAW twin', 'SMAW', 'Tubular Electrodes', 'Electrodes', 'GTAW', 'Other'];
const TECHNIQUE_OPTIONS = ['Manual', 'Semi-auto', 'Automatic', 'Robotic', 'Other'];
const WELDING_POSITION_OPTIONS = [
  'PA - 1G / 1F',
  'PB - 2F',
  'PC - 2G',
  'PD - 4F',
  'PE - 4G',
  'PF - 3G / 3F',
  'PG - 3G / 3F',
  'PH - 5G',
  'PJ - 5G',
  'PK - 5G',
  'Other'
];
const SHIELDING_GAS_OPTIONS = [
  'Self shielded',
  'I1 → 100%Ar',
  'M12 → Ar + 0,5 ≤ CO2 ≤ 5',
  'M13 → Ar + 0,5 ≤ O2 ≤ 3',
  'M20 → Ar + 5 < CO2 ≤ 15',
  'M21 → Ar + 15 < CO2 ≤ 25',
  'C1 → 100%CO2',
  'Other'
];
const FLUX_OPTIONS = ['WAF 325', 'WAF 415', 'WA ULTRAFLUX', 'Other'];
const CURRENT_TYPE_OPTIONS = ['DC+', 'DC-', 'Other'];
const WELDING_MODE_OPTIONS = ['Standard', 'Pulsed', 'Other'];

// Flux to Standard Designation mapping
const FLUX_STANDARD_MAP: Record<string, string> = {
  'WAF 325': 'S A AB 1 65 DC H5',
  'WAF 415': 'S A FB 1 55 DC H5',
  'WA ULTRAFLUX': 'S A FB 1 55',
};

// Diameter options (same as step-four)
const DIAMETER_OPTIONS = [1.0, 1.2, 1.3, 1.6, 2.0, 2.2, 2.4, 2.8, 3.2, 4.0, 5.0, 6.0, 8.0, 12.0];

// Layer interface for WA Consumables + Parameters + Oscillation
export interface WpsLayer {
  id: string;
  // WA Consumables
  waProductName?: string;
  waProductDiameter?: string;
  weldingProcess?: string;
  weldingProcessOther?: string;
  technique?: string;
  techniqueOther?: string;
  weldingPosition?: string;
  weldingPositionOther?: string;
  torchAngle?: string;
  shieldingGas?: string;
  shieldingGasOther?: string;
  shieldingFlowRate?: string;
  flux?: string;
  fluxOther?: string;
  standardDesignation?: string;
  // WA Parameters
  stickOut?: string;
  currentType?: string;
  currentTypeOther?: string;
  currentModeSynergy?: string;
  currentModeSynergyOther?: string;
  wireFeedSpeed?: string;
  intensity?: string;
  voltage?: string;
  travelSpeed?: string;
  // Oscillation Details
  oscillationAmplitude?: string;
  oscillationPeriod?: string;
  oscillationTempos?: string;
}

// Default empty layer
const waCreateEmptyLayer = (): WpsLayer => ({
  id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

export default function StepWPS({ formData, updateFormData }: Props) {
  const isStarCase = formData.type === 'STAR';

  // Initialize layers if not present
  const layers: WpsLayer[] = formData.wps?.layers || [waCreateEmptyLayer()];

  // Track which layers are expanded
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    layers.forEach(layer => { initial[layer.id] = true; });
    return initial;
  });

  // Track active product search per layer
  const [activeProductSearch, setActiveProductSearch] = useState<Record<string, string>>({});
  const [showProductSuggestions, setShowProductSuggestions] = useState<Record<string, boolean>>({});

  // Other field states
  const [surfacePrepOther, setSurfacePrepOther] = useState('');

  // Initialize WPS on mount - auto-fill base metal and create empty layer if needed
  useEffect(() => {
    const updates: Partial<typeof formData.wps> = { ...formData.wps };
    let needsUpdate = false;

    // Auto-fill base metal from Solution step
    if (formData.baseMetal && formData.wps?.baseMetalType !== formData.baseMetal) {
      updates.baseMetalType = formData.baseMetal;
      needsUpdate = true;
    }

    // Initialize layers if empty
    if (!formData.wps?.layers || formData.wps.layers.length === 0) {
      updates.layers = [waCreateEmptyLayer()];
      needsUpdate = true;
    }

    if (needsUpdate) {
      updateFormData({ wps: updates });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep baseMetal in sync when it changes (e.g., user goes back and updates it)
  useEffect(() => {
    if (formData.baseMetal && formData.wps?.baseMetalType !== formData.baseMetal) {
      updateFormData({ wps: { ...formData.wps, baseMetalType: formData.baseMetal } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.baseMetal]);

  const waUpdateWps = (field: string, value: unknown) => {
    updateFormData({ wps: { ...formData.wps, [field]: value } });
  };

  const waUpdateLayer = (layerId: string, field: string, value: unknown) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, [field]: value } : layer
    );
    updateFormData({ wps: { ...formData.wps, layers: updatedLayers } });
  };

  // Update multiple fields at once to avoid race conditions
  const waUpdateLayerMultiple = (layerId: string, updates: Partial<WpsLayer>) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    updateFormData({ wps: { ...formData.wps, layers: updatedLayers } });
  };

  const waAddLayer = () => {
    const newLayer = waCreateEmptyLayer();
    updateFormData({
      wps: {
        ...formData.wps,
        layers: [...layers, newLayer]
      }
    });
    setExpandedLayers(prev => ({ ...prev, [newLayer.id]: true }));
  };

  const waRemoveLayer = (layerId: string) => {
    if (layers.length <= 1) return; // Keep at least one layer
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    updateFormData({ wps: { ...formData.wps, layers: updatedLayers } });
  };

  const waToggleLayer = (layerId: string) => {
    setExpandedLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  // Filter products based on search
  const waGetFilteredProducts = (search: string) => {
    if (!search || search.length === 0) return [];
    return WA_PRODUCTS.filter(p => p.toLowerCase().includes(search.toLowerCase())).slice(0, 10);
  };

  return (
    <div className="space-y-6">
      {/* BRD 3.3 Required Fields Notice */}
      {isStarCase ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-700">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold dark:text-yellow-100">⭐ Bonus Point Opportunity:</span> WPS is <strong>optional</strong> for STAR case studies. Fill it out to earn <strong>+1 bonus point</strong>.
          </p>
        </div>
      ) : (
        <div className="bg-wa-green-50 border border-wa-green-200 rounded-lg p-4 dark:bg-accent dark:border-primary">
          <p className="text-sm text-wa-green-800 dark:text-muted-foreground">
            <span className="font-semibold dark:text-foreground">Tech Case Requirement:</span> WPS documentation is required. Fields marked with <span className="text-red-500">*</span> are required.
          </p>
        </div>
      )}

      {/* Add Layer Button - Prominent at top for better UX */}
      <div className="flex items-center justify-between p-4 bg-wa-green-50 dark:bg-accent/30 border border-wa-green-200 dark:border-primary/50 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-foreground">Welding Layers</h3>
          <p className="text-sm text-muted-foreground">{layers.length} layer{layers.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button
          type="button"
          onClick={waAddLayer}
          className="flex items-center gap-2 bg-wa-green-600 hover:bg-wa-green-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Layer
        </Button>
      </div>

      {/* Base Metal Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Base Metal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baseMetalType" className="dark:text-foreground">
              Base Metal <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="baseMetalType"
              value={formData.wps?.baseMetalType || ''}
              onChange={(e) => waUpdateWps('baseMetalType', e.target.value)}
              placeholder="Auto-filled from Solution step"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
            {formData.baseMetal && (
              <p className="text-xs text-muted-foreground">Auto-filled from Solution step</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="surfacePreparation" className="dark:text-foreground">
              Surface Preparation <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <select
              id="surfacePreparation"
              value={formData.wps?.surfacePreparation || ''}
              onChange={(e) => {
                waUpdateWps('surfacePreparation', e.target.value);
                if (e.target.value !== 'Other') setSurfacePrepOther('');
              }}
              className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
              required
            >
              <option value="">Select preparation</option>
              {SURFACE_PREP_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {formData.wps?.surfacePreparation === 'Other' && (
              <Input
                value={surfacePrepOther}
                onChange={(e) => {
                  setSurfacePrepOther(e.target.value);
                  waUpdateWps('surfacePreparationOther', e.target.value);
                }}
                placeholder="Specify other preparation"
                className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
              />
            )}
          </div>
        </div>
      </div>

      {/* Welding Layers - List of layers (Add button is at top of form) */}
      <div className="space-y-4">
        {layers.map((layer, index) => {
          const isSAWProcess = layer.weldingProcess === 'SAW' || layer.weldingProcess === 'SAW twin';
          // Shielding Gas only shows for FCAW, GTAW, or Other processes
          const requiresShieldingGas = layer.weldingProcess === 'FCAW' || layer.weldingProcess === 'GTAW' || layer.weldingProcess === 'Other';
          const requiresFlowRate = requiresShieldingGas && layer.shieldingGas && layer.shieldingGas !== 'Self shielded' && layer.shieldingGas !== '';
          const isExpanded = expandedLayers[layer.id] !== false;
          const productSearch = activeProductSearch[layer.id] || layer.waProductName || '';
          const filteredProducts = waGetFilteredProducts(productSearch);

          return (
            <div key={layer.id} className="border border-border rounded-lg overflow-hidden">
              {/* Layer Header */}
              <div
                className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer"
                onClick={() => waToggleLayer(layer.id)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="font-semibold">Layer {index + 1}</span>
                  {layer.waProductName && (
                    <span className="text-sm text-muted-foreground">- {layer.waProductName}</span>
                  )}
                </div>
                {layers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      waRemoveLayer(layer.id);
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Layer Content */}
              {isExpanded && (
                <div className="p-4 space-y-6">
                  {/* WA Consumables */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2">WA Consumables</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Name - Autocomplete */}
                      <div className="space-y-2 relative">
                        <Label className="dark:text-foreground">
                          Product Name <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <Input
                          value={productSearch}
                          onChange={(e) => {
                            setActiveProductSearch(prev => ({ ...prev, [layer.id]: e.target.value }));
                            waUpdateLayer(layer.id, 'waProductName', e.target.value);
                            setShowProductSuggestions(prev => ({ ...prev, [layer.id]: true }));
                          }}
                          onFocus={() => setShowProductSuggestions(prev => ({ ...prev, [layer.id]: true }))}
                          onBlur={() => setTimeout(() => setShowProductSuggestions(prev => ({ ...prev, [layer.id]: false })), 200)}
                          placeholder="Type to search products..."
                          className="dark:bg-input dark:border-border dark:text-foreground"
                          autoComplete="off"
                          required
                        />
                        {showProductSuggestions[layer.id] && filteredProducts.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredProducts.map((product, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-b-0"
                                onMouseDown={() => {
                                  setActiveProductSearch(prev => ({ ...prev, [layer.id]: product }));
                                  waUpdateLayer(layer.id, 'waProductName', product);
                                  setShowProductSuggestions(prev => ({ ...prev, [layer.id]: false }));
                                }}
                              >
                                {product}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Diameter */}
                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Diameter <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <select
                          value={layer.waProductDiameter || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'waProductDiameter', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                          required
                        >
                          <option value="">Select diameter</option>
                          {DIAMETER_OPTIONS.map((mm) => (
                            <option key={mm} value={mm.toFixed(1)}>{mm.toFixed(1)} mm</option>
                          ))}
                        </select>
                      </div>

                      {/* Process */}
                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Process <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <select
                          value={layer.weldingProcess || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue !== 'SAW' && newValue !== 'SAW twin') {
                              // Clear flux fields when switching away from SAW
                              waUpdateLayerMultiple(layer.id, {
                                weldingProcess: newValue,
                                flux: '',
                                fluxOther: '',
                                standardDesignation: ''
                              });
                            } else {
                              waUpdateLayer(layer.id, 'weldingProcess', newValue);
                            }
                          }}
                          className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                          required
                        >
                          <option value="">Select process</option>
                          {PROCESS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {layer.weldingProcess === 'Other' && (
                          <Input
                            value={layer.weldingProcessOther || ''}
                            onChange={(e) => waUpdateLayer(layer.id, 'weldingProcessOther', e.target.value)}
                            placeholder="Specify other process"
                            className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                          />
                        )}
                      </div>

                      {/* Technique */}
                      <div className="space-y-2">
                        <Label className="dark:text-foreground">Technique</Label>
                        <select
                          value={layer.technique || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'technique', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                        >
                          <option value="">Select technique</option>
                          {TECHNIQUE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {layer.technique === 'Other' && (
                          <Input
                            value={layer.techniqueOther || ''}
                            onChange={(e) => waUpdateLayer(layer.id, 'techniqueOther', e.target.value)}
                            placeholder="Specify other technique"
                            className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                          />
                        )}
                      </div>

                      {/* Welding Position */}
                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Welding Position <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <select
                          value={layer.weldingPosition || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'weldingPosition', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                          required
                        >
                          <option value="">Select position</option>
                          {WELDING_POSITION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {layer.weldingPosition === 'Other' && (
                          <Input
                            value={layer.weldingPositionOther || ''}
                            onChange={(e) => waUpdateLayer(layer.id, 'weldingPositionOther', e.target.value)}
                            placeholder="Specify other position"
                            className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                          />
                        )}
                      </div>

                      {/* Torch Position */}
                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Torch Position <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <Input
                          value={layer.torchAngle || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'torchAngle', e.target.value)}
                          placeholder="Push 10°"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                          required
                        />
                      </div>

                      {/* Shielding Gas - Only for FCAW, GTAW, or Other processes */}
                      {requiresShieldingGas && (
                        <div className="space-y-2">
                          <Label className="dark:text-foreground">
                            Shielding Gas <span className="text-red-500 dark:text-red-400">*</span>
                          </Label>
                          <select
                            value={layer.shieldingGas || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (newValue === 'Self shielded') {
                                // Clear flow rate when self shielded
                                waUpdateLayerMultiple(layer.id, {
                                  shieldingGas: newValue,
                                  shieldingGasOther: '',
                                  shieldingFlowRate: ''
                                });
                              } else if (newValue !== 'Other') {
                                waUpdateLayerMultiple(layer.id, {
                                  shieldingGas: newValue,
                                  shieldingGasOther: ''
                                });
                              } else {
                                waUpdateLayer(layer.id, 'shieldingGas', newValue);
                              }
                            }}
                            className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                            required
                          >
                            <option value="">Select shielding gas</option>
                            {SHIELDING_GAS_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {layer.shieldingGas === 'Other' && (
                            <Input
                              value={layer.shieldingGasOther || ''}
                              onChange={(e) => waUpdateLayer(layer.id, 'shieldingGasOther', e.target.value)}
                              placeholder="Specify other gas"
                              className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                            />
                          )}
                        </div>
                      )}

                      {/* Flow Rate - Conditional (only when shielding gas is selected and not self-shielded) */}
                      {requiresFlowRate && (
                        <div className="space-y-2">
                          <Label className="dark:text-foreground">
                            Flow Rate (L/min) <span className="text-red-500 dark:text-red-400">*</span>
                          </Label>
                          <Input
                            value={layer.shieldingFlowRate || ''}
                            onChange={(e) => waUpdateLayer(layer.id, 'shieldingFlowRate', e.target.value)}
                            placeholder="e.g., 15 L/min"
                            className="dark:bg-input dark:border-border dark:text-foreground"
                            required
                          />
                        </div>
                      )}

                      {/* Flux - Conditional (only for SAW/SAW twin) */}
                      {isSAWProcess && (
                        <div className="space-y-2">
                          <Label className="dark:text-foreground">
                            Flux <span className="text-red-500 dark:text-red-400">*</span>
                          </Label>
                          <select
                            value={layer.flux || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (newValue !== 'Other') {
                                // Auto-fill standard designation
                                waUpdateLayerMultiple(layer.id, {
                                  flux: newValue,
                                  fluxOther: '',
                                  standardDesignation: FLUX_STANDARD_MAP[newValue] || ''
                                });
                              } else {
                                // Clear standard designation for Other
                                waUpdateLayerMultiple(layer.id, {
                                  flux: newValue,
                                  standardDesignation: ''
                                });
                              }
                            }}
                            className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                            required
                          >
                            <option value="">Select flux</option>
                            {FLUX_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {layer.flux === 'Other' && (
                            <Input
                              value={layer.fluxOther || ''}
                              onChange={(e) => waUpdateLayer(layer.id, 'fluxOther', e.target.value)}
                              placeholder="Specify other flux"
                              className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                            />
                          )}
                        </div>
                      )}

                      {/* Standard Designation - Conditional (only for SAW/SAW twin) */}
                      {isSAWProcess && (
                        <div className="space-y-2">
                          <Label className="dark:text-foreground">Standard Designation</Label>
                          <Input
                            value={layer.standardDesignation || ''}
                            onChange={(e) => waUpdateLayer(layer.id, 'standardDesignation', e.target.value)}
                            placeholder="Auto-filled based on flux"
                            className="dark:bg-input dark:border-border dark:text-foreground bg-muted/50"
                            readOnly={layer.flux !== 'Other'}
                          />
                          {layer.flux && layer.flux !== 'Other' && (
                            <p className="text-xs text-muted-foreground">Auto-filled based on flux selection</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WA Parameters */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2">WA Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Stick-out (mm) <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <Input
                          value={layer.stickOut || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'stickOut', e.target.value)}
                          placeholder="e.g., 15 mm"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Type of Current <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <select
                          value={layer.currentType || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue !== 'Other') {
                              waUpdateLayerMultiple(layer.id, {
                                currentType: newValue,
                                currentTypeOther: ''
                              });
                            } else {
                              waUpdateLayer(layer.id, 'currentType', newValue);
                            }
                          }}
                          className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                          required
                        >
                          <option value="">Select current type</option>
                          {CURRENT_TYPE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {layer.currentType === 'Other' && (
                          <Input
                            value={layer.currentTypeOther || ''}
                            onChange={(e) => waUpdateLayer(layer.id, 'currentTypeOther', e.target.value)}
                            placeholder="Specify other current type (e.g., AC)"
                            className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                            required
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Welding Mode <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <select
                          value={layer.currentModeSynergy || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'currentModeSynergy', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground"
                          required
                        >
                          <option value="">Select welding mode</option>
                          {WELDING_MODE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {layer.currentModeSynergy === 'Other' && (
                          <Input
                            value={layer.currentModeSynergyOther || ''}
                            onChange={(e) => waUpdateLayer(layer.id, 'currentModeSynergyOther', e.target.value)}
                            placeholder="CMT, etc."
                            className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                            required
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Wire Feed Speed (m/min) <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <Input
                          value={layer.wireFeedSpeed || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'wireFeedSpeed', e.target.value)}
                          placeholder="e.g., 7 m/min"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Intensity (A) <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <Input
                          value={layer.intensity || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'intensity', e.target.value)}
                          placeholder="e.g., 200 A"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Voltage (V) <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <Input
                          value={layer.voltage || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'voltage', e.target.value)}
                          placeholder="e.g., 26 V"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">
                          Welding Speed (cm/min) <span className="text-red-500 dark:text-red-400">*</span>
                        </Label>
                        <Input
                          value={layer.travelSpeed || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'travelSpeed', e.target.value)}
                          placeholder="e.g., 30 cm/min"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Oscillation Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 border-b pb-2">Oscillation Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="dark:text-foreground">Amplitude (mm)</Label>
                        <Input
                          value={layer.oscillationAmplitude || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'oscillationAmplitude', e.target.value)}
                          placeholder="e.g., 5 mm"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">Period (s)</Label>
                        <Input
                          value={layer.oscillationPeriod || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'oscillationPeriod', e.target.value)}
                          placeholder="e.g., 1.5 s"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="dark:text-foreground">Tempos (s)</Label>
                        <Input
                          value={layer.oscillationTempos || ''}
                          onChange={(e) => waUpdateLayer(layer.id, 'oscillationTempos', e.target.value)}
                          placeholder="e.g., 0.5 s"
                          className="dark:bg-input dark:border-border dark:text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Layer Button - Bottom of layers */}
        <Button
          type="button"
          onClick={waAddLayer}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-dashed border-2 hover:border-wa-green-500 hover:bg-wa-green-50 dark:hover:bg-accent/30"
        >
          <Plus className="h-4 w-4" />
          Add Another Layer
        </Button>
      </div>

      {/* Heating Procedure Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Heating Procedure</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preheatingTemp" className="dark:text-foreground">Preheating Temperature (°C)</Label>
            <Input
              id="preheatingTemp"
              value={formData.wps?.preheatingTemp || ''}
              onChange={(e) => waUpdateWps('preheatingTemp', e.target.value)}
              placeholder="e.g., 150 °C"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interpassTemp" className="dark:text-foreground">Interpass Temperature (°C)</Label>
            <Input
              id="interpassTemp"
              value={formData.wps?.interpassTemp || ''}
              onChange={(e) => waUpdateWps('interpassTemp', e.target.value)}
              placeholder="e.g., 200 °C"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postheatingTemp" className="dark:text-foreground">Postheating (°C)</Label>
            <Input
              id="postheatingTemp"
              value={formData.wps?.postheatingTemp || ''}
              onChange={(e) => waUpdateWps('postheatingTemp', e.target.value)}
              placeholder="e.g., 250 °C"
              className="dark:bg-input dark:border-border dark:text-foreground"
            />
          </div>
        </div>

        {/* PWHT Section */}
        <div className="space-y-4 mt-4 p-4 border border-border rounded-lg">
          <div className="flex items-center gap-4">
            <Label htmlFor="pwhtRequired" className="dark:text-foreground font-semibold">
              Post Weld Heat Treatment (PWHT)
            </Label>
            <select
              id="pwhtRequired"
              value={formData.wps?.pwhtRequired || ''}
              onChange={(e) => waUpdateWps('pwhtRequired', e.target.value)}
              className="h-10 px-3 rounded-md border border-border bg-input text-foreground"
            >
              <option value="">Select</option>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>

          {formData.wps?.pwhtRequired === 'Y' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pwhtHeatingRate" className="dark:text-foreground">Heating Rate (°C/h)</Label>
                <Input
                  id="pwhtHeatingRate"
                  value={formData.wps?.pwhtHeatingRate || ''}
                  onChange={(e) => waUpdateWps('pwhtHeatingRate', e.target.value)}
                  placeholder="e.g., 100 °C/h"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pwhtTempHoldingTime" className="dark:text-foreground">Temperature & Holding Time</Label>
                <Input
                  id="pwhtTempHoldingTime"
                  value={formData.wps?.pwhtTempHoldingTime || ''}
                  onChange={(e) => waUpdateWps('pwhtTempHoldingTime', e.target.value)}
                  placeholder="e.g., 600°C - 2H"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pwhtCoolingRate" className="dark:text-foreground">Cooling Rate (°C/h)</Label>
                <Input
                  id="pwhtCoolingRate"
                  value={formData.wps?.pwhtCoolingRate || ''}
                  onChange={(e) => waUpdateWps('pwhtCoolingRate', e.target.value)}
                  placeholder="e.g., 50 °C/h"
                  className="dark:bg-input dark:border-border dark:text-foreground"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Supporting Documents</h3>
        <p className="text-sm text-muted-foreground">Upload up to 5 supporting documents (optional)</p>

        <div className="space-y-3">
          {/* Display uploaded documents */}
          {(formData.wps?.documents || []).map((doc: { name: string }, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate max-w-[200px]">{doc.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newDocs = (formData.wps?.documents || []).filter((_: unknown, i: number) => i !== index);
                  waUpdateWps('documents', newDocs);
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ))}

          {/* Upload button */}
          {(formData.wps?.documents || []).length < 5 && (
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-wa-green-400 hover:bg-muted/30 transition-colors">
              <FileUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload document</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log('[StepWPS] File selected:', file.name, 'type:', file.type, 'size:', file.size);
                    const currentDocs = formData.wps?.documents || [];
                    if (currentDocs.length < 5) {
                      const newDoc = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        file: file
                      };
                      console.log('[StepWPS] Adding doc to state, hasFile:', newDoc.file instanceof File);
                      waUpdateWps('documents', [...currentDocs, newDoc]);
                    }
                  }
                  e.target.value = '';
                }}
              />
            </label>
          )}

          <p className="text-xs text-muted-foreground">
            Accepted formats: PDF, Word, Excel, Images • Max 5 files
          </p>
        </div>
      </div>

      {/* Additional Notes Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">Additional Notes</h3>
        <Textarea
          id="additionalNotes"
          value={formData.wps?.additionalNotes || ''}
          onChange={(e) => waUpdateWps('additionalNotes', e.target.value)}
          placeholder="Any additional observations or recommendations..."
          className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
        />
      </div>
    </div>
  );
}
