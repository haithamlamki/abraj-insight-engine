# Smart Filters System

## Overview

The Smart Filters system provides intelligent, context-aware quick filters across all data tables in the application. These filters are automatically tailored to the type of data being displayed and provide one-click access to common filtering scenarios.

## Features

### 1. **Time-Based Filters**
Available on all reports:
- **Last 7 Days**: Show data from the past week
- **This Month**: Current month data
- **Last Month**: Previous month data
- **This Quarter**: Current quarter data (Q1-Q4)
- **Year to Date (YTD)**: From January 1st to today

### 2. **Performance Filters**
Report-specific filters based on performance metrics:

#### Utilization Reports
- **High Utilization**: Rigs with >85% utilization rate
- **Low Utilization**: Rigs with <50% utilization rate

#### Billing NPT Reports
- **High NPT**: NPT hours exceeding 24 hours
- **Billable NPT**: Only billable downtime events

#### Fuel Consumption Reports
- **High Consumption**: Total consumption >10,000L
- **Low Stock**: Closing balance <1,000L

### 3. **Financial Filters**
Available on financial reports:

#### Revenue Reports
- **High Revenue**: Revenue exceeding $500K
- **Under Budget**: Revenue below budget targets

#### Billing NPT Reports
- **Billable NPT**: Filter for billable events only

### 4. **Status Filters**
Equipment and operational status:
- **Active Rigs**: Currently operational rigs
- **Low Stock**: Items below threshold levels

## How to Use

### Accessing Smart Filters

1. Navigate to any data table in the system
2. Look for the **"Smart Filters"** button (with sparkle icon ✨)
3. Click to open the smart filter panel

### Applying Filters

1. **Browse by Category**: Filter suggestions are organized by:
   - Time-based
   - Status
   - Performance
   - Financial
   - Custom

2. **View All**: Click "All" to see every available smart filter

3. **One-Click Application**: Simply click any filter card to apply it immediately

4. **Active Filter Display**: Applied smart filters appear as badges below the search bar

5. **Remove Filters**: Click the X on any filter badge to remove it

6. **Clear All**: Use the "Clear All" button to remove all active filters at once

## Technical Integration

### For Developers

The Smart Filter system is integrated into the `DataTableWithDB` component and can be customized per report type.

#### Adding New Smart Filters

Edit `src/components/Reports/SmartFilterPanel.tsx`:

```typescript
// Add to the smartFilters array based on reportType
if (reportType === 'your_report_type') {
  baseFilters.push({
    id: 'unique-id',
    label: 'Filter Name',
    description: 'What this filter does',
    icon: YourLucideIcon,
    category: 'time' | 'status' | 'performance' | 'financial' | 'custom',
    apply: () => {
      onFilterApply({
        type: 'dateRange' | 'advanced',
        // Your filter configuration
      });
    }
  });
}
```

#### Filter Types

**Date Range Filter:**
```typescript
{
  type: 'dateRange',
  startDate: new Date(),
  endDate: new Date(),
  label: 'Display Name'
}
```

**Advanced Condition Filter:**
```typescript
{
  type: 'advanced',
  conditions: [
    { 
      field: 'column_name', 
      operator: '>' | '<' | '=' | '!=' | 'contains',
      value: any
    }
  ],
  label: 'Display Name'
}
```

## Benefits

1. **Faster Data Analysis**: One-click access to common filters
2. **Context-Aware**: Filters adapt to the type of data being viewed
3. **User-Friendly**: No need to remember complex filter syntax
4. **Consistent Experience**: Same interface across all data tables
5. **Time-Saving**: Eliminates repetitive filter creation

## Best Practices

1. **Combine with Search**: Use smart filters together with the search bar for precise results
2. **Stack Filters**: Apply multiple smart filters to narrow down data
3. **Save Views**: After applying smart filters, save your view for quick access later
4. **Clear Regularly**: Remove unused filters to keep your view clean

## Future Enhancements

- AI-powered filter suggestions based on usage patterns
- Custom user-defined smart filters
- Filter templates that can be shared across teams
- Historical filter usage analytics
- Natural language filter creation

## Support

For issues or feature requests related to smart filters, please contact the development team or submit a ticket through the standard support channels.
