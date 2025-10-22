// Performance monitoring utilities for user profile operations
export class ProfilePerformanceMonitor {
  private static timers = new Map<string, number>();
  private static metrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  static startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  static endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operation);

    // Update metrics
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    this.metrics.set(operation, existing);

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${operation}: ${Math.round(duration)}ms (avg: ${Math.round(existing.avgTime)}ms)`);
    }

    return duration;
  }

  static getMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.metrics);
  }

  static clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  // Helper to wrap async functions with performance monitoring
  static async measureAsync<T>(
    operation: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(operation);
    try {
      const result = await fn();
      this.endTimer(operation);
      return result;
    } catch (error) {
      this.endTimer(operation);
      throw error;
    }
  }
}

// Performance monitoring decorator for class methods
export function measurePerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return ProfilePerformanceMonitor.measureAsync(operation, () => method.apply(this, args));
    };

    return descriptor;
  };
}
