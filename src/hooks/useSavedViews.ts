import { useState, useEffect } from 'react';

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  page: string;
  filters: any;
  sortConfig?: any;
  createdAt: number;
  isFavorite?: boolean;
}

export const useSavedViews = (pageName: string) => {
  const [views, setViews] = useState<SavedView[]>([]);
  const [currentView, setCurrentView] = useState<SavedView | null>(null);

  // Load saved views from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`saved-views-${pageName}`);
    if (stored) {
      try {
        setViews(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved views:', e);
      }
    }
  }, [pageName]);

  const saveView = (name: string, filters: any, sortConfig?: any, description?: string) => {
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name,
      description,
      page: pageName,
      filters,
      sortConfig,
      createdAt: Date.now(),
      isFavorite: false
    };

    const updated = [...views, newView];
    setViews(updated);
    localStorage.setItem(`saved-views-${pageName}`, JSON.stringify(updated));
    
    return newView;
  };

  const loadView = (viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setCurrentView(view);
      return view;
    }
    return null;
  };

  const deleteView = (viewId: string) => {
    const updated = views.filter(v => v.id !== viewId);
    setViews(updated);
    localStorage.setItem(`saved-views-${pageName}`, JSON.stringify(updated));
    
    if (currentView?.id === viewId) {
      setCurrentView(null);
    }
  };

  const updateView = (viewId: string, updates: Partial<SavedView>) => {
    const updated = views.map(v => 
      v.id === viewId ? { ...v, ...updates } : v
    );
    setViews(updated);
    localStorage.setItem(`saved-views-${pageName}`, JSON.stringify(updated));
  };

  const toggleFavorite = (viewId: string) => {
    updateView(viewId, { 
      isFavorite: !views.find(v => v.id === viewId)?.isFavorite 
    });
  };

  const clearCurrentView = () => {
    setCurrentView(null);
  };

  const getFavorites = () => views.filter(v => v.isFavorite);

  return {
    views,
    currentView,
    saveView,
    loadView,
    deleteView,
    updateView,
    toggleFavorite,
    clearCurrentView,
    getFavorites
  };
};
