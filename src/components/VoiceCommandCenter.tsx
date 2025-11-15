import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { cn } from '@/lib/utils';

interface VoiceCommandCenterProps {
  onClose?: () => void;
}

export const VoiceCommandCenter = ({ onClose }: VoiceCommandCenterProps) => {
  const { isListening, transcript, isProcessing, startRecording, stopRecording } = useVoiceCommands();

  const exampleCommands = [
    { command: "Go to revenue page", description: "Navigate to revenue analytics" },
    { command: "Show utilization data", description: "Open utilization report" },
    { command: "Find rig 205", description: "Search for specific rig" },
    { command: "Export to Excel", description: "Download data as spreadsheet" },
    { command: "Show last month data", description: "Apply time filter" },
    { command: "Go to dashboard", description: "Return to main dashboard" },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Command Center
            </CardTitle>
            <CardDescription>
              Control the application using your voice
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Control */}
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Button
            size="lg"
            variant={isListening ? "destructive" : "default"}
            onClick={isListening ? stopRecording : startRecording}
            disabled={isProcessing}
            className={cn(
              "h-24 w-24 rounded-full",
              isListening && "animate-pulse"
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </Button>
          
          <div className="text-center">
            <Badge variant={isListening ? "destructive" : "secondary"} className="mb-2">
              {isProcessing ? "Processing..." : isListening ? "Listening..." : "Ready"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {isListening 
                ? "Speak your command now" 
                : isProcessing 
                ? "Processing your command..." 
                : "Click the microphone to start"}
            </p>
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Last Command:</p>
            <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
          </div>
        )}

        {/* Example Commands */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Example Commands:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleCommands.map((example, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => {
                  // Could implement click-to-execute
                }}
              >
                <p className="text-sm font-medium">{example.command}</p>
                <p className="text-xs text-muted-foreground">{example.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Languages */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Supports: English, Arabic, and more
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
