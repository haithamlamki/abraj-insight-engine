import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { CommonError } from "@/hooks/useDataQualityStats";

interface CleaningSuggestion {
  issue: string;
  severity: 'high' | 'medium' | 'low';
  affectedReports: string[];
  errorCount: number;
  suggestion: string;
  steps: string[];
  exampleFix?: string;
}

interface DataCleaningSuggestionsProps {
  commonErrors: CommonError[];
}

const generateSuggestions = (errors: CommonError[]): CleaningSuggestion[] => {
  const suggestions: CleaningSuggestion[] = [];

  errors.forEach(error => {
    const msg = error.error_message.toLowerCase();
    
    // Missing required fields
    if (msg.includes('required') || msg.includes('missing')) {
      const field = msg.match(/field[:\s]+['"]?(\w+)['"]?/)?.[1] || 'field';
      suggestions.push({
        issue: `Missing ${field} in multiple records`,
        severity: 'high',
        affectedReports: error.report_types,
        errorCount: error.error_count,
        suggestion: `Ensure all records have a valid ${field} value before importing`,
        steps: [
          `Review your Excel template and locate the ${field} column`,
          `Fill in all empty cells in this column with valid values`,
          `If using formulas, ensure they evaluate to actual values`,
          `Remove any template or example rows that have placeholder text`
        ],
        exampleFix: field === 'rig_number' ? 'Use format: RIG-001, RIG-002, etc.' : undefined
      });
    }
    
    // Invalid year range
    if (msg.includes('year') && (msg.includes('invalid') || msg.includes('range'))) {
      suggestions.push({
        issue: 'Year values outside valid range',
        severity: 'medium',
        affectedReports: error.report_types,
        errorCount: error.error_count,
        suggestion: 'Use 4-digit years between 2000 and 2100',
        steps: [
          'Check year column for 2-digit years (e.g., 24 instead of 2024)',
          'Look for typos in year values (e.g., 20024 instead of 2024)',
          'Ensure year cells are formatted as numbers, not text',
          'Use Find & Replace to fix systematic errors'
        ],
        exampleFix: 'Correct: 2024, Incorrect: 24, 202, 20024'
      });
    }
    
    // Invalid month
    if (msg.includes('month') && msg.includes('invalid')) {
      suggestions.push({
        issue: 'Invalid month names or numbers',
        severity: 'medium',
        affectedReports: error.report_types,
        errorCount: error.error_count,
        suggestion: 'Use full English month names (January, February, etc.)',
        steps: [
          'Convert abbreviated months (Jan → January, Feb → February)',
          'Fix typos in month names',
          'Remove numeric month values (use month names instead)',
          'Ensure consistent capitalization'
        ],
        exampleFix: 'Correct: January, Incorrect: Jan, 01, jan'
      });
    }
    
    // Invalid hours
    if (msg.includes('hours') || msg.includes('hrs')) {
      suggestions.push({
        issue: 'Invalid hour values detected',
        severity: 'high',
        affectedReports: error.report_types,
        errorCount: error.error_count,
        suggestion: 'Hours must be positive numbers, max 24 per event',
        steps: [
          'Check for negative hour values',
          'Look for text entries in hours column',
          'Verify hours don\'t exceed 24 for single events',
          'Remove any formulas that evaluate to errors (#DIV/0!, #N/A)'
        ],
        exampleFix: 'Valid: 8.5, 12, 2.25 | Invalid: -5, "N/A", 30'
      });
    }
    
    // Date validation issues
    if (msg.includes('date') && msg.includes('invalid')) {
      suggestions.push({
        issue: 'Date formatting or validation issues',
        severity: 'medium',
        affectedReports: error.report_types,
        errorCount: error.error_count,
        suggestion: 'Ensure dates are valid and properly formatted',
        steps: [
          'Check for dates like February 30th (invalid)',
          'Ensure dates match the specified month and year',
          'Format cells as Date in Excel before copying',
          'Avoid using text-formatted dates'
        ],
        exampleFix: 'Valid: 2024-01-15 | Invalid: 2024-02-30, "15/01"'
      });
    }
    
    // Empty or null values in required fields
    if (msg.includes('empty') || msg.includes('null')) {
      suggestions.push({
        issue: 'Empty cells in required columns',
        severity: 'high',
        affectedReports: error.report_types,
        errorCount: error.error_count,
        suggestion: 'Fill all required fields before import',
        steps: [
          'Use Excel\'s "Go To Special > Blanks" to find empty cells',
          'Fill in missing values or remove incomplete rows',
          'Check for hidden spaces or invisible characters',
          'Ensure formulas are calculating correctly'
        ]
      });
    }
  });

  // Sort by severity and error count
  return suggestions.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.errorCount - a.errorCount;
  });
};

export default function DataCleaningSuggestions({ commonErrors }: DataCleaningSuggestionsProps) {
  const suggestions = generateSuggestions(commonErrors);

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Data Quality Excellent
          </CardTitle>
          <CardDescription>
            No recurring validation issues detected. Keep up the good work!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Automated Data Cleaning Suggestions
        </CardTitle>
        <CardDescription>
          Based on {commonErrors.length} common validation error{commonErrors.length !== 1 ? 's' : ''}, here are actionable suggestions to improve data quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <Alert key={index} variant={suggestion.severity === 'high' ? 'destructive' : 'default'}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                suggestion.severity === 'high' ? 'text-red-500' : 
                suggestion.severity === 'medium' ? 'text-orange-500' : 
                'text-yellow-500'
              }`} />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">{suggestion.issue}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Found in {suggestion.affectedReports.join(', ')} ({suggestion.errorCount} occurrence{suggestion.errorCount !== 1 ? 's' : ''})
                    </p>
                  </div>
                  <Badge variant={
                    suggestion.severity === 'high' ? 'destructive' : 
                    suggestion.severity === 'medium' ? 'default' : 
                    'outline'
                  }>
                    {suggestion.severity}
                  </Badge>
                </div>
                
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">{suggestion.suggestion}</p>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">How to fix:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        {suggestion.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="flex-1">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    
                    {suggestion.exampleFix && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <p className="text-xs font-mono">{suggestion.exampleFix}</p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
