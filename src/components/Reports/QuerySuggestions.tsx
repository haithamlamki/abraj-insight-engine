import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Lightbulb } from "lucide-react";

interface QuerySuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  inputValue: string;
}

export const QuerySuggestions = ({ suggestions, onSelect, inputValue }: QuerySuggestionsProps) => {
  if (!inputValue || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50">
      <Command className="rounded-lg border shadow-md">
        <CommandList>
          <CommandEmpty>No suggestions found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            {suggestions.map((suggestion, index) => (
              <CommandItem
                key={index}
                onSelect={() => onSelect(suggestion)}
                className="cursor-pointer"
              >
                <Lightbulb className="mr-2 h-4 w-4 text-muted-foreground" />
                {suggestion}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
};
