import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Filter, X, Calendar, Building2, Settings, TrendingUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { UtilizationFilters } from "@/hooks/useUtilizationFilters";

interface UtilizationFilterPanelProps {
  filters: UtilizationFilters;
  onFilterChange: (filters: UtilizationFilters) => void;
  filterOptions: {
    years: string[];
    months: string[];
    clients: string[];
    rigs: string[];
    statusOptions: string[];
  };
  activeFilterCount: number;
  onClearFilters: () => void;
  onQuickFilter: (filterType: string) => void;
}

export const UtilizationFilterPanel = ({
  filters,
  onFilterChange,
  filterOptions,
  activeFilterCount,
  onClearFilters,
  onQuickFilter,
}: UtilizationFilterPanelProps) => {
  const [sectionsOpen, setSectionsOpen] = useState({
    quickFilters: true,
    date: true,
    rig: false,
    client: false,
    status: true,
    performance: true,
  });

  const quickFilters = [
    { id: 'current_year', label: 'Current Year', icon: Calendar },
    { id: 'active_only', label: 'Active Rigs', icon: TrendingUp },
    { id: 'low_utilization', label: 'Low Utilization (<50%)', icon: Filter },
    { id: 'high_performers', label: 'High Performers (>90%)', icon: TrendingUp },
    { id: 'stacked', label: 'Stacked Rigs', icon: Settings },
  ];

  const handleCheckboxChange = (category: keyof UtilizationFilters, value: string, checked: boolean) => {
    const currentValues = filters[category] as string[];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onFilterChange({ ...filters, [category]: newValues });
  };

  const handleSelectAll = (category: keyof UtilizationFilters, options: string[]) => {
    onFilterChange({ ...filters, [category]: options });
  };

  const handleClearCategory = (category: keyof UtilizationFilters) => {
    onFilterChange({ ...filters, [category]: [] });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Filters */}
        <Collapsible
          open={sectionsOpen.quickFilters}
          onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, quickFilters: open }))}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            Quick Filters
            <Badge variant="outline">{quickFilters.length}</Badge>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {quickFilters.map(filter => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onQuickFilter(filter.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </Button>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Year Filter */}
        <Collapsible
          open={sectionsOpen.date}
          onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, date: open }))}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            Year
            {filters.years.length > 0 && (
              <Badge variant="secondary">{filters.years.length}</Badge>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAll('years', filterOptions.years)}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearCategory('years')}
              >
                Clear
              </Button>
            </div>
            {filterOptions.years.map(year => (
              <div key={year} className="flex items-center space-x-2">
                <Checkbox
                  id={`year-${year}`}
                  checked={filters.years.includes(year)}
                  onCheckedChange={(checked) => handleCheckboxChange('years', year, checked as boolean)}
                />
                <label htmlFor={`year-${year}`} className="text-sm cursor-pointer">
                  {year}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Month Filter */}
        <Collapsible
          open={sectionsOpen.date}
          onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, date: open }))}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            Month
            {filters.months.length > 0 && (
              <Badge variant="secondary">{filters.months.length}</Badge>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAll('months', filterOptions.months)}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearCategory('months')}
              >
                Clear
              </Button>
            </div>
            {filterOptions.months.map(month => (
              <div key={month} className="flex items-center space-x-2">
                <Checkbox
                  id={`month-${month}`}
                  checked={filters.months.includes(month)}
                  onCheckedChange={(checked) => handleCheckboxChange('months', month, checked as boolean)}
                />
                <label htmlFor={`month-${month}`} className="text-sm cursor-pointer">
                  {month}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Client Filter */}
        <Collapsible
          open={sectionsOpen.client}
          onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, client: open }))}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Client
            </div>
            {filters.clients.length > 0 && (
              <Badge variant="secondary">{filters.clients.length}</Badge>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAll('clients', filterOptions.clients)}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearCategory('clients')}
              >
                Clear
              </Button>
            </div>
            {filterOptions.clients.map(client => (
              <div key={client} className="flex items-center space-x-2">
                <Checkbox
                  id={`client-${client}`}
                  checked={filters.clients.includes(client)}
                  onCheckedChange={(checked) => handleCheckboxChange('clients', client, checked as boolean)}
                />
                <label htmlFor={`client-${client}`} className="text-sm cursor-pointer">
                  {client}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Rig Filter */}
        <Collapsible
          open={sectionsOpen.rig}
          onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, rig: open }))}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            Rig
            {filters.rigs.length > 0 && (
              <Badge variant="secondary">{filters.rigs.length}</Badge>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAll('rigs', filterOptions.rigs)}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearCategory('rigs')}
              >
                Clear
              </Button>
            </div>
            {filterOptions.rigs.map(rig => (
              <div key={rig} className="flex items-center space-x-2">
                <Checkbox
                  id={`rig-${rig}`}
                  checked={filters.rigs.includes(rig)}
                  onCheckedChange={(checked) => handleCheckboxChange('rigs', rig, checked as boolean)}
                />
                <label htmlFor={`rig-${rig}`} className="text-sm cursor-pointer">
                  {rig}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Status Filter */}
        <Collapsible
          open={sectionsOpen.status}
          onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, status: open }))}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            Status
            {filters.status.length > 0 && (
              <Badge variant="secondary">{filters.status.length}</Badge>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {filterOptions.statusOptions.map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.status.includes(status)}
                  onCheckedChange={(checked) => handleCheckboxChange('status', status, checked as boolean)}
                />
                <label htmlFor={`status-${status}`} className="text-sm cursor-pointer flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {status}
                </label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Utilization Range */}
        <Collapsible
          open={sectionsOpen.performance}
          onOpenChange={(open) => setSectionsOpen(prev => ({ ...prev, performance: open }))}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
            Utilization Range
            {(filters.utilizationRange[0] > 0 || filters.utilizationRange[1] < 100) && (
              <Badge variant="secondary">
                {filters.utilizationRange[0]}-{filters.utilizationRange[1]}%
              </Badge>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="px-2">
              <Slider
                min={0}
                max={100}
                step={5}
                value={filters.utilizationRange}
                onValueChange={(value) => onFilterChange({ ...filters, utilizationRange: value as [number, number] })}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{filters.utilizationRange[0]}%</span>
                <span>{filters.utilizationRange[1]}%</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
