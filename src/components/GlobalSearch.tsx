import { useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search, FileText, Settings, TrendingUp, BarChart } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Badge } from '@/components/ui/badge';

export const GlobalSearch = () => {
  const { query, setQuery, results, isOpen, setIsOpen, selectResult } = useGlobalSearch();

  // Listen for global search event from voice commands
  useEffect(() => {
    const handleGlobalSearch = (e: CustomEvent) => {
      setIsOpen(true);
      if (e.detail?.query) {
        setQuery(e.detail.query);
      }
    };

    window.addEventListener('global-search' as any, handleGlobalSearch);
    return () => window.removeEventListener('global-search' as any, handleGlobalSearch);
  }, [setIsOpen, setQuery]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'page': return <FileText className="h-4 w-4" />;
      case 'rig': return <Settings className="h-4 w-4" />;
      case 'report': return <BarChart className="h-4 w-4" />;
      case 'action': return <TrendingUp className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'page': return 'Page';
      case 'rig': return 'Rig';
      case 'report': return 'Report';
      case 'action': return 'Action';
      default: return 'Result';
    }
  };

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput 
        placeholder="Search pages, rigs, reports... (Ctrl+P)" 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedResults).map(([category, items], idx) => (
          <div key={category}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={getCategoryLabel(category)}>
              {items.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => selectResult(result)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(result.category)}
                    <div>
                      <div className="font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {getCategoryLabel(result.category)}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
        
        {results.length === 0 && query && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>No results found for "{query}"</p>
            <p className="text-xs mt-2">Try searching for pages, rigs, or reports</p>
          </div>
        )}
      </CommandList>
      
      <div className="border-t p-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> to navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd> to select</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> to close</span>
        </div>
      </div>
    </CommandDialog>
  );
};
