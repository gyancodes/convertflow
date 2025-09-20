import React from 'react';
import { ConfigurationPanel } from './ConfigurationPanel';
import { useVectorizationConfig } from '../../hooks/useVectorizationConfig';

/**
 * Demo component showing how to use ConfigurationPanel with useVectorizationConfig hook
 * This is for demonstration purposes and can be removed in production
 */
export const ConfigurationDemo: React.FC = () => {
  const { config, updateConfig, resetConfig, isValid, errors } = useVectorizationConfig();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Configuration Panel Demo
        </h2>
        <p className="text-gray-600">
          Interactive demo of the PNG to SVG converter configuration panel
        </p>
      </div>

      <ConfigurationPanel
        config={config}
        onChange={updateConfig}
        disabled={false}
      />

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Current Configuration</h3>
          <button
            onClick={resetConfig}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Color Count:</span>
            <span className="ml-2 text-gray-600">{config.colorCount}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Smoothing:</span>
            <span className="ml-2 text-gray-600 capitalize">{config.smoothingLevel}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Path Simplification:</span>
            <span className="ml-2 text-gray-600">{config.pathSimplification.toFixed(1)}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Algorithm:</span>
            <span className="ml-2 text-gray-600 capitalize">{config.algorithm}</span>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium text-gray-700">Preserve Transparency:</span>
            <span className="ml-2 text-gray-600">{config.preserveTransparency ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Validation Status:</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              isValid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isValid ? 'Valid' : 'Invalid'}
            </span>
          </div>
          {errors.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-red-700">Errors:</span>
              <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationDemo;