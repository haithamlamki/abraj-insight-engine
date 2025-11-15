import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface DataTableTourProps {
  reportType: string;
  run: boolean;
  setRun: (run: boolean) => void;
}

export const DataTableTour = ({ reportType, run, setRun }: DataTableTourProps) => {

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`data-table-tour-${reportType}`);
    if (!hasSeenTour) {
      // Delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reportType, setRun]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Welcome to the Data Table! 📊</h3>
          <p>Let's take a quick tour of the powerful features available to you.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '[data-tour="search-input"]',
      content: 'Use the search bar to quickly find specific records across all columns.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="filter-button"]',
      content: 'Apply advanced filters to narrow down your data by specific criteria.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="export-button"]',
      content: 'Export your filtered data to Excel or PDF format.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="table-header"]',
      content: 'Click any column header to sort the data. Click again to reverse the order.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="data-entry-tabs"]',
      content: (
        <div>
          <h4 className="font-semibold mb-2">Data Entry Options</h4>
          <p>Switch between viewing data, manual entry, and uploading Excel files.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="manual-entry-tab"]',
      content: 'Add individual records one at a time using the manual entry form.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="upload-tab"]',
      content: 'Bulk upload data by importing Excel files or pasting from spreadsheets.',
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`data-table-tour-${reportType}`, 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: 'hsl(var(--background))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '8px',
          fontSize: '14px',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '6px',
          color: 'hsl(var(--primary-foreground))',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
    />
  );
};
