import { useEffect, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";

interface FilterTutorialProps {
  reportType: string;
}

export const FilterTutorial = ({ reportType }: FilterTutorialProps) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(`filter-tutorial-${reportType}`);
    if (!hasSeenTutorial) {
      setTimeout(() => setRun(true), 500);
    }
  }, [reportType]);

  const steps: Step[] = [
    {
      target: '[data-tour="nl-filter-input"]',
      content: "Type your query in plain English. For example: 'Show me last month's high performers'",
      placement: "bottom",
    },
    {
      target: '[data-tour="nl-filter-voice"]',
      content: "Or use voice input! Click the microphone and speak your query. It will auto-submit when you finish speaking.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nl-filter-history"]',
      content: "Access your recent queries here to quickly reuse them.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nl-filter-examples"]',
      content: "Not sure what to ask? Click any example to get started!",
      placement: "top",
    },
    {
      target: '[data-tour="nl-filter-builder"]',
      content: "Prefer a form? Use the Query Builder to construct queries step-by-step.",
      placement: "top",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(`filter-tutorial-${reportType}`, "true");
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
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          arrowColor: "hsl(var(--background))",
        },
      }}
    />
  );
};
