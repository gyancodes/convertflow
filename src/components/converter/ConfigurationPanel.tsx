import React, { useState, useCallback } from 'react';
import { VectorizationConfig } from '../../types/converter';

interface ConfigurationPanelProps {
  /** Current configuration settings */
  config: VectorizationConfig;
  /** Callback when configuration changes */
  onChange: (config: VectorizationConfig) => void;
  /** Whether the panel is disabled during processing */
  disabled?: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const [localConfig, setLocalConfig] = useState<VectorizationConfig>(config);

  const handleConfigChange = useCallback((updates: Partial<VectorizationConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  }, [localConfig, onChange]);

  const handleColorCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(2, Math.min(256, parseInt(e.target.value) || 2));
    handleConfigChange({ colorCount: value });
  }, [handleConfigChange]);

  const handleSmoothingChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleConfigChange({ smoothingLevel: e.target.value as 'low' | 'medium' | 'high' });
  }, [handleConfigChange]);

  const handlePathSimplificationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.1, Math.min(10.0, parseFloat(e.target.value) || 0.1));
    handleConfigChange({ pathSimplification: value });
  }, [handleConfigChange]);

  const handleAlgorithmChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleConfigChange({ algorithm: e.target.value as 'auto' | 'shapes' | 'photo' | 'lineart' });
  }, [handleConfigChange]);

  const handleTransparencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleConfigChange({ preserveTransparency: e.target.checked });
  }, [handleConfigChange]);

  return (
    <div className="configuration-panel bg-white rounded-lg shadow-md p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Vectorization Settings</h3>
      
      {/* Color Count Control */}
      <div className="space-y-2">
        <label htmlFor="colorCount" className="block text-sm font-medium text-gray-700">
          Color Count: {localConfig.colorCount}
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="colorCount"
            type="range"
            min="2"
            max="256"
            value={localConfig.colorCount}
            onChange={handleColorCountChange}
            disabled={disabled}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <input
            type="number"
            min="2"
            max="256"
            value={localConfig.colorCount}
            onChange={handleColorCountChange}
            disabled={disabled}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <p className="text-xs text-gray-500">
          Reduce colors to simplify the output (2-256 colors)
        </p>
      </div>

      {/* Smoothing Level Control */}
      <div className="space-y-2">
        <label htmlFor="smoothingLevel" className="block text-sm font-medium text-gray-700">
          Smoothing Level
        </label>
        <select
          id="smoothingLevel"
          value={localConfig.smoothingLevel}
          onChange={handleSmoothingChange}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="low">Low - Preserve sharp edges</option>
          <option value="medium">Medium - Balanced smoothing</option>
          <option value="high">High - Maximum smoothing</option>
        </select>
        <p className="text-xs text-gray-500">
          Controls how much the paths are smoothed
        </p>
      </div>

      {/* Path Simplification Control */}
      <div className="space-y-2">
        <label htmlFor="pathSimplification" className="block text-sm font-medium text-gray-700">
          Path Simplification: {localConfig.pathSimplification.toFixed(1)}
        </label>
        <div className="flex items-center space-x-4">
          <input
            id="pathSimplification"
            type="range"
            min="0.1"
            max="10.0"
            step="0.1"
            value={localConfig.pathSimplification}
            onChange={handlePathSimplificationChange}
            disabled={disabled}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <input
            type="number"
            min="0.1"
            max="10.0"
            step="0.1"
            value={localConfig.pathSimplification}
            onChange={handlePathSimplificationChange}
            disabled={disabled}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <p className="text-xs text-gray-500">
          Higher values create simpler paths with fewer points
        </p>
      </div>

      {/* Algorithm Selection */}
      <div className="space-y-2">
        <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700">
          Processing Algorithm
        </label>
        <select
          id="algorithm"
          value={localConfig.algorithm}
          onChange={handleAlgorithmChange}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="auto">Auto - Detect best algorithm</option>
          <option value="shapes">Shapes - For logos and simple graphics</option>
          <option value="photo">Photo - For photographs and complex images</option>
          <option value="lineart">Line Art - For drawings and sketches</option>
        </select>
        <p className="text-xs text-gray-500">
          Choose the algorithm that best matches your image type
        </p>
      </div>

      {/* Transparency Preservation */}
      <div className="flex items-center space-x-3">
        <input
          id="preserveTransparency"
          type="checkbox"
          checked={localConfig.preserveTransparency}
          onChange={handleTransparencyChange}
          disabled={disabled}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
        />
        <label htmlFor="preserveTransparency" className="text-sm font-medium text-gray-700">
          Preserve Transparency
        </label>
      </div>
      <p className="text-xs text-gray-500 ml-7">
        Maintain alpha channel information in the output SVG
      </p>
    </div>
  );
};

export default ConfigurationPanel;