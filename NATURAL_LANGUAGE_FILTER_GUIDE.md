# Natural Language Filter Guide

## Overview

The Natural Language Filter feature allows users to interact with data tables using plain English queries instead of manually configuring complex filter conditions. Powered by AI, it understands context and converts natural language into precise filter configurations.

## Features

### 1. **Plain English Queries**
Simply type what you want to see:
- "show last month high performers"
- "rigs over budget this quarter"
- "top 10 revenue generators"
- "billable NPT events this year"
- "low utilization rigs"

### 2. **Intelligent Parsing**
The AI understands:
- **Time expressions**: "last month", "Q1", "this year", "last 7 days", "YTD"
- **Performance indicators**: "high performers", "low utilization", "over budget"
- **Comparisons**: "top 10", "bottom 5", ">85%", "<$500K"
- **Status filters**: "active", "billable", "operating"
- **Sorting**: "best", "worst", "highest", "lowest"

### 3. **Context-Aware**
The filter adapts to the report type you're viewing:
- **Utilization Reports**: Understands utilization rates, operating days, status
- **Revenue Reports**: Knows about revenue, budgets, variance, dayrates
- **Billing NPT**: Recognizes NPT hours, billable status, systems
- **Fuel Consumption**: Understands consumption metrics, stock levels
- And more...

## How to Use

### Accessing the Feature

1. Navigate to any data table
2. Look for the **"Ask AI"** button (sparkle icon ✨)
3. Click to reveal the natural language input field

### Writing Queries

**Basic Pattern:**
```
[action] [time period] [criteria]
```

**Examples:**

#### Time-Based Queries
- "show last month data"
- "Q1 2025 results"
- "year to date performance"
- "last 7 days activity"

#### Performance Queries
- "high performers" (automatically applies >85% threshold)
- "low utilization rigs" (<50% threshold)
- "rigs exceeding budget"
- "top 10 by revenue"

#### Combined Queries
- "show last month high performers"
- "Q2 rigs over budget"
- "active rigs this year above 90% utilization"
- "billable NPT events last quarter"

#### Specific Criteria
- "rigs with >85% utilization"
- "revenue above $500,000"
- "NPT hours more than 24"
- "closing balance under 1000L"

### Using Example Queries

Click any of the suggested example queries to instantly populate the input field and see how queries are structured.

### Applied Filters Display

When a natural language filter is applied:
1. A summary appears showing what was applied
2. The data table updates immediately
3. The filter appears as a badge below the search bar
4. You can remove it by clicking the X on the badge

## Query Tips

### Do's ✅
- Be specific about time periods
- Use common terms like "high", "low", "top", "bottom"
- Combine multiple criteria naturally
- Use approximate values - AI will understand

### Don'ts ❌
- Don't use overly complex sentences
- Avoid ambiguous terms
- Don't mix different report contexts

### Examples by Report Type

#### Utilization Reports
```
"active rigs last month"
"high utilization above 85%"
"rigs with low operating days"
"top 5 performers this quarter"
```

#### Revenue Reports
```
"over budget rigs this year"
"top 10 revenue generators"
"negative variance last quarter"
"revenue above $500K"
```

#### Billing NPT Reports
```
"billable NPT this month"
"high NPT hours over 24"
"equipment failures last quarter"
"non-billable events this year"
```

#### Fuel Consumption
```
"high consumption rigs"
"low fuel stock"
"consumption above 10000L"
"rigs with closing balance below 1000L"
```

## Technical Details

### AI Processing
- Uses Google Gemini 2.5 Flash model
- Processes queries through Lovable AI Gateway
- Converts natural language to structured filters
- Returns human-readable summaries

### Filter Types Generated

The AI can create:
1. **Date Range Filters**: For time-based queries
2. **Condition Filters**: For value comparisons (>, <, =, etc.)
3. **Sort Orders**: For ranking queries (top/bottom N)
4. **Combined Filters**: Multiple conditions applied together

### Field Mapping

The AI automatically maps natural language to available database fields:
- "high performers" → utilization_rate > 85
- "over budget" → variance > 0
- "last month" → date range calculation
- "top 10" → sort + limit

## Error Handling

### Common Issues

**"Rate limit exceeded"**
- Wait a moment and try again
- The system has temporary rate limits

**"Payment required"**
- AI credits exhausted
- Add credits in Settings → Workspace → Usage

**"Failed to parse query"**
- Try rephrasing your query
- Use simpler terms
- Check example queries for guidance

### Best Practices

1. **Start Simple**: Begin with basic queries and add complexity
2. **Use Examples**: Learn from the provided example queries
3. **Combine Features**: Use with other filters for precise results
4. **Save Views**: Save frequently used natural language filters as views

## Limitations

- Cannot handle extremely complex multi-step logic
- Limited to fields available in the report
- Requires active internet connection
- Subject to AI service rate limits

## Future Enhancements

- Query history and favorites
- Multi-language support
- Voice input
- Query suggestions based on data
- Custom query templates
- Team-shared queries

## Privacy & Security

- Queries are processed through Lovable AI Gateway
- No sensitive data is stored
- Only field names and operators are sent to AI
- Full data remains in your database

## Support

For issues or questions:
- Check example queries for guidance
- Review error messages for specific issues
- Contact support if problems persist
- Report bugs through standard channels

## Quick Reference

| Query Type | Example | Result |
|------------|---------|--------|
| Time Range | "last month" | Sets date filter to previous month |
| Performance | "high performers" | Filters utilization > 85% |
| Top N | "top 10 by revenue" | Sorts and limits to top 10 |
| Comparison | "above $500K" | Filters revenue_actual > 500000 |
| Status | "active rigs" | Filters status = Operating |
| Combined | "last quarter over budget" | Date range + variance filter |

---

**Pro Tip**: Natural language filters work great with saved views. Apply your AI filter, then save the view for quick access later!
