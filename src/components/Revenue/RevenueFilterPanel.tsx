import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Save, Calendar, BarChart3, AlertTriangle, Star } from "lucide-react";
import { RevenueFilters } from "@/hooks/useRevenueFilters";
import { toast } from "sonner";

interface RevenueFilterPanelProps {
  filters: RevenueFilters;
  onFiltersChange: (filters: Partial<RevenueFilters>) => void;
  onReset: () => void;
  onApplyQuickFilter: (preset: string) => void;
  hasActiveFilters: boolean;
  availableYears: number[];
  minRevenue: number;
  maxRevenue: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const QUICK_FILTERS = [
  { id: 'ytd', label: 'Year to Date', icon: Calendar },
  { id: 'q1', label: 'Q1 (Jan-Mar)', icon: BarChart3 },
  { id: 'q2', label: 'Q2 (Apr-Jun)', icon: BarChart3 },
  { id: 'q3', label: 'Q3 (Jul-Sep)', icon: BarChart3 },
  { id: 'q4', label: 'Q4 (Oct-Dec)', icon: BarChart3 },
  { id: 'current_year', label: 'Current Year', icon: Calendar },
  { id: 'problem_rigs', label: 'Problem Rigs', icon: AlertTriangle },
  { id: 'star_performers', label: 'Star Performers', icon: Star },
];

export const RevenueFilterPanel = ({
  filters,
  onFiltersChange,
  onReset,
  onApplyQuickFilter,
  hasActiveFilters,
  availableYears,
  minRevenue,
  maxRevenue,
}: RevenueFilterPanelProps) => {
  const [rigs, setRigs] = useState<{ rig_code: string; rig_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revenueRange, setRevenueRange] = useState<[number, number]>([
    filters.revenueRange.min || minRevenue,
    filters.revenueRange.max || maxRevenue,
  ]);

  // Fetch available rigs
  useEffect(() => {
    const fetchRigs = async () => {
      try {
        const { data, error } = await supabase
          .from('dim_rig')
          .select('rig_code, rig_name')
          .eq('active', true)
          .order('rig_code');

        if (error) throw error;
        setRigs(data || []);
      } catch (error) {
        console.error('Error fetching rigs:', error);
        toast.error('Failed to load rigs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRigs();
  }, []);

  const handleYearToggle = (year: number) => {
    const newYears = filters.years.includes(year)
      ? filters.years.filter(y => y !== year)
      : [...filters.years, year];
    onFiltersChange({ years: newYears });
  };

  const handleMonthToggle = (month: string) => {
    const newMonths = filters.months.includes(month)
      ? filters.months.filter(m => m !== month)
      : [...filters.months, month];
    onFiltersChange({ months: newMonths });
  };

  const handleRigToggle = (rig: string) => {
    const newRigs = filters.rigs.includes(rig)
      ? filters.rigs.filter(r => r !== rig)
      : [...filters.rigs, rig];
    onFiltersChange({ rigs: newRigs });
  };

  const handleSelectAllYears = () => {
    onFiltersChange({ years: availableYears });
  };

  const handleSelectAllMonths = () => {
    onFiltersChange({ months: MONTH_NAMES });
  };

  const handleSelectAllRigs = () => {
    onFiltersChange({ rigs: rigs.map(r => r.rig_code) });
  };

  const handleQuarterSelect = (quarter: string) => {
    const quarterMonths = {
      'q1': MONTH_NAMES.slice(0, 3),
      'q2': MONTH_NAMES.slice(3, 6),
      'q3': MONTH_NAMES.slice(6, 9),
      'q4': MONTH_NAMES.slice(9, 12),
    };
    onFiltersChange({ months: quarterMonths[quarter as keyof typeof quarterMonths] });
  };

  const handleRevenueRangeCommit = () => {
    onFiltersChange({
      revenueRange: {
        min: revenueRange[0] === minRevenue ? null : revenueRange[0],
        max: revenueRange[1] === maxRevenue ? null : revenueRange[1],
      },
    });
  };

  const savePreset = () => {
    const presetName = prompt('Enter a name for this filter preset:');
    if (presetName) {
      try {
        const savedPresets = JSON.parse(localStorage.getItem('revenue_filter_presets') || '{}');
        savedPresets[presetName] = filters;
        localStorage.setItem('revenue_filter_presets', JSON.stringify(savedPresets));
        toast.success(`Preset "${presetName}" saved`);
      } catch (error) {
        toast.error('Failed to save preset');
      }
    }
  };

  const loadPreset = (presetName: string) => {
    try {
      const savedPresets = JSON.parse(localStorage.getItem('revenue_filter_presets') || '{}');
      const preset = savedPresets[presetName];
      if (preset) {
        onFiltersChange(preset);
        toast.success(`Preset "${presetName}" loaded`);
      }
    } catch (error) {
      toast.error('Failed to load preset');
    }
  };

  const getSavedPresets = () => {
    try {
      return Object.keys(JSON.parse(localStorage.getItem('revenue_filter_presets') || '{}'));
    } catch {
      return [];
    }
  };

  const savedPresets = getSavedPresets();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              Active
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Revenue Data</SheetTitle>
          <SheetDescription>
            Apply filters to analyze specific segments of revenue data
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Quick Filters */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Quick Filters</Label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_FILTERS.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onApplyQuickFilter(filter.id)}
                    className="justify-start gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Year Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Year</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllYears}
                disabled={filters.years.length === availableYears.length}
              >
                Select All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableYears.map((year) => (
                <div key={year} className="flex items-center space-x-2">
                  <Checkbox
                    id={`year-${year}`}
                    checked={filters.years.includes(year)}
                    onCheckedChange={() => handleYearToggle(year)}
                  />
                  <Label
                    htmlFor={`year-${year}`}
                    className="text-sm cursor-pointer"
                  >
                    {year}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Month Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Month</Label>
              <div className="flex gap-1">
                <Select onValueChange={handleQuarterSelect}>
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue placeholder="Q" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q1">Q1</SelectItem>
                    <SelectItem value="q2">Q2</SelectItem>
                    <SelectItem value="q3">Q3</SelectItem>
                    <SelectItem value="q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllMonths}
                  disabled={filters.months.length === MONTH_NAMES.length}
                >
                  All
                </Button>
              </div>
            </div>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {MONTH_NAMES.map((month) => (
                  <div key={month} className="flex items-center space-x-2">
                    <Checkbox
                      id={`month-${month}`}
                      checked={filters.months.includes(month)}
                      onCheckedChange={() => handleMonthToggle(month)}
                    />
                    <Label
                      htmlFor={`month-${month}`}
                      className="text-sm cursor-pointer"
                    >
                      {month}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Rig Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Rig</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllRigs}
                disabled={filters.rigs.length === rigs.length || isLoading}
              >
                Select All
              </Button>
            </div>
            <ScrollArea className="h-40">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading rigs...</p>
              ) : (
                <div className="space-y-2">
                  {rigs.map((rig) => (
                    <div key={rig.rig_code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rig-${rig.rig_code}`}
                        checked={filters.rigs.includes(rig.rig_code)}
                        onCheckedChange={() => handleRigToggle(rig.rig_code)}
                      />
                      <Label
                        htmlFor={`rig-${rig.rig_code}`}
                        className="text-sm cursor-pointer"
                      >
                        {rig.rig_name} ({rig.rig_code})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator />

          {/* Revenue Range */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Revenue Range
            </Label>
            <div className="space-y-4">
              <Slider
                min={minRevenue}
                max={maxRevenue}
                step={(maxRevenue - minRevenue) / 100}
                value={revenueRange}
                onValueChange={(value) => setRevenueRange(value as [number, number])}
                onValueCommit={handleRevenueRangeCommit}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${(revenueRange[0] / 1000000).toFixed(2)}M</span>
                <span>${(revenueRange[1] / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Variance Type Filter */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Variance Filter
            </Label>
            <RadioGroup
              value={filters.varianceType}
              onValueChange={(value) =>
                onFiltersChange({ varianceType: value as RevenueFilters['varianceType'] })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="variance-all" />
                <Label htmlFor="variance-all" className="text-sm cursor-pointer">
                  All
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="positive" id="variance-positive" />
                <Label htmlFor="variance-positive" className="text-sm cursor-pointer">
                  Positive Variance (Over Budget)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="negative" id="variance-negative" />
                <Label htmlFor="variance-negative" className="text-sm cursor-pointer">
                  Negative Variance (Under Budget)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="within5" id="variance-within5" />
                <Label htmlFor="variance-within5" className="text-sm cursor-pointer">
                  Within ±5%
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="within10" id="variance-within10" />
                <Label htmlFor="variance-within10" className="text-sm cursor-pointer">
                  Within ±10%
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Saved Presets
              </Label>
              <div className="space-y-2">
                {savedPresets.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => loadPreset(preset)}
                    className="w-full justify-start"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={savePreset}
            className="flex-1 gap-2"
            disabled={!hasActiveFilters}
          >
            <Save className="w-4 h-4" />
            Save Preset
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            className="flex-1 gap-2"
            disabled={!hasActiveFilters}
          >
            <X className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
