import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, action } = await req.json();
    
    if (action === 'transcribe') {
      if (!audio) {
        throw new Error('No audio data provided');
      }

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      // Process audio in chunks
      const binaryAudio = processBase64Chunks(audio);
      
      // Prepare form data
      const formData = new FormData();
      const blob = new Blob([binaryAudio], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');

      // Send to AI Gateway for transcription
      const response = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw new Error(`Transcription error: ${await response.text()}`);
      }

      const result = await response.json();

      return new Response(
        JSON.stringify({ text: result.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'parse_command') {
      const { text } = await req.json();
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

      const systemPrompt = `You are a voice command parser for an oil & gas rig management system.
Parse voice commands and return structured actions.

Available commands:
- Navigation: "go to revenue", "open utilization page", "show fuel analytics"
- Search: "find rig 205", "search revenue data"
- Filters: "show last month data", "filter high performers"
- Export: "export to excel", "download pdf report"

Return JSON:
{
  "action": "navigate|search|filter|export|unknown",
  "target": "revenue|utilization|npt|fuel|dashboard|...",
  "parameters": {"key": "value"},
  "confidence": 0-100
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Parse this command: "${text}"` }
          ],
          tools: [{
            type: "function",
            function: {
              name: "parse_voice_command",
              description: "Parse voice command into structured action",
              parameters: {
                type: "object",
                properties: {
                  action: { 
                    type: "string", 
                    enum: ["navigate", "search", "filter", "export", "unknown"] 
                  },
                  target: { type: "string" },
                  parameters: { type: "object" },
                  confidence: { type: "number" }
                },
                required: ["action", "confidence"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "parse_voice_command" } }
        }),
      });

      if (!response.ok) {
        throw new Error('Command parsing failed');
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!toolCall) {
        throw new Error('No command parsed');
      }

      const command = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify(command), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Voice command error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
