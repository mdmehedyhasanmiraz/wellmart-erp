'use client';

import { useEffect, useState } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  onLoadComplete?: () => void;
}

export default function PerformanceMonitor({ componentName, onLoadComplete }: PerformanceMonitorProps) {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setLoadTime(duration);
      setIsLoaded(true);
      
      console.log(`${componentName} loaded in ${duration}ms`);
      
      if (onLoadComplete) {
        onLoadComplete();
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(handleLoad);

    return () => {
      // Cleanup if component unmounts before load completes
    };
  }, [componentName, onLoadComplete]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
      <div>{componentName}</div>
      {loadTime !== null && (
        <div className="text-green-400">
          Loaded in {loadTime}ms
        </div>
      )}
    </div>
  );
}
