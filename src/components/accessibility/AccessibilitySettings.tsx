import React from 'react';
import { useAccessibilityContext } from '../../contexts/accessibility-hooks';
import type { AccessibilitySettings as AccessibilitySettingsType } from '../../contexts/accessibility-context';

export const AccessibilitySettings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useAccessibilityContext();

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md" role="region" aria-labelledby="accessibility-settings-title">
      <h2 id="accessibility-settings-title" className="text-xl font-bold text-gray-900">
        Accessibility Settings
      </h2>

      {/* Motion Preferences */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900">Motion Preferences</legend>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.prefersReducedMotion}
            onChange={(e) => updateSettings({ prefersReducedMotion: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Reduce animations and motion</span>
        </label>
      </fieldset>

      {/* Visual Preferences */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900">Visual Preferences</legend>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.isHighContrast}
            onChange={(e) => updateSettings({ isHighContrast: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">High contrast mode</span>
        </label>

        <div className="space-y-2">
          <label htmlFor="font-size" className="text-sm font-medium text-gray-700">
            Font Size
          </label>
          <select
            id="font-size"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: e.target.value as AccessibilitySettingsType['fontSize'] })}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>
      </fieldset>

      {/* Focus Preferences */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900">Focus and Navigation</legend>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.showFocusIndicators}
            onChange={(e) => updateSettings({ showFocusIndicators: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show focus indicators</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.announcePageChanges}
            onChange={(e) => updateSettings({ announcePageChanges: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Announce page changes</span>
        </label>
      </fieldset>

      {/* System Preferences */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-900">System Integration</legend>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.respectSystemPreferences}
            onChange={(e) => updateSettings({ respectSystemPreferences: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Follow system accessibility preferences</span>
        </label>
      </fieldset>

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={resetSettings}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};