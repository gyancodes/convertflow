import React from 'react';
import { ProcessingProgress as ProcessingProgressType } from '../../types/converter';

interface ProcessingProgressProps {
  /** Current processing progress data */
  progress: ProcessingProgressType;
  /** Whether processing is currently active */
  isProcessing: boolean;
  /** Optional callback when user cancels processing */
  onCancel?: () => void;
}

const STAGE_LABELS = {
  upload: 'Uploading File',
  preprocess: 'Preprocessing Image',
  quantize: 'Reducing Colors',
  vectorize: 'Creating Vectors',
  generate: 'Generating SVG'
} as const;

const STAGE_ORDER = ['upload', 'preprocess', 'quantize', 'vectorize', 'generate'] as const;

/**
 * ProcessingProgress component displays the current processing stage,
 * progress bars, and estimated time remaining for PNG to SVG conversion
 */
export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  progress,
  isProcessing,
  onCancel
}) => {
  const currentStageIndex = STAGE_ORDER.indexOf(progress.stage);
  
  const formatTimeRemaining = (milliseconds?: number): string => {
    if (!milliseconds || milliseconds <= 0) return '';
    
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s remaining`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  };

  const getStageStatus = (stageIndex: number): 'completed' | 'active' | 'pending' => {
    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="processing-progress bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Converting to SVG
        </h3>
        {onCancel && isProcessing && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            aria-label="Cancel processing"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Stage Indicators */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          {STAGE_ORDER.map((stage, index) => {
            const status = getStageStatus(index);
            return (
              <div key={stage} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'active'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {status === 'completed' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-gray-600 mt-1 text-center max-w-16">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Progress Line */}
        <div className="relative mt-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded"></div>
          <div
            className="absolute top-0 left-0 h-1 bg-blue-500 rounded transition-all duration-300"
            style={{
              width: `${((currentStageIndex + progress.progress / 100) / STAGE_ORDER.length) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Current Stage Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {STAGE_LABELS[progress.stage]}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress.progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Status Message and Time Remaining */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">{progress.message}</p>
        {progress.estimatedTimeRemaining && (
          <p className="text-sm text-blue-600 font-medium">
            {formatTimeRemaining(progress.estimatedTimeRemaining)}
          </p>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium text-gray-800">
            {Math.round(((currentStageIndex + progress.progress / 100) / STAGE_ORDER.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingProgress;