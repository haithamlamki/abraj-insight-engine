import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, X, Save, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'is_empty' | 'is_not_empty';
  value: string;
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

interface Column {
  key: string;
  label: string;
}

interface AdvancedFilterBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  filters: FilterGroup[];
  onFiltersChange: (filters: FilterGroup[]) => void;
  templates?: Record<string, FilterGroup[]>;
  onSaveTemplate?: (name: string, filters: FilterGroup[]) => void;
  onLoadTemplate?: (name: string) => void;
  onDeleteTemplate?: (name: string) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_equal', label: 'Greater or Equal' },
  { value: 'less_equal', label: 'Less or Equal' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

export const AdvancedFilterBuilder = ({
  open,
  onOpenChange,
  columns,
  filters,
  onFiltersChange,
  templates = {},
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}: AdvancedFilterBuilderProps) => {
  const [localFilters, setLocalFilters] = useState<FilterGroup[]>(filters);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const addFilterGroup = () => {
    const newGroup: FilterGroup = {
      id: Date.now().toString(),
      logic: 'AND',
      conditions: [{
        id: `${Date.now()}-0`,
        field: columns[0]?.key || '',
        operator: 'equals',
        value: '',
      }],
    };
    setLocalFilters([...localFilters, newGroup]);
  };

  const removeFilterGroup = (groupId: string) => {
    setLocalFilters(localFilters.filter(g => g.id !== groupId));
  };

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setLocalFilters(localFilters.map(g => 
      g.id === groupId ? { ...g, logic } : g
    ));
  };

  const addCondition = (groupId: string) => {
    setLocalFilters(localFilters.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          conditions: [
            ...g.conditions,
            {
              id: `${Date.now()}-${g.conditions.length}`,
              field: columns[0]?.key || '',
              operator: 'equals',
              value: '',
            },
          ],
        };
      }
      return g;
    }));
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setLocalFilters(localFilters.map(g => {
      if (g.id === groupId) {
        const newConditions = g.conditions.filter(c => c.id !== conditionId);
        return { ...g, conditions: newConditions };
      }
      return g;
    }));
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    field: keyof FilterCondition,
    value: any
  ) => {
    setLocalFilters(localFilters.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          conditions: g.conditions.map(c => 
            c.id === conditionId ? { ...c, [field]: value } : c
          ),
        };
      }
      return g;
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setLocalFilters([]);
    onFiltersChange([]);
    onOpenChange(false);
  };

  const needsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  const handleSaveTemplate = () => {
    if (templateName.trim() && onSaveTemplate) {
      onSaveTemplate(templateName.trim(), localFilters);
      setTemplateName("");
      setShowSaveTemplate(false);
    }
  };

  const handleLoadTemplate = (name: string) => {
    if (onLoadTemplate) {
      onLoadTemplate(name);
      const template = templates[name];
      if (template) {
        setLocalFilters(template);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Advanced Filters</DialogTitle>
              <DialogDescription>
                Build complex filter conditions with multiple criteria
              </DialogDescription>
            </div>
            {onSaveTemplate && onLoadTemplate && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={localFilters.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={Object.keys(templates).length === 0}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Load Template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {Object.keys(templates).map((name) => (
                      <div key={name} className="flex items-center justify-between px-2 py-1.5 hover:bg-accent">
                        <button
                          onClick={() => handleLoadTemplate(name)}
                          className="flex-1 text-left text-sm"
                        >
                          {name}
                        </button>
                        {onDeleteTemplate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTemplate(name);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {localFilters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No filters added yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFilterGroup}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter Group
                </Button>
              </div>
            ) : (
              localFilters.map((group, groupIdx) => (
                <div key={group.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Filter Group {groupIdx + 1}</Label>
                      <Select
                        value={group.logic}
                        onValueChange={(value: 'AND' | 'OR') => updateGroupLogic(group.id, value)}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilterGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {group.conditions.map((condition, condIdx) => (
                      <div key={condition.id} className="flex items-center gap-2">
                        {condIdx > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {group.logic}
                          </Badge>
                        )}
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(group.id, condition.id, 'field', value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map((col) => (
                              <SelectItem key={col.key} value={col.key}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value: any) => updateCondition(group.id, condition.id, 'operator', value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {needsValue(condition.operator) && (
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(group.id, condition.id, 'value', e.target.value)}
                            placeholder="Enter value..."
                            className="flex-1"
                          />
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(group.id, condition.id)}
                          disabled={group.conditions.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCondition(group.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              ))
            )}

            {localFilters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addFilterGroup}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Filter Group
              </Button>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Clear All
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Save Template Dialog */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Template</DialogTitle>
            <DialogDescription>
              Give your filter template a name to save it for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., High Priority Issues"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTemplate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSaveTemplate(false);
              setTemplateName("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
