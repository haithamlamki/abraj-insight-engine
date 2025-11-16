import { useState, useEffect } from "react";

interface FieldVisibilitySettings {
  [reportType: string]: {
    [fieldKey: string]: boolean;
  };
}

const STORAGE_KEY = 'header-mapping-field-visibility';

export function useHeaderMappingSettings() {
  const [settings, setSettings] = useState<FieldVisibilitySettings>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse header mapping settings:', e);
      }
    }
  }, []);

  const isFieldVisible = (reportType: string, fieldKey: string): boolean => {
    // Default to true (visible) if not set
    return settings[reportType]?.[fieldKey] ?? true;
  };

  const toggleFieldVisibility = (reportType: string, fieldKey: string) => {
    const updated = {
      ...settings,
      [reportType]: {
        ...settings[reportType],
        [fieldKey]: !isFieldVisible(reportType, fieldKey),
      },
    };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const resetSettings = (reportType?: string) => {
    if (reportType) {
      const updated = { ...settings };
      delete updated[reportType];
      setSettings(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else {
      setSettings({});
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    isFieldVisible,
    toggleFieldVisibility,
    resetSettings,
  };
}
