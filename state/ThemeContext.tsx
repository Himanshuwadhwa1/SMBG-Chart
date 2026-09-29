import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getSettings, updateSettings } from '../db';
import { ThemeMode } from '../db/types';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  error: string;
  errorBg: string;
  success: string;
  successBg: string;
}

export const lightColors: ThemeColors = {
  background: '#f6f8fa',
  surface: '#ffffff',
  card: '#ffffff',
  cardBorder: '#d0d7de',
  text: '#1f2328',
  textSecondary: '#57606a',
  border: '#d0d7de',
  primary: '#0969da',
  primaryLight: '#ddf4ff',
  error: '#cf222e',
  errorBg: '#ffebe9',
  success: '#1a7f37',
  successBg: '#dafbe1',
};

export const darkColors: ThemeColors = {
  background: '#0d1117',
  surface: '#161b22',
  card: '#161b22',
  cardBorder: '#30363d',
  text: '#f0f6fc',
  textSecondary: '#8b949e',
  border: '#30363d',
  primary: '#2f81f7',
  primaryLight: '#388bfd26',
  error: '#f85149',
  errorBg: '#f8514926',
  success: '#3fb950',
  successBg: '#2ea04326',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: 'light' | 'dark';
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  activeTheme: 'light',
  colors: lightColors,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme();
  const systemScheme: 'light' | 'dark' = scheme === 'dark' ? 'dark' : 'light';
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');


  useEffect(() => {
    loadThemeSetting();
  }, []);

  const loadThemeSetting = async () => {
    try {
      const settings = await getSettings();
      setThemeModeState(settings.theme_mode || 'system');
    } catch (err) {
      console.error('Failed to load theme settings:', err);
    }
  };

  const handleSetThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await updateSettings({ theme_mode: mode });
    } catch (err) {
      console.error('Failed to persist theme setting:', err);
    }
  };

  const activeTheme = themeMode === 'system' ? systemScheme : themeMode;
  const colors = activeTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        colors,
        setThemeMode: handleSetThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
