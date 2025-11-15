import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface QueryHistoryProps {
  history: Array<{
    query: string;
    timestamp: number;
    successful: boolean;
  }>;
  onSelectQuery: (query: string) => void;
  onClear: () => void;
}

export const QueryHistory = ({ history, onSelectQuery, onClear }: QueryHistoryProps) => {
  if (history.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Clock className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Query History</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {history.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onSelectQuery(item.query)}
            className="flex flex-col items-start cursor-pointer"
          >
            <span className="font-medium truncate w-full">{item.query}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              {item.successful && " • ✓"}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
