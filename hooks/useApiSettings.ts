
import { useState, useEffect, useCallback } from 'react';
import type { ApiSettings } from '../types';

const STORAGE_KEY = 'zen-api-settings';

export const useApiSettings = () => {
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    provider: 'google',
    openaiApiKey: '',
    googleApiKey: '',
    imageModel: 'gemini-3-pro-image',
    textModel: 'gemini-3.1-pro-preview',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setApiSettings({
          provider: parsed.provider || 'google',
          openaiApiKey: parsed.openaiApiKey || '',
          googleApiKey: parsed.googleApiKey || '',
          imageModel: parsed.imageModel || 'gemini-3-pro-image',
          textModel: parsed.textModel || 'gemini-3.1-pro-preview',
        });
      }
    } catch (error) {
      console.error('Failed to parse API settings from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  const saveApiSettings = useCallback((newSettings: ApiSettings) => {
    try {
      const settingsToSave: ApiSettings = {
        provider: newSettings.provider || 'google',
        openaiApiKey: newSettings.openaiApiKey || '',
        googleApiKey: newSettings.googleApiKey || '',
        imageModel: newSettings.imageModel || 'gemini-3-pro-image',
        textModel: newSettings.textModel || 'gemini-3.1-pro-preview',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
      setApiSettings(settingsToSave);
    } catch (error) {
      console.error('Failed to save API settings to localStorage:', error);
    }
  }, []);

  return { apiSettings, saveApiSettings, isLoaded };
};
