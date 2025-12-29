/**
 * Performance monitoring utilities for TASUED BioVault
 * Provides performance tracking and optimization utilities
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { startTime: number; count: number; totalTime: number }>;

  private constructor() {
    this.metrics = new Map();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start measuring performance for a specific operation
   */
  start(operation: string): void {
    const startTime = performance.now();
    this.metrics.set(operation, {
      startTime,
      count: 0,
      totalTime: 0
    });
  }

  /**
   * End measuring performance for a specific operation
   */
  end(operation: string): number {
    const metric = this.metrics.get(operation);
    if (!metric) {
      console.warn(`Performance metric not started for: ${operation}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    // Update metrics
    const currentCount = metric.count + 1;
    const currentTotal = metric.totalTime + duration;
    
    this.metrics.set(operation, {
      startTime: 0, // Reset start time
      count: currentCount,
      totalTime: currentTotal
    });

    return duration;
  }

  /**
   * Measure execution time of a function
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.start(operation);
    try {
      const result = await fn();
      const duration = this.end(operation);
      console.log(`${operation} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      this.end(operation);
      throw error;
    }
  }

  /**
   * Get average execution time for an operation
   */
  getAverage(operation: string): number {
    const metric = this.metrics.get(operation);
    if (!metric || metric.count === 0) {
      return 0;
    }
    return metric.totalTime / metric.count;
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): { count: number; totalTime: number; average: number } {
    const metric = this.metrics.get(operation);
    if (!metric) {
      return { count: 0, totalTime: 0, average: 0 };
    }
    
    const average = metric.count > 0 ? metric.totalTime / metric.count : 0;
    return {
      count: metric.count,
      totalTime: metric.totalTime,
      average
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// Create a global instance for easy access
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Simple performance timing utility
 */
export const timeFunction = async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`${label} took ${end - start}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.log(`${label} failed after ${end - start}ms`);
    throw error;
  }
};

/**
 * Debounce function to prevent excessive calls
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>): void {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function throttledFunction(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}