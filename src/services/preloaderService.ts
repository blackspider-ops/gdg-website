// Preloader service for critical resources and data
class PreloaderService {
  private preloadedImages = new Set<string>();
  private preloadedFonts = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();

  // Preload critical images
  async preloadImages(urls: string[]): Promise<void> {
    const imagePromises = urls
      .filter(url => !this.preloadedImages.has(url))
      .map(url => this.preloadImage(url));

    await Promise.allSettled(imagePromises);
  }

  private preloadImage(url: string): Promise<void> {
    if (this.preloadedImages.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.preloadedImages.add(url);
        resolve();
      };
      
      img.onerror = () => {
        // Don't reject, just resolve to continue with other images
        resolve();
      };
      
      // Set timeout to prevent hanging
      setTimeout(() => resolve(), 5000);
      
      img.src = url;
    });
  }

  // Preload critical fonts
  async preloadFonts(fonts: Array<{ family: string; weight?: string; style?: string }>): Promise<void> {
    if (!('fonts' in document)) return;

    const fontPromises = fonts
      .filter(font => {
        const key = `${font.family}-${font.weight || 'normal'}-${font.style || 'normal'}`;
        return !this.preloadedFonts.has(key);
      })
      .map(font => this.preloadFont(font));

    await Promise.allSettled(fontPromises);
  }

  private async preloadFont(font: { family: string; weight?: string; style?: string }): Promise<void> {
    const key = `${font.family}-${font.weight || 'normal'}-${font.style || 'normal'}`;
    
    if (this.preloadedFonts.has(key)) return;

    try {
      // Skip font preloading to avoid errors - fonts will load via CSS
      // Fonts are loaded via CSS import in index.css instead
      this.preloadedFonts.add(key);
    } catch (error) {
      // Font loading failed, continue silently
    }
  }

  // Preload critical CSS
  preloadCSS(href: string): void {
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }

  // Preload JavaScript modules
  preloadScript(src: string): Promise<void> {
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = src;
      link.onload = () => resolve();
      link.onerror = () => resolve(); // Don't reject, just continue
      document.head.appendChild(link);
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(), 10000);
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  // Preload data with intersection observer
  preloadOnVisible(element: Element, preloadFn: () => Promise<any>): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback: preload immediately
      preloadFn();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            preloadFn();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px' // Start preloading 50px before element is visible
      }
    );

    observer.observe(element);
  }

  // Preload on user interaction
  preloadOnInteraction(
    elements: Element[],
    preloadFn: () => Promise<any>,
    events: string[] = ['mouseenter', 'touchstart', 'focus']
  ): void {
    let hasPreloaded = false;

    const preload = () => {
      if (hasPreloaded) return;
      hasPreloaded = true;
      preloadFn();
      cleanup();
    };

    const cleanup = () => {
      elements.forEach(element => {
        events.forEach(event => {
          element.removeEventListener(event, preload);
        });
      });
    };

    elements.forEach(element => {
      events.forEach(event => {
        element.addEventListener(event, preload, { passive: true, once: true });
      });
    });
  }

  // Preload based on connection speed
  shouldPreload(): boolean {
    if (!('connection' in navigator)) return true;

    const connection = (navigator as any).connection;
    
    // Don't preload on slow connections
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return false;
    }

    // Don't preload if user has data saver enabled
    if (connection.saveData) {
      return false;
    }

    return true;
  }

  // Intelligent preloading based on user behavior
  async intelligentPreload(config: {
    images?: string[];
    fonts?: Array<{ family: string; weight?: string; style?: string }>;
    scripts?: string[];
    data?: Array<{ key: string; fn: () => Promise<any> }>;
  }): Promise<void> {
    if (!this.shouldPreload()) return;

    const promises: Promise<any>[] = [];

    // Preload images
    if (config.images?.length) {
      promises.push(this.preloadImages(config.images));
    }

    // Preload fonts
    if (config.fonts?.length) {
      promises.push(this.preloadFonts(config.fonts));
    }

    // Preload scripts
    if (config.scripts?.length) {
      promises.push(
        Promise.allSettled(config.scripts.map(script => this.preloadScript(script)))
      );
    }

    // Preload data
    if (config.data?.length) {
      promises.push(
        Promise.allSettled(config.data.map(({ fn }) => fn()))
      );
    }

    await Promise.allSettled(promises);
  }



  // Clear preloader cache
  clear(): void {
    this.preloadedImages.clear();
    this.preloadedFonts.clear();
    this.preloadPromises.clear();
  }
}

export const preloaderService = new PreloaderService();