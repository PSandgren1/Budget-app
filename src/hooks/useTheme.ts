import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type AccentColor = 'yellow' | 'blue' | 'green' | 'purple' | 'red' | 'orange';

interface ThemeConfig {
  theme: Theme;
  accentColor: AccentColor;
  compactMode: boolean;
}

const defaultTheme: ThemeConfig = {
  theme: 'system',
  accentColor: 'yellow',
  compactMode: false,
};

// Helper function to get system theme
const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // fallback
};

// Helper function to resolve actual theme
const resolveTheme = (theme: Theme): 'dark' | 'light' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const useTheme = () => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('budget-theme-config');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (config.theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Force a re-render by updating a dummy state to trigger theme class updates
        setConfig(prev => ({ ...prev }));
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [config.theme]);

  useEffect(() => {
    localStorage.setItem('budget-theme-config', JSON.stringify(config));
    
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.remove('accent-yellow', 'accent-blue', 'accent-green', 'accent-purple', 'accent-red', 'accent-orange');
    root.classList.remove('compact-mode');
    
    // Add current theme classes
    const resolvedTheme = resolveTheme(config.theme);
    root.classList.add(`theme-${resolvedTheme}`);
    root.classList.add(`accent-${config.accentColor}`);
    if (config.compactMode) {
      root.classList.add('compact-mode');
    }
  }, [config]);

  const setTheme = (theme: Theme) => {
    setConfig(prev => ({ ...prev, theme }));
  };

  const setAccentColor = (accentColor: AccentColor) => {
    setConfig(prev => ({ ...prev, accentColor }));
  };

  const setCompactMode = (compactMode: boolean) => {
    setConfig(prev => ({ ...prev, compactMode }));
  };

  const toggleTheme = () => {
    setTheme(config.theme === 'dark' ? 'light' : 'dark');
  };

  // Get CSS classes for current theme
  const getThemeClasses = () => {
    const resolvedTheme = resolveTheme(config.theme);
    return {
      // Background colors
      bg: {
        primary: resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
        secondary: resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white',
        tertiary: resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100',
        quaternary: resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200',
      },
      // Text colors
      text: {
        primary: resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900',
        secondary: resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600',
        tertiary: resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500',
        muted: resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400',
      },
      // Border colors
      border: {
        primary: resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-300',
        secondary: resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200',
      },
      // Accent colors (dynamic based on selection)
      accent: {
        primary: `accent-${config.accentColor}-primary`,
        secondary: `accent-${config.accentColor}-secondary`,
        text: `accent-${config.accentColor}-text`,
        border: `accent-${config.accentColor}-border`,
        hover: `accent-${config.accentColor}-hover`,
      },
      // Status colors
      status: {
        success: resolvedTheme === 'dark' ? 'text-green-400' : 'text-green-600',
        successBg: resolvedTheme === 'dark' ? 'bg-green-700' : 'bg-green-100',
        error: resolvedTheme === 'dark' ? 'text-red-400' : 'text-red-600',
        errorBg: resolvedTheme === 'dark' ? 'bg-red-700' : 'bg-red-100',
        warning: resolvedTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
        warningBg: resolvedTheme === 'dark' ? 'bg-yellow-700' : 'bg-yellow-100',
        info: resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600',
        infoBg: resolvedTheme === 'dark' ? 'bg-blue-700' : 'bg-blue-100',
      },
      // Spacing
      spacing: {
        section: config.compactMode ? 'space-y-4' : 'space-y-6',
        padding: config.compactMode ? 'p-3 sm:p-4' : 'p-3 sm:p-6',
        paddingSmall: config.compactMode ? 'p-2' : 'p-3',
        margin: config.compactMode ? 'mb-3 sm:mb-4' : 'mb-4 sm:mb-6',
        gap: config.compactMode ? 'gap-3 sm:gap-4' : 'gap-4 sm:gap-6',
      },
    };
  };

  return {
    config,
    setTheme,
    setAccentColor,
    setCompactMode,
    toggleTheme,
    getThemeClasses,
  };
};
