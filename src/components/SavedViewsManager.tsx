import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Star, Trash2, Download } from 'lucide-react';
import { useSavedViews, SavedView } from '@/hooks/useSavedViews';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SavedViewsManagerProps {
  pageName: string;
  currentFilters: any;
  currentSort?: any;
  onLoadView: (view: SavedView) => void;
}

export const SavedViewsManager = ({
  pageName,
  currentFilters,
  currentSort,
  onLoadView
}: SavedViewsManagerProps) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const { toast } = useToast();
  
  const {
    views,
    currentView,
    saveView,
    loadView,
    deleteView,
    toggleFavorite,
    clearCurrentView,
    getFavorites
  } = useSavedViews(pageName);

  const handleSaveView = () => {
    if (!viewName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this view",
        variant: "destructive"
      });
      return;
    }

    const newView = saveView(viewName, currentFilters, currentSort, viewDescription);
    
    toast({
      title: "View Saved",
      description: `"${viewName}" has been saved successfully`,
    });

    setShowSaveDialog(false);
    setViewName('');
    setViewDescription('');
  };

  const handleLoadView = (viewId: string) => {
    const view = loadView(viewId);
    if (view) {
      onLoadView(view);
      toast({
        title: "View Loaded",
        description: `"${view.name}" has been applied`,
      });
    }
  };

  const handleDeleteView = (viewId: string, viewName: string) => {
    deleteView(viewId);
    toast({
      title: "View Deleted",
      description: `"${viewName}" has been removed`,
    });
  };

  const favorites = getFavorites();

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Save Current View */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
        >
          <Bookmark className="h-4 w-4 mr-2" />
          Save View
        </Button>

        {/* Load Saved Views */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Load View
              {views.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {views.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {favorites.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Favorites
                </DropdownMenuLabel>
                {favorites.map((view) => (
                  <ViewMenuItem
                    key={view.id}
                    view={view}
                    isActive={currentView?.id === view.id}
                    onLoad={handleLoadView}
                    onDelete={handleDeleteView}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {views.filter(v => !v.isFavorite).length > 0 ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  All Views
                </DropdownMenuLabel>
                {views.filter(v => !v.isFavorite).map((view) => (
                  <ViewMenuItem
                    key={view.id}
                    view={view}
                    isActive={currentView?.id === view.id}
                    onLoad={handleLoadView}
                    onDelete={handleDeleteView}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </>
            ) : views.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No saved views yet
              </div>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Current View */}
        {currentView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCurrentView}
          >
            Clear View
          </Button>
        )}
      </div>

      {/* Save View Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save your current filters and settings for quick access later
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">View Name *</Label>
              <Input
                id="view-name"
                placeholder="e.g., High Revenue Rigs"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="view-description">Description (optional)</Label>
              <Textarea
                id="view-description"
                placeholder="Describe what this view shows..."
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView}>
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper component for menu items
const ViewMenuItem = ({
  view,
  isActive,
  onLoad,
  onDelete,
  onToggleFavorite
}: {
  view: SavedView;
  isActive: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
}) => (
  <DropdownMenuItem
    className="flex items-start justify-between cursor-pointer p-3"
    onSelect={(e) => {
      e.preventDefault();
      onLoad(view.id);
    }}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium text-sm truncate">{view.name}</p>
        {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
      </div>
      {view.description && (
        <p className="text-xs text-muted-foreground truncate mt-1">
          {view.description}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(view.createdAt, { addSuffix: true })}
      </p>
    </div>
    
    <div className="flex items-center gap-1 ml-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(view.id);
        }}
      >
        <Star
          className={`h-3 w-3 ${view.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(view.id, view.name);
        }}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  </DropdownMenuItem>
);
