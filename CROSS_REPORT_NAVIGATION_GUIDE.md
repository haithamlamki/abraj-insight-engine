# Cross-Report Smart Navigation Guide

## Overview
The Cross-Report Smart Navigation system allows users to seamlessly navigate between related reports while automatically carrying over relevant filters. This creates a cohesive analysis experience across different data views.

## Key Features

### 1. **Automatic Filter Transfer**
When navigating between reports, the system intelligently transfers only relevant filters:
- **Common filters**: Rig, Date Range, Year, Month, Client
- **Report-specific filters**: Only transferred if applicable to target report
- **Smart mapping**: Filters are adapted based on target report requirements

### 2. **Related Reports Panel**
Shows contextually relevant reports with:
- **Relationship reason**: Why the reports are related
- **Quick navigation**: One-click navigation with filters
- **Visual indicators**: Shows when filters will be applied

### 3. **Quick Navigation Bar**
Compact navigation for quick jumps:
- Shows first 3 related reports as buttons
- "More" dropdown for additional reports
- Filter count indicator

## Implementation

### For Developers

#### 1. Wrap App with Provider
```tsx
import { CrossReportFilterProvider } from '@/contexts/CrossReportFilterContext';

<CrossReportFilterProvider>
  <YourApp />
</CrossReportFilterProvider>
```

#### 2. Use in Report Pages
```tsx
import { useReportFilters } from '@/hooks/useReportFilters';
import { RelatedReportsPanel } from '@/components/RelatedReportsPanel';
import { QuickNavigationBar } from '@/components/QuickNavigationBar';

function MyReportPage() {
  const { filters, updateFilters } = useReportFilters('revenue');
  
  // Use filters in your queries
  const { data } = useQuery({
    queryKey: ['revenue', filters],
    queryFn: () => fetchRevenue(filters)
  });

  return (
    <div>
      {/* Quick navigation at top */}
      <QuickNavigationBar 
        currentReport="revenue" 
        currentFilters={filters} 
      />
      
      {/* Your report content */}
      <YourReportContent />
      
      {/* Related reports at bottom */}
      <RelatedReportsPanel 
        currentReport="revenue"
        currentFilters={filters}
        variant="full"
      />
    </div>
  );
}
```

#### 3. Programmatic Navigation
```tsx
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

function MyComponent() {
  const { navigateToReport } = useSmartNavigation();
  
  const handleClick = () => {
    navigateToReport('utilization', {
      rig: 'RIG-205',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });
  };
}
```

## Report Relationships

### Revenue Report
**Related to:**
- **Utilization**: Revenue is directly impacted by utilization rates
- **Billing NPT**: NPT affects revenue and day rates  
- **Budget Analytics**: Track revenue vs budget variance

### Utilization Report
**Related to:**
- **Revenue**: Utilization drives revenue generation
- **NPT Root Cause**: NPT reduces utilization rates
- **Fuel Consumption**: Operating rigs consume fuel

### Billing NPT Report
**Related to:**
- **NPT Root Cause**: Understand root causes of NPT
- **Revenue**: NPT directly affects revenue
- **Utilization**: NPT reduces utilization

### NPT Root Cause Report
**Related to:**
- **Billing NPT**: See billable vs non-billable NPT
- **Utilization**: NPT causes reduce utilization

### Fuel Reports
**Related to:**
- **Fuel Analytics**: Advanced fuel analytics and trends
- **Utilization**: Fuel consumption correlates with utilization
- **Revenue**: Fuel is a major operational cost

## Filter Mapping

### Common Filters (Apply to all reports)
- `rig` / `rigs` - Rig identifier(s)
- `client` - Client name
- `year` - Year filter
- `month` - Month filter
- `startDate` / `endDate` - Date range
- `dateRange` - Date range object

### Report-Specific Filters
```typescript
{
  revenue: ['rig', 'rigs', 'client', 'year', 'month', 'dateRange'],
  utilization: [...common, 'status'],
  billing_npt: [...common, 'billable', 'npt_type'],
  npt_root_cause: [...common, 'system', 'npt_type'],
  fuel: [...common],
  budget: ['rig', 'rigs', 'year', 'month']
}
```

## User Experience

### Navigation Flow
1. User applies filters on Revenue page (Rig: 205, Date: Q1 2024)
2. Clicks "Utilization" in Related Reports panel
3. Navigates to Utilization page
4. Rig and Date filters are automatically applied
5. Toast notification confirms filter transfer

### Visual Indicators
- **Badge**: Shows number of active filters
- **Tooltip**: Explains filter transfer on hover
- **Toast**: Confirms navigation and filter count
- **Info box**: Explains smart filter transfer

## Best Practices

### For Report Pages
1. Always use `useReportFilters()` hook to read filters
2. Update filters when user makes changes
3. Include `RelatedReportsPanel` at bottom of page
4. Add `QuickNavigationBar` for quick access

### For Custom Reports
```tsx
// Register your report relationships
const customRelationships = {
  my_custom_report: [
    {
      id: 'revenue',
      name: 'Revenue',
      path: '/rig-financials/revenue',
      description: 'See revenue data',
      relationReason: 'Custom report affects revenue'
    }
  ]
};
```

## API Reference

### `useCrossReportFilters()`
```tsx
const {
  filters,              // Current cross-report filters
  setFilters,           // Set all filters
  updateFilters,        // Update specific filters
  clearFilters,         // Clear all filters
  getRelevantFilters    // Get filters for target report
} = useCrossReportFilters();
```

### `useSmartNavigation()`
```tsx
const {
  navigateToReport,     // Navigate with filters
  getRelatedReports     // Get related reports list
} = useSmartNavigation();
```

### `useReportFilters(reportType)`
```tsx
const {
  filters,              // Filters relevant to this report
  allFilters,           // All cross-report filters
  updateFilters         // Update filters
} = useReportFilters('revenue');
```

## Examples

### Example 1: Revenue → Utilization
**Scenario**: User viewing high revenue rigs wants to check their utilization

**Filters Carried**:
- ✅ Rig: "RIG-205"
- ✅ Date Range: Q1 2024
- ✅ Client: "ABC Corp"
- ❌ Revenue-specific filters (not applicable)

### Example 2: NPT Root Cause → Billing NPT
**Scenario**: User analyzing failures wants to see billing impact

**Filters Carried**:
- ✅ Rig: "RIG-205"
- ✅ Date Range: January 2024
- ✅ NPT Type: "Equipment Failure"
- ✅ System: "Hoisting"
- ❌ Root cause details (converted to appropriate format)

## Troubleshooting

### Filters Not Transferring
1. Check that `CrossReportFilterProvider` wraps your app
2. Verify `useReportFilters()` is called in target page
3. Check filter names match expected format

### Navigation Not Working
1. Ensure using `useSmartNavigation()` hook
2. Check report ID matches registered relationships
3. Verify paths are correct

### Performance Issues
1. Filters are stored in React Context (efficient)
2. Only relevant filters are transferred (reduced payload)
3. URL params only include transferred filters

## Future Enhancements
- [ ] Filter transformation rules
- [ ] Custom relationship definitions via UI
- [ ] Filter history/undo
- [ ] Breadcrumb navigation trail
- [ ] Filter presets/templates
