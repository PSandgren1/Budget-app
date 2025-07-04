import React from 'react';
import { useTheme, type AccentColor } from '../hooks/useTheme';
import type { Translation } from '../translations';

interface ThemeSettingsProps {
  t: Translation;
  isOpen: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ t, isOpen, onClose }) => {
  const { config, setTheme, setAccentColor, setCompactMode, getThemeClasses } = useTheme();
  const theme = getThemeClasses();

  const accentColors: { color: AccentColor; name: string; preview: string }[] = [
    { color: 'yellow', name: t.yellow, preview: 'bg-yellow-500' },
    { color: 'blue', name: t.blue, preview: 'bg-blue-500' },
    { color: 'green', name: t.green, preview: 'bg-green-500' },
    { color: 'purple', name: t.purple, preview: 'bg-purple-500' },
    { color: 'red', name: t.red, preview: 'bg-red-500' },
    { color: 'orange', name: t.orange, preview: 'bg-orange-500' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${theme.bg.secondary} rounded-lg shadow-xl max-w-md w-full p-6 ${theme.text.primary}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{t.themeSettings}</h2>
          <button
            onClick={onClose}
            className={`${theme.text.tertiary} hover:${theme.text.primary} text-2xl touch-manipulation`}
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Toggle */}
          <div>
            <label className={`block text-sm font-medium ${theme.text.secondary} mb-3`}>
              {t.theme}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 p-3 rounded-lg border-2 transition touch-manipulation ${
                  config.theme === 'dark'
                    ? `accent-primary-border accent-primary-bg text-gray-900`
                    : `${theme.border.primary} ${theme.bg.tertiary} ${theme.text.secondary} hover:${theme.bg.quaternary}`
                }`}
              >
                🌙 {t.darkTheme}
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 p-3 rounded-lg border-2 transition touch-manipulation ${
                  config.theme === 'light'
                    ? `accent-primary-border accent-primary-bg text-gray-900`
                    : `${theme.border.primary} ${theme.bg.tertiary} ${theme.text.secondary} hover:${theme.bg.quaternary}`
                }`}
              >
                ☀️ {t.lightTheme}
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 p-3 rounded-lg border-2 transition touch-manipulation ${
                  config.theme === 'system'
                    ? `accent-primary-border accent-primary-bg text-gray-900`
                    : `${theme.border.primary} ${theme.bg.tertiary} ${theme.text.secondary} hover:${theme.bg.quaternary}`
                }`}
              >
                💻 {t.systemTheme}
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className={`block text-sm font-medium ${theme.text.secondary} mb-3`}>
              {t.accentColor}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {accentColors.map(({ color, name, preview }) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={`p-3 rounded-lg border-2 transition touch-manipulation flex flex-col items-center gap-2 ${
                    config.accentColor === color
                      ? `accent-primary-border ${theme.bg.quaternary}`
                      : `${theme.border.primary} ${theme.bg.tertiary} hover:${theme.bg.quaternary}`
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${preview}`}></div>
                  <span className={`text-xs ${theme.text.secondary}`}>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div>
            <label className={`block text-sm font-medium ${theme.text.secondary} mb-3`}>
              Layout
            </label>
            <div className="flex items-center justify-between">
              <div>
                <span className={`${theme.text.primary} font-medium`}>{t.compactMode}</span>
                <p className={`text-sm ${theme.text.tertiary}`}>
                  {t.compactModeDescription}
                </p>
              </div>
              <button
                onClick={() => setCompactMode(!config.compactMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  config.compactMode ? 'accent-primary-bg' : `${theme.bg.quaternary}`
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    config.compactMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`accent-primary-bg hover:accent-hover text-gray-900 font-semibold py-2 px-4 rounded-lg transition touch-manipulation`}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
