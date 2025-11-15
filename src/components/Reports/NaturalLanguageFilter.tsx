import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic, MicOff, Sparkles, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQueryAnalytics } from '@/hooks/useQueryAnalytics';
import { QueryHistory } from './QueryHistory';
import { QueryBuilder } from './QueryBuilder';
import { FilterTutorial } from './FilterTutorial';
import { QuerySuggestions } from './QuerySuggestions';
import { VisualQueryExplanation } from './VisualQueryExplanation';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

interface NaturalLanguageFilterProps {
  reportType: string;
  availableFields: string[];
  onFilterApply: (filterConfig: any) => void;
  onClose?: () => void;
}

interface FilterConfig {
  dateRange?: { start: string; end: string };
  conditions?: Array<{ field: string; operator: string; value: any }>;
  sortBy?: { field: string; direction: string };
  limit?: number;
  summary?: string;
}

const getExampleQueries = (reportType: string) => {
  const baseExamples = [
    "show last month high performers",
    "rigs over budget this quarter",
    "top 10 by revenue",
  ];

  const specificExamples: Record<string, string[]> = {
    utilization: ["rigs with utilization over 80%", "idle rigs last week"],
    revenue: ["top revenue generators this year", "variance over 10%"],
    billing_npt: ["billable NPT this month", "non-billable repairs"],
    fuel: ["high fuel consumers", "fuel cost trending up"],
  };

  return [...baseExamples, ...(specificExamples[reportType] || [])];
};

export const NaturalLanguageFilter = ({
  reportType,
  availableFields,
  onFilterApply,
  onClose,
}: NaturalLanguageFilterProps) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastFilter, setLastFilter] = useState<FilterConfig | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const { history, addQuery, clearHistory } = useQueryHistory(reportType);
  const { trackQuery } = useQueryAnalytics(reportType);

  const handleSubmitQuery = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('parse-filter-query', {
        body: {
          query: queryText.trim(),
          reportType,
          availableFields
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const { filterConfig } = data;
      const processingTime = Date.now() - startTime;

      onFilterApply(filterConfig);
      setLastFilter(filterConfig);
      setQuery('');
      addQuery(queryText, true);
      trackQuery(queryText, true, processingTime);
      
      toast({
        title: "Filter applied",
        description: filterConfig.summary || "Your query has been applied successfully",
      });
    } catch (error) {
      console.error('Natural language filter error:', error);
      const processingTime = Date.now() - startTime;
      addQuery(queryText, false);
      trackQuery(queryText, false, processingTime);
      
      let errorMessage = "Failed to parse your query. Please try rephrasing.";
      let errorSuggestions: string[] = [];
      
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes("Payment required")) {
          errorMessage = "AI credits exhausted. Please add credits to continue.";
        } else if (error.message.includes("LOVABLE_API_KEY")) {
          errorMessage = "AI service not configured. Please contact support.";
        } else {
          errorSuggestions = [
            "Try being more specific with dates",
            "Use simpler language",
            "Check field names are correct"
          ];
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage + (errorSuggestions.length > 0 ? "\n\nTry:\n• " + errorSuggestions.join("\n• ") : ""),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Listening",
          description: "Speak your query now...",
        });
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start voice input",
          variant: "destructive"
        });
      }
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        
        // Auto-submit after transcription
        if (transcript.trim()) {
          await handleSubmitQuery(transcript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: event.error === 'no-speech' 
            ? "No speech detected. Please try again." 
            : "Failed to recognize speech. Please try again.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onClose,
    onVoiceStart: toggleVoiceInput,
    onHelp: () => setShowHelp(true),
  });

  // Generate suggestions based on input
  useEffect(() => {
    if (query.length > 2) {
      const historyMatches = history
        .filter(h => h.query.toLowerCase().includes(query.toLowerCase()) && h.successful)
        .map(h => h.query)
        .slice(0, 3);
      setSuggestions(historyMatches);
    } else {
      setSuggestions([]);
    }
  }, [query, history]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await handleSubmitQuery(query);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSubmitQuery(example);
  };

  return (
    <>
      <FilterTutorial reportType={reportType} />
      <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
      
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Ask AI
              </CardTitle>
              <CardDescription>
                Use natural language or voice to filter your data
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              title="Keyboard shortcuts (Press ?)"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Query</TabsTrigger>
              <TabsTrigger value="builder">Query Builder</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quick" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Show me rigs with high utilization last month"
                      disabled={isProcessing || isListening}
                      data-tour="nl-filter-input"
                    />
                    <QuerySuggestions
                      suggestions={suggestions}
                      onSelect={(suggestion) => {
                        setQuery(suggestion);
                        handleSubmitQuery(suggestion);
                      }}
                      inputValue={query}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleVoiceInput}
                    disabled={isProcessing}
                    data-tour="nl-filter-voice"
                    className={isListening ? "animate-pulse" : ""}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <div data-tour="nl-filter-history">
                    <QueryHistory
                      history={history}
                      onSelectQuery={(selectedQuery) => {
                        setQuery(selectedQuery);
                        handleSubmitQuery(selectedQuery);
                      }}
                      onClear={clearHistory}
                    />
                  </div>
                  <Button type="submit" disabled={!query.trim() || isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isListening ? "Listening..." : "Processing..."}
                      </>
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              </form>

              <div className="space-y-2" data-tour="nl-filter-examples">
                <p className="text-sm text-muted-foreground">Example queries:</p>
                <div className="flex flex-wrap gap-2">
                  {getExampleQueries(reportType).map((example, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="builder" data-tour="nl-filter-builder">
              <QueryBuilder
                reportType={reportType}
                onGenerateQuery={(generatedQuery) => {
                  setQuery(generatedQuery);
                  handleSubmitQuery(generatedQuery);
                }}
              />
            </TabsContent>
          </Tabs>

          {lastFilter && (
            <VisualQueryExplanation
              filterConfig={lastFilter}
              onClear={() => {
                setLastFilter(null);
                onFilterApply({});
                toast({
                  title: "Filter cleared",
                  description: "All filters have been removed",
                });
              }}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};
