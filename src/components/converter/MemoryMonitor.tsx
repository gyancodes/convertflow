/**
 * Memory usage monitoring component
 * Displays real-time memory usage and performance metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor } from '../../utils/performanceMonitor';

interface MemoryStats {
  current: number;
  peak: number;
  baseline: number;
  delta: number;
  isSupported: boolean;
}

interface MemoryMonitorProps {
  isProcessing?: boolean;
  onMemoryWarning?: (warning: string) => void;
  className?: string;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  isProcessing = false,
  onMemoryWarning,
  className = ''
}) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    current: 0,
    peak: 0,
    baseline: 0,
    delta: 0,
    isSupported: false
  });
  
  const [performanceMonitor] = useState(() => new PerformanceMonitor());
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  const updateMemoryStats = useCallback(() => {
    const stats = performanceMonitor.getMemoryStats();
    setMemoryStats(stats);

    // Check for memory warnings
    if (stats.isSupported && onMemoryWarning) {
      const memoryMB = stats.current / (1024 * 1024);
      const deltaMB = stats.delta / (1024 * 1024);

      if (memoryMB > 100) {
        onMemoryWarning(`High memory usage: ${memoryMB.toFixed(1)}MB`);
      } else if (deltaMB > 50) {
        onMemoryWarning(`Memory increase: +${deltaMB.toFixed(1)}MB`);
      }
    }
  }, [performanceMonitor, onMemoryWarning]);

  useEffect(() => {
    // Update immediately
    updateMemoryStats();

    // Set up periodic updates when processing
    if (isProcessing) {
      const interval = setInterval(updateMemoryStats, 1000); // Update every second
      setUpdateInterval(interval);
    } else if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [isProcessing, updateMemoryStats, updateInterval]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getMemoryStatus = (): 'good' | 'warning' | 'critical' => {
    if (!memoryStats.isSupported) return 'good';
    
    const memoryMB = memoryStats.current / (1024 * 1024);
    const deltaMB = memoryStats.delta / (1024 * 1024);
    
    if (memoryMB > 150 || deltaMB > 100) return 'critical';
    if (memoryMB > 75 || deltaMB > 50) return 'warning';
    return 'good';
  };

  const memoryStatus = getMemoryStatus();

  if (!memoryStats.isSupported) {
    return (
      <div className={`memory-monitor memory-monitor--unsupported ${className}`}>
        <div className="memory-monitor__icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V4h2v6z"/>
          </svg>
        </div>
        <span className="memory-monitor__text">Memory monitoring not supported</span>
      </div>
    );
  }

  return (
    <div className={`memory-monitor memory-monitor--${memoryStatus} ${className}`}>
      <div className="memory-monitor__header">
        <div className="memory-monitor__icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4v8h12V4H2zm10 6H4V6h8v4z"/>
            <path d="M5 7h1v2H5V7zm2 0h1v2H7V7zm2 0h1v2H9V7zm2 0h1v2h-1V7z"/>
          </svg>
        </div>
        <span className="memory-monitor__title">Memory Usage</span>
        {isProcessing && (
          <div className="memory-monitor__status">
            <div className="memory-monitor__pulse"></div>
            <span>Monitoring</span>
          </div>
        )}
      </div>

      <div className="memory-monitor__stats">
        <div className="memory-monitor__stat">
          <span className="memory-monitor__label">Current:</span>
          <span className="memory-monitor__value">{formatBytes(memoryStats.current)}</span>
        </div>
        
        <div className="memory-monitor__stat">
          <span className="memory-monitor__label">Peak:</span>
          <span className="memory-monitor__value">{formatBytes(memoryStats.peak)}</span>
        </div>
        
        <div className="memory-monitor__stat">
          <span className="memory-monitor__label">Delta:</span>
          <span className={`memory-monitor__value ${memoryStats.delta > 0 ? 'memory-monitor__value--positive' : ''}`}>
            {memoryStats.delta > 0 ? '+' : ''}{formatBytes(memoryStats.delta)}
          </span>
        </div>
      </div>

      {memoryStatus !== 'good' && (
        <div className="memory-monitor__warning">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          <span>
            {memoryStatus === 'critical' ? 'High memory usage detected' : 'Elevated memory usage'}
          </span>
        </div>
      )}

      <style jsx>{`
        .memory-monitor {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          color: #495057;
        }

        .memory-monitor--warning {
          background: #fff3cd;
          border-color: #ffeaa7;
          color: #856404;
        }

        .memory-monitor--critical {
          background: #f8d7da;
          border-color: #f5c6cb;
          color: #721c24;
        }

        .memory-monitor--unsupported {
          background: #e2e3e5;
          border-color: #d6d8db;
          color: #6c757d;
        }

        .memory-monitor__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .memory-monitor__icon {
          display: flex;
          align-items: center;
          opacity: 0.7;
        }

        .memory-monitor__title {
          font-weight: 500;
          flex: 1;
        }

        .memory-monitor__status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          opacity: 0.8;
        }

        .memory-monitor__pulse {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .memory-monitor__stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px;
          margin-bottom: 8px;
        }

        .memory-monitor__stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .memory-monitor__label {
          font-size: 11px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .memory-monitor__value {
          font-weight: 500;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .memory-monitor__value--positive {
          color: #dc3545;
        }

        .memory-monitor__warning {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid currentColor;
          opacity: 0.8;
        }

        .memory-monitor__warning svg {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default MemoryMonitor;