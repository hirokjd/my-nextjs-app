// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  // Start timing an operation
  startTimer(operation) {
    this.startTimes.set(operation, performance.now());
  }

  // End timing and record metric
  endTimer(operation) {
    const startTime = this.startTimes.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
      this.startTimes.delete(operation);
      return duration;
    }
    return 0;
  }

  // Record a metric
  recordMetric(operation, value) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation).push({
      value,
      timestamp: Date.now()
    });

    // Keep only last 100 measurements
    const measurements = this.metrics.get(operation);
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  // Get average time for an operation
  getAverageTime(operation) {
    const measurements = this.metrics.get(operation);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((acc, m) => acc + m.value, 0);
    return sum / measurements.length;
  }

  // Get latest measurement
  getLatestMeasurement(operation) {
    const measurements = this.metrics.get(operation);
    if (!measurements || measurements.length === 0) return null;
    return measurements[measurements.length - 1];
  }

  // Get performance summary
  getSummary() {
    const summary = {};
    for (const [operation, measurements] of this.metrics) {
      if (measurements.length > 0) {
        const values = measurements.map(m => m.value);
        summary[operation] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
          latest: values[values.length - 1]
        };
      }
    }
    return summary;
  }

  // Clear metrics
  clear() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  // Log performance data to console (development only)
  logPerformance() {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Performance Metrics');
      const summary = this.getSummary();
      for (const [operation, metrics] of Object.entries(summary)) {
        console.log(`${operation}:`, {
          avg: `${metrics.average.toFixed(2)}ms`,
          min: `${metrics.min.toFixed(2)}ms`,
          max: `${metrics.max.toFixed(2)}ms`,
          latest: `${metrics.latest.toFixed(2)}ms`,
          count: metrics.count
        });
      }
      console.groupEnd();
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Performance operation constants
export const PERFORMANCE_OPS = {
  DASHBOARD_LOAD: 'dashboard_load',
  DATA_FETCH: 'data_fetch',
  CACHE_READ: 'cache_read',
  CACHE_WRITE: 'cache_write',
  COMPONENT_RENDER: 'component_render'
};

export default performanceMonitor; 