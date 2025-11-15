import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Send, X, Lightbulb, Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NaturalLanguageFilterProps {
  reportType: string;
  availableFields: string[];
  onFilterApply: (filterConfig: any) => void;
  onClose?: () => void;
}

const exampleQueries = [
  "show last month high performers",
  "rigs over budget this quarter",
  "top 10 by revenue",
  "billable NPT this year",
  "low utilization rigs",
  "active rigs last 30 days"
];

export const NaturalLanguageFilter = ({ 
  reportType, 
  availableFields, 
  onFilterApply,
  onClose 
}: NaturalLanguageFilterProps) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastFilter, setLastFilter] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
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
  }, [toast]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a filter query",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-filter-query', {
        body: {
          query: query.trim(),
          reportType,
          availableFields
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const { filterConfig } = data;
      
      // Apply the parsed filters
      onFilterApply(filterConfig);
      
      setLastFilter(filterConfig.summary || query);
      setQuery('');
      
      toast({
        title: "Filter applied",
        description: filterConfig.summary || "Your natural language filter has been applied",
      });

    } catch (error) {
      console.error('Natural language filter error:', error);
      
      let errorMessage = "Failed to parse your query. Please try rephrasing.";
      
      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes("Payment required")) {
          errorMessage = "AI credits exhausted. Please add credits to continue.";
        } else if (error.message.includes("LOVABLE_API_KEY")) {
          errorMessage = "AI service not configured. Please contact support.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.",
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
          title: "Listening...",
          description: "Speak your filter query now",
        });
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start voice input. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Natural Language Filters</h3>
              <p className="text-xs text-muted-foreground">
                Ask in plain English, get instant filters
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {lastFilter && (
          <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-primary">Active: </span>
                <span className="text-foreground">{lastFilter}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., show last month high performers..."
              disabled={isProcessing || isListening}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isProcessing}
              size="sm"
              variant={isListening ? "default" : "outline"}
              className={isListening ? "animate-pulse" : ""}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button 
            type="submit" 
            disabled={isProcessing || !query.trim() || isListening}
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Apply
              </>
            )}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Try these examples:
          </p>
          <div className="flex flex-wrap gap-1">
            {exampleQueries.map((example, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors text-xs"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
