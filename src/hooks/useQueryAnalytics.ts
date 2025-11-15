import { useState, useEffect } from 'react';

interface QueryAnalytics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageProcessingTime: number;
  popularQueries: { query: string; count: number }[];
}

export const useQueryAnalytics = (reportType: string) => {
  const [analytics, setAnalytics] = useState<QueryAnalytics>({
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageProcessingTime: 0,
    popularQueries: []
  });

  useEffect(() => {
    const stored = localStorage.getItem(`query-analytics-${reportType}`);
    if (stored) {
      try {
        setAnalytics(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse analytics:', e);
      }
    }
  }, [reportType]);

  const trackQuery = (query: string, success: boolean, processingTime: number) => {
    const updated = {
      totalQueries: analytics.totalQueries + 1,
      successfulQueries: analytics.successfulQueries + (success ? 1 : 0),
      failedQueries: analytics.failedQueries + (success ? 0 : 1),
      averageProcessingTime: 
        (analytics.averageProcessingTime * analytics.totalQueries + processingTime) / 
        (analytics.totalQueries + 1),
      popularQueries: updatePopularQueries(analytics.popularQueries, query)
    };

    setAnalytics(updated);
    localStorage.setItem(`query-analytics-${reportType}`, JSON.stringify(updated));
  };

  const updatePopularQueries = (
    current: { query: string; count: number }[], 
    newQuery: string
  ) => {
    const existing = current.find(q => q.query === newQuery);
    if (existing) {
      existing.count++;
    } else {
      current.push({ query: newQuery, count: 1 });
    }
    return current.sort((a, b) => b.count - a.count).slice(0, 5);
  };

  return {
    analytics,
    trackQuery
  };
};
