import { useState, useCallback } from 'react';

export const useDataTableTour = (reportType: string) => {
  const [run, setRun] = useState(false);

  const startTour = useCallback(() => {
    setRun(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(`data-table-tour-${reportType}`);
    setRun(true);
  }, [reportType]);

  return {
    run,
    setRun,
    startTour,
    resetTour,
  };
};
