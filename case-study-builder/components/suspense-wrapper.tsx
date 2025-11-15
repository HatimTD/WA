import { Suspense, type ReactNode } from 'react';

interface SuspenseWrapperProps {
  fallback: ReactNode;
  children: ReactNode;
  key?: string;
}

/**
 * Wrapper component for handling Suspense boundaries with proper error handling
 * Use this for wrapping async components that fetch data
 */
export function SuspenseWrapper({ fallback, children, key }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback} key={key}>
      {children}
    </Suspense>
  );
}

/**
 * Wrapper for list components that may need keyed Suspense boundaries
 * Useful for components that need to re-suspend when dependencies change
 */
export function KeyedSuspense({
  fallback,
  children,
  dependencies = []
}: {
  fallback: ReactNode;
  children: ReactNode;
  dependencies?: any[];
}) {
  // Create a stable key from dependencies
  const key = dependencies.map(dep =>
    typeof dep === 'object' ? JSON.stringify(dep) : String(dep)
  ).join('-');

  return (
    <Suspense fallback={fallback} key={key}>
      {children}
    </Suspense>
  );
}