/**
 * Performance Optimization Service
 * Handles advanced performance optimizations including:
 * - Image optimization
 * - Code splitting
 * - Caching strategies
 * - Resource preloading
 * - Performance monitoring
 */

import { monitoringService } from './monitoring-service';

interface PerformanceConfig {
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enableResourcePreloading: boolean;
  enableServiceWorker: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
}

interface ResourcePreloadOptions {
  href: string;
  as: 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossorigin?: 'anonymous' | 'use-credentials';
  type?: string;
}

class PerformanceService {
  private isInitialized = false;
  private config: PerformanceConfig;
  private preloadedResources = new Set<string>();
  private imageCache = new Map<string, string>();

  constructor() {
    this.config = {
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enableResourcePreloading: true,
      enableServiceWorker: true,
      cacheStrategy: 'moderate',
    };
  }

  /**
   * Initialize performance service
   */
  initialize(config?: Partial<PerformanceConfig>): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    if (this.config.enableResourcePreloading) {
      this.setupResourcePreloading();
    }

    if (this.config.enableImageOptimization) {
      this.setupImageOptimization();
    }

    if (this.config.enableServiceWorker) {
      this.setupServiceWorker();
    }

    this.setupPerformanceMonitoring();
    this.isInitialized = true;

    console.log('PerformanceService initialized with config:', this.config);
  }

  /**
   * Preload critical resources
   */
  preloadResource(options: ResourcePreloadOptions): void {
    if (this.preloadedResources.has(options.href)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = options.href;
    link.as = options.as;
    
    if (options.crossorigin) {
      link.crossOrigin = options.crossorigin;
    }
    
    if (options.type) {
      link.type = options.type;
    }

    link.onload = () => {
      this.preloadedResources.add(options.href);
      monitoringService.trackEvent('resource_preloaded', {
        href: options.href,
        as: options.as,
      });
    };

    link.onerror = () => {
      monitoringService.captureError(
        new Error(`Failed to preload resource: ${options.href}`),
        { href: options.href, as: options.as }
      );
    };

    document.head.appendChild(link);
  }

  /**
   * Preload critical images
   */
  preloadImage(src: string, sizes?: string): void {
    if (this.preloadedResources.has(src)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    
    if (sizes) {
      link.setAttribute('imagesizes', sizes);
    }

    link.onload = () => {
      this.preloadedResources.add(src);
      monitoringService.trackEvent('image_preloaded', { src });
    };

    document.head.appendChild(link);
  }

  /**
   * Optimize image loading with lazy loading and WebP support
   */
  optimizeImage(
    src: string,
    alt: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      lazy?: boolean;
      placeholder?: string;
    } = {}
  ): string {
    const {
      width,
      height,
      quality = 80,
      format = 'webp',
      lazy = true,
      placeholder,
    } = options;

    // Check if we have a cached optimized version
    const cacheKey = `${src}-${width}-${height}-${quality}-${format}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    // Generate optimized image URL (this would typically use a CDN or image service)
    let optimizedSrc = src;
    
    // Add WebP support if browser supports it
    if (format === 'webp' && this.supportsWebP()) {
      optimizedSrc = this.convertToWebP(src, { width, height, quality });
    }

    // Cache the optimized URL
    this.imageCache.set(cacheKey, optimizedSrc);

    return optimizedSrc;
  }

  /**
   * Lazy load images with intersection observer
   */
  setupLazyLoading(): void {
    if (!('IntersectionObserver' in window)) {
      return; // Fallback for older browsers
    }

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
              
              monitoringService.trackEvent('image_lazy_loaded', { src });
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }

  /**
   * Setup resource preloading for critical resources
   */
  private setupResourcePreloading(): void {
    // Preload critical fonts
    this.preloadResource({
      href: '/fonts/inter-var.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous',
    });

    // Preload critical CSS
    this.preloadResource({
      href: '/css/critical.css',
      as: 'style',
    });

    // Preload critical JavaScript
    this.preloadResource({
      href: '/js/critical.js',
      as: 'script',
    });
  }

  /**
   * Setup image optimization
   */
  private setupImageOptimization(): void {
    // Setup lazy loading
    this.setupLazyLoading();

    // Optimize existing images
    document.querySelectorAll('img').forEach((img) => {
      if (!img.dataset.optimized) {
        const optimizedSrc = this.optimizeImage(img.src, img.alt);
        img.src = optimizedSrc;
        img.dataset.optimized = 'true';
      }
    });
  }

  /**
   * Setup service worker for caching
   */
  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          monitoringService.trackEvent('service_worker_registered', {
            scope: registration.scope,
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          monitoringService.captureError(error, {
            context: 'service_worker_registration',
          });
        });
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    this.observeCoreWebVitals();

    // Monitor resource loading
    this.observeResourceLoading();

    // Monitor long tasks
    this.observeLongTasks();
  }

  /**
   * Observe Core Web Vitals
   */
  private observeCoreWebVitals(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        monitoringService.trackPerformance('lcp', lastEntry.startTime, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
        });
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          monitoringService.trackPerformance('fid', entry.processingStart - entry.startTime, {
            eventType: entry.name,
          });
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        monitoringService.trackPerformance('cls', clsValue);
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Observe resource loading performance
   */
  private observeResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.duration > 1000) { // Log slow resources
            monitoringService.trackPerformance('slow_resource', entry.duration, {
              name: entry.name,
              type: entry.initiatorType,
              size: entry.transferSize,
            });
          }
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Observe long tasks
   */
  private observeLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          monitoringService.trackPerformance('long_task', entry.duration, {
            startTime: entry.startTime,
          });
        });
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }
  }

  /**
   * Check if browser supports WebP
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Convert image to WebP format
   */
  private convertToWebP(
    src: string,
    options: { width?: number; height?: number; quality?: number }
  ): string {
    // This is a simplified example - in production, you'd use a CDN or image service
    const { width, height, quality } = options;
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    params.set('f', 'webp');
    
    return `${src}?${params.toString()}`;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, number> {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    };
  }

  /**
   * Clear performance caches
   */
  clearCaches(): void {
    this.imageCache.clear();
    this.preloadedResources.clear();
    
    // Clear service worker caches if available
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
