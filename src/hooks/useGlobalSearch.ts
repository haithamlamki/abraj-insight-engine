import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: 'page' | 'rig' | 'report' | 'action';
  path: string;
  icon?: string;
  keywords?: string[];
}

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Define all searchable items
  const searchableItems: SearchResult[] = useMemo(() => [
    // Pages
    { id: 'dashboard', title: 'Dashboard', category: 'page', path: '/', keywords: ['home', 'main', 'overview'] },
    { id: 'revenue', title: 'Revenue', subtitle: 'Financial Analytics', category: 'page', path: '/rig-financials/revenue', keywords: ['money', 'income', 'earnings'] },
    { id: 'utilization', title: 'Utilization', subtitle: 'Rig Efficiency', category: 'page', path: '/rig-financials/utilization', keywords: ['usage', 'efficiency', 'operational'] },
    { id: 'billing-npt', title: 'Billing NPT', subtitle: 'Non-Productive Time', category: 'page', path: '/rig-financials/billing-npt', keywords: ['downtime', 'billable', 'repair'] },
    { id: 'npt-root', title: 'NPT Root Cause', subtitle: 'Analysis', category: 'page', path: '/rig-financials/npt-root-cause', keywords: ['root cause', 'analysis', 'failure'] },
    { id: 'fuel', title: 'Fuel Consumption', subtitle: 'Energy Analytics', category: 'page', path: '/rig-consumption/fuel', keywords: ['energy', 'consumption', 'diesel'] },
    { id: 'fuel-analytics', title: 'Fuel Analytics', subtitle: 'Detailed Analysis', category: 'page', path: '/rig-consumption/fuel-analytics', keywords: ['fuel analysis', 'consumption trends'] },
    { id: 'budget', title: 'Budget Management', subtitle: 'Financial Planning', category: 'page', path: '/admin/budget', keywords: ['budget', 'planning', 'forecast'] },
    { id: 'budget-analytics', title: 'Budget Analytics', subtitle: 'Budget Analysis', category: 'page', path: '/admin/budget-analytics', keywords: ['variance', 'forecast', 'performance'] },
    
    // Common rigs (example - would be dynamic in production)
    { id: 'rig-201', title: 'Rig 201', subtitle: 'View Details', category: 'rig', path: '/rig-financials/revenue?rig=201', keywords: ['201', 'rig 201'] },
    { id: 'rig-202', title: 'Rig 202', subtitle: 'View Details', category: 'rig', path: '/rig-financials/revenue?rig=202', keywords: ['202', 'rig 202'] },
    { id: 'rig-203', title: 'Rig 203', subtitle: 'View Details', category: 'rig', path: '/rig-financials/revenue?rig=203', keywords: ['203', 'rig 203'] },
    { id: 'rig-204', title: 'Rig 204', subtitle: 'View Details', category: 'rig', path: '/rig-financials/revenue?rig=204', keywords: ['204', 'rig 204'] },
    { id: 'rig-205', title: 'Rig 205', subtitle: 'View Details', category: 'rig', path: '/rig-financials/revenue?rig=205', keywords: ['205', 'rig 205'] },
    
    // Actions
    { id: 'export-excel', title: 'Export to Excel', category: 'action', path: '#export-excel', keywords: ['download', 'export', 'spreadsheet'] },
    { id: 'export-pdf', title: 'Export to PDF', category: 'action', path: '#export-pdf', keywords: ['download', 'export', 'document'] },
  ], []);

  // Filter results based on query
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return searchableItems.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const subtitleMatch = item.subtitle?.toLowerCase().includes(lowerQuery);
      const keywordsMatch = item.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery));
      
      return titleMatch || subtitleMatch || keywordsMatch;
    }).slice(0, 10); // Limit to 10 results
  }, [query, searchableItems]);

  // Keyboard shortcut: Ctrl+P or Cmd+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectResult = (result: SearchResult) => {
    if (result.path.startsWith('#')) {
      // Handle actions
      const action = result.path.replace('#', '');
      window.dispatchEvent(new CustomEvent('global-action', { detail: { action } }));
    } else {
      navigate(result.path);
    }
    
    setIsOpen(false);
    setQuery('');
  };

  return {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    selectResult
  };
};
