'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  GitCompare,
  Search,
  X,
  Building2,
  MapPin,
  Package,
  Wrench,
  DollarSign,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  Download,
  Filter,
  Trophy,
  TrendingUp,
  Eye,
  EyeOff,
  FileText,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type CaseStudySummary = {
  id: string;
  customerName: string;
  industry: string;
  location: string;
  country: string;
  componentWorkpiece: string;
  workType: string;
  wearType: string[];
  problemDescription: string;
  waSolution: string;
  waProduct: string;
  technicalAdvantages: string;
  expectedServiceLife: string;
  previousServiceLife: string;
  solutionValueRevenue: number | null;
  annualPotentialRevenue: number | null;
  customerSavingsAmount: number | null;
  type: string;
  status: string;
};

type SectionKey = 'basic' | 'solution' | 'financial' | 'details';

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [searchTerm3, setSearchTerm3] = useState('');
  const [searchResults1, setSearchResults1] = useState<CaseStudySummary[]>([]);
  const [searchResults2, setSearchResults2] = useState<CaseStudySummary[]>([]);
  const [searchResults3, setSearchResults3] = useState<CaseStudySummary[]>([]);
  const [selectedCases, setSelectedCases] = useState<(CaseStudySummary | null)[]>([null, null, null]);
  const [isSearching, setIsSearching] = useState(false);

  // New state for enhanced features
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['basic', 'solution', 'financial', 'details'])
  );
  const [showFilter, setShowFilter] = useState(false);
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Load pre-selected cases from URL params
  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (ids.length > 0) {
      fetchCasesByIds(ids);
    }
  }, [searchParams]);

  const fetchCasesByIds = async (ids: string[]) => {
    try {
      const promises = ids.slice(0, 3).map(id =>
        fetch(`/api/case-studies/${id}`).then(res => res.json())
      );
      const cases = await Promise.all(promises);
      const newSelected = [...selectedCases];
      cases.forEach((caseData, index) => {
        if (caseData) {
          newSelected[index] = caseData;
        }
      });
      setSelectedCases(newSelected);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load case studies');
    }
  };

  const searchCases = async (term: string, position: number) => {
    if (!term || term.trim().length < 2) {
      if (position === 0) setSearchResults1([]);
      if (position === 1) setSearchResults2([]);
      if (position === 2) setSearchResults3([]);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/case-studies/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();

      if (position === 0) setSearchResults1(data.cases || []);
      if (position === 1) setSearchResults2(data.cases || []);
      if (position === 2) setSearchResults3(data.cases || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const selectCase = (caseStudy: CaseStudySummary, position: number) => {
    const newSelected = [...selectedCases];
    newSelected[position] = caseStudy;
    setSelectedCases(newSelected);

    if (position === 0) {
      setSearchResults1([]);
      setSearchTerm1('');
    }
    if (position === 1) {
      setSearchResults2([]);
      setSearchTerm2('');
    }
    if (position === 2) {
      setSearchResults3([]);
      setSearchTerm3('');
    }
  };

  const removeCase = (position: number) => {
    const newSelected = [...selectedCases];
    newSelected[position] = null;
    setSelectedCases(newSelected);
  };

  const swapCases = (pos1: number, pos2: number) => {
    const newSelected = [...selectedCases];
    [newSelected[pos1], newSelected[pos2]] = [newSelected[pos2], newSelected[pos1]];
    setSelectedCases(newSelected);
    toast.success('Cases swapped!');
  };

  const toggleSection = (section: SectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleFieldVisibility = (field: string) => {
    const newHidden = new Set(hiddenFields);
    if (newHidden.has(field)) {
      newHidden.delete(field);
    } else {
      newHidden.add(field);
    }
    setHiddenFields(newHidden);
  };

  const handleExport = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 'bg-blue-500 text-white';
      case 'TECH':
        return 'bg-purple-500 text-white';
      case 'STAR':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypePoints = (type: string) => {
    switch (type) {
      case 'APPLICATION': return 1;
      case 'TECH': return 2;
      case 'STAR': return 3;
      default: return 0;
    }
  };

  // Calculate winner based on multiple metrics
  const calculateWinner = (): number | null => {
    const validCases = selectedCases.filter(c => c !== null);
    if (validCases.length < 2) return null;

    const scores = selectedCases.map((caseStudy, index) => {
      if (!caseStudy) return { index, score: 0 };

      let score = 0;

      // Type points (STAR=3, TECH=2, APPLICATION=1)
      score += getTypePoints(caseStudy.type) * 100;

      // Financial metrics
      if (caseStudy.solutionValueRevenue) score += caseStudy.solutionValueRevenue / 1000;
      if (caseStudy.annualPotentialRevenue) score += caseStudy.annualPotentialRevenue / 1000;
      if (caseStudy.customerSavingsAmount) score += caseStudy.customerSavingsAmount / 1000;

      return { index, score };
    });

    const maxScore = Math.max(...scores.map(s => s.score));
    if (maxScore === 0) return null;

    const winner = scores.find(s => s.score === maxScore);
    return winner ? winner.index : null;
  };

  const winnerIndex = calculateWinner();

  // Get better/worse indicators for numeric values
  const getValueIndicator = (values: (number | null)[], currentIndex: number) => {
    const validValues = values.filter(v => v !== null) as number[];
    if (validValues.length < 2 || values[currentIndex] === null) return null;

    const currentValue = values[currentIndex] as number;
    const max = Math.max(...validValues);
    const min = Math.min(...validValues);

    if (currentValue === max && max !== min) return 'best';
    if (currentValue === min && max !== min) return 'worst';
    return 'neutral';
  };

  const ComparisonCard = ({ label, values, icon: Icon, fieldKey, showIndicator = false }: {
    label: string;
    values: (string | number | null | undefined)[];
    icon?: React.ElementType;
    fieldKey: string;
    showIndicator?: boolean;
  }) => {
    if (hiddenFields.has(fieldKey)) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {values.map((value, index) => {
            const numericValues = showIndicator && typeof value === 'string' && value.includes('$')
              ? values.map(v => v ? parseFloat(v.toString().replace(/[$,]/g, '')) : null)
              : null;

            const indicator = numericValues ? getValueIndicator(numericValues, index) : null;

            return (
              <div
                key={index}
                className={`p-3 rounded-md border-2 transition-all ${
                  !selectedCases[index]
                    ? 'bg-gray-50 border-gray-200'
                    : indicator === 'best'
                    ? 'bg-green-50 border-green-300 shadow-sm'
                    : indicator === 'worst'
                    ? 'bg-red-50 border-red-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {value || <span className="text-gray-400 italic text-xs">Not provided</span>}
                  </p>
                  {indicator === 'best' && (
                    <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  {indicator === 'worst' && (
                    <TrendingUp className="h-4 w-4 text-red-600 flex-shrink-0 rotate-180" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SectionHeader = ({ section, title, icon: Icon, count }: {
    section: SectionKey;
    title: string;
    icon: React.ElementType;
    count: number;
  }) => {
    const isExpanded = expandedSections.has(section);

    return (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {count} fields
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
        )}
      </button>
    );
  };

  const TextComparisonCard = ({ title, values, colorScheme }: {
    title: string;
    values: (string | null | undefined)[];
    colorScheme: 'red' | 'green' | 'blue';
  }) => {
    const colors = {
      red: {
        bg: 'from-red-50 to-orange-50',
        border: 'border-red-300',
        header: 'bg-red-100 text-red-900',
        icon: 'text-red-600'
      },
      green: {
        bg: 'from-green-50 to-emerald-50',
        border: 'border-green-300',
        header: 'bg-green-100 text-green-900',
        icon: 'text-green-600'
      },
      blue: {
        bg: 'from-blue-50 to-cyan-50',
        border: 'border-blue-300',
        header: 'bg-blue-100 text-blue-900',
        icon: 'text-blue-600'
      }
    };

    const scheme = colors[colorScheme];

    return (
      <div>
        <div className={`${scheme.header} px-4 py-2 rounded-t-lg border-b-2 ${scheme.border}`}>
          <h4 className="font-bold text-sm uppercase tracking-wide">{title}</h4>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {values.map((value, index) => (
            <div
              key={index}
              className={`p-4 bg-gradient-to-br ${scheme.bg} rounded-lg border-2 ${scheme.border} shadow-sm hover:shadow-lg transition-all min-h-[120px]`}
            >
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {value || <span className="text-gray-400 italic">Not provided</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-6 ${isPrintMode ? 'print-mode' : ''}`}>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-mode {
            max-width: 100% !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GitCompare className="h-8 w-8" />
          Compare Case Studies
        </h1>
        <p className="mt-2 text-blue-100">
          Select up to 3 case studies for detailed side-by-side comparison with insights
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid md:grid-cols-3 gap-4 no-print">
        {[0, 1, 2].map((position) => (
          <Card key={position} className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Position {position + 1}</CardTitle>
                {selectedCases[position] && position < 2 && selectedCases[position + 1] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => swapCases(position, position + 1)}
                    className="gap-1"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {selectedCases[position] && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getTypeColor(selectedCases[position]!.type)} text-xs font-semibold`}>
                      {selectedCases[position]!.type}
                    </Badge>
                    {winnerIndex === position && (
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        <Trophy className="h-3 w-3" />
                        <span className="text-xs font-bold">Winner</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCase(position)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedCases[position] ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">
                    {selectedCases[position]!.customerName}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {selectedCases[position]!.componentWorkpiece}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedCases[position]!.location}, {selectedCases[position]!.country}
                  </p>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">Product:</span> {selectedCases[position]!.waProduct}
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">Industry:</span> {selectedCases[position]!.industry}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search case studies..."
                      value={position === 0 ? searchTerm1 : position === 1 ? searchTerm2 : searchTerm3}
                      onChange={(e) => {
                        const term = e.target.value;
                        if (position === 0) setSearchTerm1(term);
                        if (position === 1) setSearchTerm2(term);
                        if (position === 2) setSearchTerm3(term);
                        searchCases(term, position);
                      }}
                      className="pl-10"
                    />
                  </div>

                  {/* Search Results */}
                  {((position === 0 && searchResults1.length > 0) ||
                    (position === 1 && searchResults2.length > 0) ||
                    (position === 2 && searchResults3.length > 0)) && (
                    <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
                      {(position === 0 ? searchResults1 : position === 1 ? searchResults2 : searchResults3).map((caseStudy) => (
                        <button
                          key={caseStudy.id}
                          onClick={() => selectCase(caseStudy, position)}
                          className="w-full text-left p-2 hover:bg-blue-50 rounded-md border border-gray-100 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {caseStudy.customerName} - {caseStudy.componentWorkpiece}
                          </p>
                          <p className="text-xs text-gray-600">
                            {caseStudy.industry} • {caseStudy.location}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      {selectedCases.some(c => c !== null) && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3 shadow-sm no-print">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter Fields
            </Button>
            {showFilter && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {hiddenFields.size} hidden
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExpandedSections(new Set(['basic', 'solution', 'financial', 'details']));
                toast.success('All sections expanded');
              }}
              className="gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExpandedSections(new Set());
                toast.success('All sections collapsed');
              }}
              className="gap-2"
            >
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExport}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export / Print
            </Button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && selectedCases.some(c => c !== null) && (
        <Card className="no-print border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Comparison Fields
            </CardTitle>
            <CardDescription className="text-xs">
              Toggle visibility of specific fields in the comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: 'customer', label: 'Customer Name' },
                { key: 'industry', label: 'Industry' },
                { key: 'location', label: 'Location' },
                { key: 'component', label: 'Component' },
                { key: 'workType', label: 'Work Type' },
                { key: 'wearTypes', label: 'Wear Types' },
                { key: 'product', label: 'WA Product' },
                { key: 'previousLife', label: 'Previous Life' },
                { key: 'expectedLife', label: 'Expected Life' },
                { key: 'solutionValue', label: 'Solution Value' },
                { key: 'annualRevenue', label: 'Annual Revenue' },
                { key: 'savings', label: 'Customer Savings' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleFieldVisibility(key)}
                  className={`text-left px-3 py-2 rounded-md border-2 transition-all text-sm ${
                    hiddenFields.has(key)
                      ? 'bg-gray-100 border-gray-300 text-gray-400 line-through'
                      : 'bg-white border-blue-300 text-gray-900 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {hiddenFields.has(key) ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Content */}
      {selectedCases.some(c => c !== null) && (
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <SectionHeader section="basic" title="Basic Information" icon={Building2} count={6} />

            {expandedSections.has('basic') && (
              <div className="space-y-4 pl-4">
                <ComparisonCard
                  label="Customer Name"
                  values={selectedCases.map(c => c?.customerName)}
                  icon={Building2}
                  fieldKey="customer"
                />
                <ComparisonCard
                  label="Industry"
                  values={selectedCases.map(c => c?.industry)}
                  icon={Target}
                  fieldKey="industry"
                />
                <ComparisonCard
                  label="Location"
                  values={selectedCases.map(c => c?.location && c?.country ? `${c.location}, ${c.country}` : null)}
                  icon={MapPin}
                  fieldKey="location"
                />
                <ComparisonCard
                  label="Component / Workpiece"
                  values={selectedCases.map(c => c?.componentWorkpiece)}
                  icon={Package}
                  fieldKey="component"
                />
                <ComparisonCard
                  label="Work Type"
                  values={selectedCases.map(c => c?.workType)}
                  icon={Wrench}
                  fieldKey="workType"
                />
                <ComparisonCard
                  label="Wear Types"
                  values={selectedCases.map(c => c?.wearType?.join(', '))}
                  icon={Zap}
                  fieldKey="wearTypes"
                />
              </div>
            )}
          </div>

          {/* Solution Details Section */}
          <div className="space-y-4">
            <SectionHeader section="solution" title="Solution Details" icon={Target} count={3} />

            {expandedSections.has('solution') && (
              <div className="space-y-4 pl-4">
                <ComparisonCard
                  label="WA Product"
                  values={selectedCases.map(c => c?.waProduct)}
                  icon={Package}
                  fieldKey="product"
                />
                <ComparisonCard
                  label="Previous Service Life"
                  values={selectedCases.map(c => c?.previousServiceLife)}
                  icon={BarChart3}
                  fieldKey="previousLife"
                />
                <ComparisonCard
                  label="Expected Service Life"
                  values={selectedCases.map(c => c?.expectedServiceLife)}
                  icon={TrendingUp}
                  fieldKey="expectedLife"
                  showIndicator
                />
              </div>
            )}
          </div>

          {/* Financial Impact Section */}
          <div className="space-y-4">
            <SectionHeader section="financial" title="Financial Impact" icon={DollarSign} count={3} />

            {expandedSections.has('financial') && (
              <div className="space-y-4 pl-4">
                <ComparisonCard
                  label="Solution Value Revenue"
                  values={selectedCases.map(c =>
                    c?.solutionValueRevenue ? `$${c.solutionValueRevenue.toLocaleString()}` : null
                  )}
                  icon={DollarSign}
                  fieldKey="solutionValue"
                  showIndicator
                />
                <ComparisonCard
                  label="Annual Potential Revenue"
                  values={selectedCases.map(c =>
                    c?.annualPotentialRevenue ? `$${c.annualPotentialRevenue.toLocaleString()}` : null
                  )}
                  icon={DollarSign}
                  fieldKey="annualRevenue"
                  showIndicator
                />
                <ComparisonCard
                  label="Customer Savings Amount"
                  values={selectedCases.map(c =>
                    c?.customerSavingsAmount ? `$${c.customerSavingsAmount.toLocaleString()}` : null
                  )}
                  icon={DollarSign}
                  fieldKey="savings"
                  showIndicator
                />
              </div>
            )}
          </div>

          {/* Detailed Descriptions Section */}
          <div className="space-y-4">
            <SectionHeader section="details" title="Detailed Descriptions" icon={FileText} count={3} />

            {expandedSections.has('details') && (
              <div className="space-y-6 pl-4">
                <TextComparisonCard
                  title="Problem Description"
                  values={selectedCases.map(c => c?.problemDescription)}
                  colorScheme="red"
                />
                <TextComparisonCard
                  title="WA Solution"
                  values={selectedCases.map(c => c?.waSolution)}
                  colorScheme="green"
                />
                <TextComparisonCard
                  title="Technical Advantages"
                  values={selectedCases.map(c => c?.technicalAdvantages)}
                  colorScheme="blue"
                />
              </div>
            )}
          </div>

          {/* Winner Summary */}
          {winnerIndex !== null && (
            <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg no-print">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  Winner Analysis
                </CardTitle>
                <CardDescription className="text-yellow-800">
                  Based on case type, financial metrics, and overall value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border-2 border-yellow-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Position {winnerIndex + 1} leads with the highest combined score:
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Customer:</span> {selectedCases[winnerIndex]?.customerName}
                    </div>
                    <div>
                      <Badge className={getTypeColor(selectedCases[winnerIndex]!.type)}>
                        {selectedCases[winnerIndex]?.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedCases.some(c => c !== null) && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <GitCompare className="h-16 w-16 text-gray-300 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">No Cases Selected</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Search and select case studies above to start comparing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
