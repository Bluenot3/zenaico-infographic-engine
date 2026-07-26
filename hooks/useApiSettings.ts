
import { useState, useEffect, useCallback } from 'react';
import type { ApiSettings } from '../types';

const STORAGE_KEY = 'zen-api-settings';

export const useApiSettings = () => {
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    provider: 'openai',
    openaiApiKey: '',
    googleApiKey: '',
    imageModel: 'gpt-image-2',
    textModel: 'gpt-4o',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setApiSettings({
          provider: parsed.provider || 'openai',
          openaiApiKey: parsed.openaiApiKey || '',
          googleApiKey: parsed.googleApiKey || '',
          imageModel: parsed.imageModel || 'gpt-image-2',
          textModel: parsed.textModel || 'gpt-4o',
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
        provider: newSettings.provider || 'openai',
        openaiApiKey: newSettings.openaiApiKey || '',
        googleApiKey: newSettings.googleApiKey || '',
        imageModel: newSettings.imageModel || 'gpt-image-2',
        textModel: newSettings.textModel || 'gpt-4o',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
      setApiSettings(settingsToSave);
    } catch (error) {
      console.error('Failed to save API settings to localStorage:', error);
    }
  }, []);

  return { apiSettings, saveApiSettings, isLoaded };
};
