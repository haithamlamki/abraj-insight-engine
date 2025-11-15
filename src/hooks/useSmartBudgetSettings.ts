import { useState, useEffect } from "react";

interface SmartBudgetSettings {
  varianceThreshold: number;
  budgetGrowth: number;
  autoApprove: boolean;
  enabledReports: string[];
}

const STORAGE_KEY = 'smart-budget-settings';

const DEFAULT_SETTINGS: SmartBudgetSettings = {
  varianceThreshold: 10,
  budgetGrowth: 5,
  autoApprove: false,
  enabledReports: ['revenue', 'utilization', 'billing_npt', 'fuel', 'work_orders'],
};

export function useSmartBudgetSettings() {
  const [settings, setSettings] = useState<SmartBudgetSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored settings:', e);
      }
    }
  }, []);

  const updateSettings = (partial: Partial<SmartBudgetSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
