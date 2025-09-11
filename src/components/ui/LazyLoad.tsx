"use client";

import React, { Suspense, lazy } from "react";
import { cn } from "@/lib/utils";

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

// Loading skeleton component
const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-full mb-2"></div>
    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4 mb-2"></div>
    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/2"></div>
  </div>
);

// Lazy load wrapper component
export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback = <LoadingSkeleton />,
  className,
}) => {
  return (
    <Suspense fallback={fallback}>
      <div className={className}>{children}</div>
    </Suspense>
  );
};

// HOC for lazy loading components
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));

  return React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={fallback || <LoadingSkeleton />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Lazy loading for heavy charts
export const LazyChart = lazy(() =>
  import("@/components/charts/ProfitChart").then((module) => ({
    default: module.default,
  })),
);

export const LazyROIChart = lazy(() =>
  import("@/components/charts/ROIChart").then((module) => ({
    default: module.default,
  })),
);

export const LazyPositionChart = lazy(() =>
  import("@/components/charts/PositionChart").then((module) => ({
    default: module.default,
  })),
);

// Lazy loading for OCR component
export const LazyTicketUpload = lazy(() =>
  import("@/components/ocr/TicketUpload").then((module) => ({
    default: module.default,
  })),
);

// Chart loading skeleton
export const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 w-full flex items-center justify-center">
      <div className="text-gray-400 dark:text-gray-500">
        📊 Загрузка графика...
      </div>
    </div>
  </div>
);

// OCR upload skeleton
export const OCRSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48 w-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div className="text-center">
        <div className="text-4xl mb-2">📸</div>
        <div className="text-gray-400 dark:text-gray-500">
          Загрузка OCR компонента...
        </div>
      </div>
    </div>
  </div>
);

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isVisible;
};

// Lazy load on scroll component
interface LazyLoadOnScrollProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
}

export const LazyLoadOnScroll: React.FC<LazyLoadOnScrollProps> = ({
  children,
  fallback = <LoadingSkeleton />,
  className,
  rootMargin = "50px",
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin });
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isVisible, hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {hasLoaded ? children : fallback}
    </div>
  );
};

export default LazyLoad;
