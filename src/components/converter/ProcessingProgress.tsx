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
    <div className="vercel-card p-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-black">
          Converting to SVG
        </h3>
        {onCancel && isProcessing && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-black transition-colors px-3 py-1 hover:bg-gray-100 rounded-md"
            aria-label="Cancel processing"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Stage Indicators */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {STAGE_ORDER.map((stage, index) => {
            const status = getStageStatus(index);
            return (
              <div key={stage} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    status === 'completed'
                      ? 'bg-black text-white'
                      : status === 'active'
                      ? 'bg-gray-800 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
                <span className="text-xs text-gray-600 mt-2 text-center max-w-20 leading-tight">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Progress Line */}
        <div className="relative mt-6">
          <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 rounded-full"></div>
          <div
            className="absolute top-0 left-0 h-2 bg-black rounded-full transition-all duration-300"
            style={{
              width: `${((currentStageIndex + progress.progress / 100) / STAGE_ORDER.length) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Current Stage Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-black">
            {STAGE_LABELS[progress.stage]}
          </span>
          <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {Math.round(progress.progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-black h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Status Message and Time Remaining */}
      <div className="space-y-3 text-center">
        <p className="text-gray-600">{progress.message}</p>
        {progress.estimatedTimeRemaining && (
          <p className="text-sm text-black font-medium">
            {formatTimeRemaining(progress.estimatedTimeRemaining)}
          </p>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-medium text-black">
            {Math.round(((currentStageIndex + progress.progress / 100) / STAGE_ORDER.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProcessingProgress;