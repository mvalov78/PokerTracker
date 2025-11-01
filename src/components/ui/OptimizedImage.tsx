"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  quality?: number;
  className?: string;
  fallback?: React.ReactNode;
}

// Image loading states
type ImageLoadingState = "loading" | "loaded" | "error";

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = "empty",
  blurDataURL,
  quality = 75,
  className,
  fallback,
  onLoad,
  onError,
  ...props
}) => {
  const [loadingState, setLoadingState] =
    useState<ImageLoadingState>("loading");
  const [imageSrc, setImageSrc] = useState<string>(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  const [isVisible, setIsVisible] = useState(priority);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Handle image loading
  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadingState("loaded");
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadingState("error");
    onError?.(event);
  };

  // Generate optimized src with quality parameter
  const getOptimizedSrc = (originalSrc: string, quality: number) => {
    if (originalSrc.startsWith("data:") || originalSrc.startsWith("blob:")) {
      return originalSrc;
    }

    // For external images, you might want to use a service like Cloudinary or similar
    // For now, we'll just return the original src
    return originalSrc;
  };

  // Placeholder component
  const ImagePlaceholder = () => (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center",
        className,
      )}
      style={{ width, height }}
    >
      <svg
        className="w-8 h-8 text-gray-400 dark:text-gray-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );

  // Error fallback component
  const ErrorFallback = () =>
    fallback || (
      <div
        className={cn(
          "bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center",
          className,
        )}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm">Не удалось загрузить изображение</p>
        </div>
      </div>
    );

  return (
    <div ref={observerRef} className="relative">
      {!isVisible ? (
        <ImagePlaceholder />
      ) : loadingState === "error" ? (
        <ErrorFallback />
      ) : (
        <>
          {loadingState === "loading" && placeholder === "blur" && (
            <div className="absolute inset-0 z-10">
              {blurDataURL ? (
                <img
                  src={blurDataURL}
                  alt=""
                  className={cn(
                    "w-full h-full object-cover blur-sm",
                    className,
                  )}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
          )}

          <img
            ref={imgRef}
            src={getOptimizedSrc(imageSrc, quality)}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              "transition-opacity duration-300",
              loadingState === "loaded" ? "opacity-100" : "opacity-0",
              className,
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
            {...props}
          />
        </>
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = (srcs: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => reject(src);
        img.src = src;
      });
    };

    const preloadAll = async () => {
      try {
        const loaded = await Promise.allSettled(srcs.map(preloadImage));
        const successful = loaded
          .filter((result) => result.status === "fulfilled")
          .map((result) => (result as PromiseFulfilledResult<string>).value);

        setLoadedImages(new Set(successful));
      } catch (error) {
        console.warn("Some images failed to preload:", error);
      }
    };

    preloadAll();
  }, [srcs]);

  return loadedImages;
};

// Progressive image component
interface ProgressiveImageProps extends OptimizedImageProps {
  lowQualitySrc?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  lowQualitySrc,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (lowQualitySrc && src !== lowQualitySrc) {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setIsHighQualityLoaded(true);
      };
      img.src = src;
    }
  }, [src, lowQualitySrc]);

  return (
    <OptimizedImage
      {...props}
      src={currentSrc}
      className={cn(
        "transition-all duration-300",
        !isHighQualityLoaded && lowQualitySrc && "blur-sm",
        props.className,
      )}
    />
  );
};

export default OptimizedImage;
