/**
 * Memory usage monitoring component
 * Displays real-time memory usage and performance metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor } from '../../utils/performanceMonitor';
import styles from './MemoryMonitor.module.css';

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
      <div className={`${styles.memoryMonitor} ${styles.unsupported} ${className}`}>
        <div className={styles.icon}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H7v-2h2v2zm0-3H7V4h2v6z"/>
          </svg>
        </div>
        <span>Memory monitoring not supported</span>
      </div>
    );
  }

  return (
    <div className={`${styles.memoryMonitor} ${styles[memoryStatus]} ${className}`}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4v8h12V4H2zm10 6H4V6h8v4z"/>
            <path d="M5 7h1v2H5V7zm2 0h1v2H7V7zm2 0h1v2H9V7zm2 0h1v2h-1V7z"/>
          </svg>
        </div>
        <span className={styles.title}>Memory Usage</span>
        {isProcessing && (
          <div className={styles.status}>
            <div className={styles.pulse}></div>
            <span>Monitoring</span>
          </div>
        )}
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Current:</span>
          <span className={styles.value}>{formatBytes(memoryStats.current)}</span>
        </div>
        
        <div className={styles.stat}>
          <span className={styles.label}>Peak:</span>
          <span className={styles.value}>{formatBytes(memoryStats.peak)}</span>
        </div>
        
        <div className={styles.stat}>
          <span className={styles.label}>Delta:</span>
          <span className={`${styles.value} ${memoryStats.delta > 0 ? styles.positive : ''}`}>
            {memoryStats.delta > 0 ? '+' : ''}{formatBytes(memoryStats.delta)}
          </span>
        </div>
      </div>

      {memoryStatus !== 'good' && (
        <div className={styles.warning}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          <span>
            {memoryStatus === 'critical' ? 'High memory usage detected' : 'Elevated memory usage'}
          </span>
        </div>
      )}


    </div>
  );
};

export default MemoryMonitor;