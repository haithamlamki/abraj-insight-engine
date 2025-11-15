import { useState, useEffect } from 'react';

interface QueryHistoryItem {
  query: string;
  timestamp: number;
  reportType: string;
  successful: boolean;
}

export const useQueryHistory = (reportType: string) => {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(`query-history-${reportType}`);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse query history:', e);
      }
    }
  }, [reportType]);

  const addQuery = (query: string, successful: boolean) => {
    const newItem: QueryHistoryItem = {
      query,
      timestamp: Date.now(),
      reportType,
      successful
    };

    const updated = [newItem, ...history.filter(h => h.query !== query)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(`query-history-${reportType}`, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`query-history-${reportType}`);
  };

  const getSuccessfulQueries = () => history.filter(h => h.successful);

  return {
    history,
    addQuery,
    clearHistory,
    getSuccessfulQueries
  };
};
