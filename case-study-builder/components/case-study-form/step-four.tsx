'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import dynamic from 'next/dynamic';
import { Mic, Sparkles, Camera, FileText } from 'lucide-react';
import CaseStudyImageUpload from '@/components/case-study-image-upload';
import DocumentUpload from '@/components/document-upload';
import { ServiceLifePicker, type ServiceLifeValue } from '@/components/ui/service-life-picker';

// Dynamic imports for heavy components (saves ~150KB)
const VoiceInput = dynamic(() => import('@/components/voice-input'), {
  loading: () => (
    <button className="p-2 rounded-lg border border-border bg-muted/50 opacity-50 cursor-not-allowed">
      <Mic className="h-4 w-4 text-muted-foreground" />
    </button>
  ),
});

const AITextAssistant = dynamic(() => import('@/components/ai-text-assistant'), {
  loading: () => (
    <button className="p-2 rounded-lg border border-border bg-muted/50 opacity-50 cursor-not-allowed">
      <Sparkles className="h-4 w-4 text-muted-foreground" />
    </button>
  ),
});

// WA Products list (379 products)
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

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

export default function StepFour({ formData, updateFormData }: Props) {
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [productSearch, setProductSearch] = useState(formData.waProduct || '');
  const productInputRef = useRef<HTMLInputElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Filter products based on search
  const filteredProducts = productSearch.length > 0
    ? WA_PRODUCTS.filter(p => p.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 10)
    : [];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node) &&
        productInputRef.current &&
        !productInputRef.current.contains(event.target as Node)
      ) {
        setShowProductSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync productSearch with formData.waProduct
  useEffect(() => {
    setProductSearch(formData.waProduct || '');
  }, [formData.waProduct]);

  return (
    <div className="space-y-6">
      {/* Base Metal - Text Input (first field) */}
      <div className="space-y-2">
        <Label htmlFor="baseMetal" className="dark:text-foreground">
          Base Metal <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <Input
          id="baseMetal"
          value={formData.baseMetal}
          onChange={(e) => updateFormData({ baseMetal: e.target.value })}
          placeholder="e.g., Carbon Steel, Stainless Steel, Manganese Steel"
          className="dark:bg-input dark:border-border dark:text-foreground"
          required
        />
      </div>

      {/* General Dimensions + Unit System on same line */}
      <div className="space-y-2">
        <Label htmlFor="generalDimensions" className="dark:text-foreground">
          General dimensions ({formData.unitSystem === 'IMPERIAL' ? 'inches' : 'mm'}) <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <div className="flex gap-3 items-center">
          <Input
            id="generalDimensions"
            value={formData.generalDimensions}
            onChange={(e) => updateFormData({ generalDimensions: e.target.value })}
            placeholder={formData.unitSystem === 'IMPERIAL' ? 'e.g., 24" x 36" x 2"' : 'e.g., 600mm x 900mm x 50mm'}
            className="flex-1 dark:bg-input dark:border-border dark:text-foreground"
            required
          />
          <div className="flex gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => updateFormData({ unitSystem: 'METRIC' })}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                formData.unitSystem === 'METRIC' || !formData.unitSystem
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={() => updateFormData({ unitSystem: 'IMPERIAL' })}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                formData.unitSystem === 'IMPERIAL'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>
      </div>

      {/* WA Solution */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="waSolution" className="dark:text-foreground">
            WA Solution Description <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <VoiceInput
              currentValue={formData.waSolution}
              onTranscript={(text) => updateFormData({ waSolution: text })}
            />
            <AITextAssistant
              text={formData.waSolution}
              onTextChange={(text) => updateFormData({ waSolution: text })}
              fieldType="solution"
            />
          </div>
        </div>
        <Textarea
          id="waSolution"
          value={formData.waSolution}
          onChange={(e) => updateFormData({ waSolution: e.target.value })}
          placeholder="Describe the Welding Alloys solution implemented..."
          className="min-h-[120px] dark:bg-input dark:border-border dark:text-foreground"
          required
        />
        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
          Explain what WA recommended and how it was implemented
        </p>
      </div>

      {/* Product Category - New Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="productCategory" className="dark:text-foreground">
          WA Product Category <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <Select
          value={formData.productCategory}
          onValueChange={(value) => {
            updateFormData({ productCategory: value });
            // Clear other fields when changing category
            if (value !== 'CONSUMABLES') {
              updateFormData({ waProduct: '', waProductDiameter: '' });
            }
            if (value !== 'OTHER') {
              updateFormData({ productCategoryOther: '' });
            }
            if (value === 'CONSUMABLES') {
              updateFormData({ productDescription: '' });
            }
          }}
        >
          <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
            <SelectValue placeholder="Select product category" />
          </SelectTrigger>
          <SelectContent className="dark:bg-popover dark:border-border">
            <SelectItem value="CONSUMABLES">Consumables</SelectItem>
            <SelectItem value="COMPOSITE_WEAR_PLATES">Composite wear plates</SelectItem>
            <SelectItem value="WEAR_PIPES_TUBES">Wear pipes & Tubes</SelectItem>
            <SelectItem value="OTHER">Other (specify)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional Fields Based on Product Category */}
      {formData.productCategory === 'CONSUMABLES' ? (
        /* Show Product Search + Diameter for Consumables */
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 relative">
            <Label htmlFor="waProduct" className="dark:text-foreground">
              WA Product Used <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              ref={productInputRef}
              id="waProduct"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                updateFormData({ waProduct: e.target.value });
                setShowProductSuggestions(true);
              }}
              onFocus={() => setShowProductSuggestions(true)}
              placeholder="Type to search products..."
              className="dark:bg-input dark:border-border dark:text-foreground"
              autoComplete="off"
              required
            />
            {/* Autocomplete dropdown */}
            {showProductSuggestions && filteredProducts.length > 0 && (
              <div
                ref={productDropdownRef}
                className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {filteredProducts.map((product, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-b-0"
                    onClick={() => {
                      setProductSearch(product);
                      updateFormData({ waProduct: product });
                      setShowProductSuggestions(false);
                    }}
                  >
                    {product}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Diameter - Dropdown with mm values (x.x format), auto-converts to inches */}
          <div className="space-y-2">
            <Label htmlFor="waProductDiameter" className="dark:text-foreground">
              Diameter <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <select
              id="waProductDiameter"
              value={formData.waProductDiameter || ''}
              onChange={(e) => updateFormData({ waProductDiameter: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground dark:bg-input dark:border-border dark:text-foreground"
              required
            >
              <option value="">Select diameter</option>
              {[1.0, 1.2, 1.3, 1.6, 2.0, 2.2, 2.4, 2.8, 3.2, 4.0, 5.0, 6.0, 8.0, 12.0].map((mm) => {
                const mmFormatted = mm.toFixed(1); // Always x.x format
                const inches = (mm / 25.4).toFixed(3);
                const displayValue = formData.unitSystem === 'IMPERIAL'
                  ? `${inches} in`
                  : `${mmFormatted} mm`;
                return (
                  <option key={mm} value={mmFormatted}>
                    {displayValue}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      ) : formData.productCategory === 'OTHER' ? (
        /* Show TWO inputs for OTHER category */
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="productCategoryOther" className="dark:text-foreground">
              Specify Category <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="productCategoryOther"
              value={formData.productCategoryOther}
              onChange={(e) => updateFormData({ productCategoryOther: e.target.value })}
              placeholder="e.g., Custom wear plates, Special coatings"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground">
              Name the product category
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="productDescription" className="dark:text-foreground">
              Product Description <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) => updateFormData({ productDescription: e.target.value })}
              placeholder="e.g., HARDPLATE 5+3 mm"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground">
              Describe the product specification
            </p>
          </div>
        </div>
      ) : formData.productCategory ? (
        /* Show Text Field for Other Categories (Composite wear plates, Wear pipes & Tubes) */
        <div className="space-y-2">
          <Label htmlFor="productDescription" className="dark:text-foreground">
            Product Description <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Input
            id="productDescription"
            value={formData.productDescription}
            onChange={(e) => updateFormData({ productDescription: e.target.value })}
            placeholder="e.g., HARDPLATE 5+3 mm"
            className="dark:bg-input dark:border-border dark:text-foreground"
            required
          />
          <p className="text-xs text-muted-foreground">
            Describe the product specification (e.g., dimensions, grade)
          </p>
        </div>
      ) : null}

      {/* Job Duration - mobile-friendly picker */}
      <div className="space-y-2">
        <Label className="dark:text-foreground">
          Job Duration <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">How long did the WA solution job/maintenance take</p>
        <ServiceLifePicker
          label="Job Duration"
          required
          value={{
            hours: parseInt(formData.jobDurationHours || '0') || 0,
            days: parseInt(formData.jobDurationDays || '0') || 0,
            weeks: parseInt(formData.jobDurationWeeks || '0') || 0,
            months: parseInt(formData.jobDurationMonths || '0') || 0,
            years: parseInt(formData.jobDurationYears || '0') || 0,
          }}
          onChange={(val: ServiceLifeValue) => {
            updateFormData({
              jobDurationHours: val.hours > 0 ? String(val.hours) : '',
              jobDurationDays: val.days > 0 ? String(val.days) : '',
              jobDurationWeeks: val.weeks > 0 ? String(val.weeks) : '',
              jobDurationMonths: val.months > 0 ? String(val.months) : '',
              jobDurationYears: val.years > 0 ? String(val.years) : '',
            });
          }}
        />
      </div>

      {/* Technical Advantages - BRD 3.3 Required */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="technicalAdvantages" className="dark:text-foreground">
            Technical Advantages <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <VoiceInput
              currentValue={formData.technicalAdvantages}
              onTranscript={(text) => updateFormData({ technicalAdvantages: text })}
            />
            <AITextAssistant
              text={formData.technicalAdvantages}
              onTextChange={(text) => updateFormData({ technicalAdvantages: text })}
              fieldType="technical"
            />
          </div>
        </div>
        <Textarea
          id="technicalAdvantages"
          value={formData.technicalAdvantages}
          onChange={(e) => updateFormData({ technicalAdvantages: e.target.value })}
          placeholder="Describe how the WA solution improved the job. You can mention service life, wear resistance, hardness, welding quality, repair speed, intervention time, reduced downtime, easier handling, or improved safety."
          className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
          required
        />
      </div>

      {/* Images Upload Section */}
      <div className="space-y-2">
        <Label className="dark:text-foreground flex items-center gap-2">
          <Camera className="h-4 w-4 text-wa-green-600" />
          Images <span className="text-red-500 dark:text-red-400">*</span>
          <span className="text-xs text-muted-foreground">(Minimum 2 required)</span>
        </Label>
        <CaseStudyImageUpload
          onImagesChange={(images) => updateFormData({ images })}
          existingImages={formData.images}
          maxAdditionalImages={5}
        />
        {formData.images.length < 2 && (
          <p className="text-xs text-red-500 dark:text-red-400">
            Please upload at least 2 images ({formData.images.length}/2 uploaded)
          </p>
        )}
      </div>

      {/* Supporting Documents Section */}
      <div className="space-y-2">
        <Label className="dark:text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-wa-green-600" />
          Supporting Documents
          <span className="text-xs text-muted-foreground">(Optional)</span>
        </Label>
        <DocumentUpload
          onDocumentsChange={(documents) => updateFormData({ supportingDocs: documents })}
          existingDocuments={formData.supportingDocs}
          maxDocuments={5}
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-accent dark:border-primary">
        <h4 className="font-semibold text-green-900 mb-2 dark:text-foreground">Great Solution Descriptions Include:</h4>
        <ul className="space-y-1 text-sm text-green-800 list-disc list-inside dark:text-muted-foreground">
          <li>Specific WA product and process used</li>
          <li>Technical specifications (hardness, layers, etc.)</li>
          <li>Implementation approach (workshop vs on-site)</li>
          <li>Measurable results and improvements</li>
        </ul>
      </div>
    </div>
  );
}
