import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      
      toast({
        title: "Listening...",
        description: "Speak your command now",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Step 1: Transcribe audio
        const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
          'voice-command',
          {
            body: { audio: base64Audio, action: 'transcribe' }
          }
        );

        if (transcribeError) throw transcribeError;
        if (!transcribeData?.text) throw new Error('No transcription received');

        const transcribedText = transcribeData.text;
        setTranscript(transcribedText);

        // Step 2: Parse command
        const { data: commandData, error: commandError } = await supabase.functions.invoke(
          'voice-command',
          {
            body: { text: transcribedText, action: 'parse_command' }
          }
        );

        if (commandError) throw commandError;

        // Execute command
        executeCommand(commandData);
      };
    } catch (error) {
      console.error('Voice command error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process voice command",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCommand = (command: any) => {
    const { action, target, parameters, confidence } = command;

    if (confidence < 60) {
      toast({
        title: "Low Confidence",
        description: `I'm not sure I understood: "${transcript}"`,
        variant: "destructive"
      });
      return;
    }

    switch (action) {
      case 'navigate':
        const routes: Record<string, string> = {
          'revenue': '/rig-financials/revenue',
          'utilization': '/rig-financials/utilization',
          'npt': '/rig-financials/billing-npt',
          'fuel': '/rig-consumption/fuel',
          'dashboard': '/',
          'budget': '/admin/budget'
        };
        
        const route = routes[target?.toLowerCase()] || '/';
        navigate(route);
        
        toast({
          title: "Navigating",
          description: `Going to ${target || 'dashboard'}`,
        });
        break;

      case 'search':
        window.dispatchEvent(new CustomEvent('global-search', { 
          detail: { query: parameters?.query || target } 
        }));
        toast({
          title: "Searching",
          description: `Looking for: ${parameters?.query || target}`,
        });
        break;

      case 'filter':
        window.dispatchEvent(new CustomEvent('apply-voice-filter', { 
          detail: parameters 
        }));
        toast({
          title: "Filter Applied",
          description: transcript,
        });
        break;

      case 'export':
        window.dispatchEvent(new CustomEvent('export-data', { 
          detail: { format: target || 'excel' } 
        }));
        toast({
          title: "Exporting",
          description: `Preparing ${target || 'Excel'} export`,
        });
        break;

      default:
        toast({
          title: "Command Not Recognized",
          description: "Try: 'go to revenue' or 'search rig 205'",
          variant: "destructive"
        });
    }
  };

  return {
    isListening,
    transcript,
    isProcessing,
    startRecording,
    stopRecording
  };
};
