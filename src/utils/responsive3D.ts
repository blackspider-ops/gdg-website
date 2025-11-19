// Responsive 3D utilities for optimal performance across devices

export interface DeviceConfig {
  particleCount: number;
  particleSize: number;
  wireframeSphereCount: number;
  interactiveNodeCount: number;
  maxParallax: number;
  parallaxStrength: number;
  animationSpeed: number;
  pixelRatio: number;
  antialias: boolean;
  shadows: boolean;
}

export const getDeviceConfig = (): DeviceConfig => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isLowPower = hardwareConcurrency <= 4;
  const isHighDPI = pixelRatio > 1.5;
  
  // Base configuration for mobile devices
  if (isMobile) {
    return {
      particleCount: isLowPower ? 400 : 600,
      particleSize: 0.025,
      wireframeSphereCount: 2,
      interactiveNodeCount: 6,
      maxParallax: 12,
      parallaxStrength: 0.0005,
      animationSpeed: 0.8,
      pixelRatio: Math.min(pixelRatio, 1.5),
      antialias: false,
      shadows: false,
    };
  }
  
  // Configuration for tablet devices
  if (isTablet) {
    return {
      particleCount: isLowPower ? 600 : 900,
      particleSize: 0.035,
      wireframeSphereCount: 3,
      interactiveNodeCount: 8,
      maxParallax: 20,
      parallaxStrength: 0.0015,
      animationSpeed: 0.9,
      pixelRatio: Math.min(pixelRatio, 1.5),
      antialias: !isLowPower,
      shadows: false,
    };
  }
  
  // Configuration for desktop devices
  return {
    particleCount: isLowPower ? 800 : 1200,
    particleSize: 0.045,
    wireframeSphereCount: 4,
    interactiveNodeCount: 12,
    maxParallax: 30,
    parallaxStrength: 0.002,
    animationSpeed: 1.0,
    pixelRatio: Math.min(pixelRatio, isLowPower ? 1.5 : 2),
    antialias: !isLowPower,
    shadows: !isLowPower,
  };
};

export const getCanvasConfig = () => {
  const config = getDeviceConfig();
  const isReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  return {
    dpr: [1, config.pixelRatio],
    performance: {
      min: config.pixelRatio > 1.5 ? 0.3 : 0.5,
      max: 1,
      debounce: 200,
    },
    gl: {
      alpha: true,
      antialias: config.antialias,
      powerPreference: config.pixelRatio > 1.5 ? 'low-power' : 'high-performance',
      stencil: false,
      depth: true,
    },
    camera: {
      fov: config.particleCount < 600 ? 50 : 45,
      near: 0.1,
      far: 100,
      position: [0, 0, config.particleCount < 600 ? 12 : 10] as [number, number, number],
    },
    disableAnimations: isReducedMotion,
  };
};

export const getResponsiveTextAreaBounds = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  return {
    x: 0,
    y: isMobile ? 0.5 : 1,
    width: isMobile ? 6 : isTablet ? 7 : 8,
    height: isMobile ? 3 : 4,
    minDistance: isMobile ? 1.2 : 1.6,
  };
};

export const getResponsiveLightingConfig = () => {
  const config = getDeviceConfig();
  
  return {
    ambient: {
      intensity: config.particleCount < 600 ? 0.4 : 0.3,
    },
    directional: {
      intensity: config.particleCount < 600 ? 0.6 : 0.8,
      position: [5, 5, 5] as [number, number, number],
      castShadow: config.shadows,
    },
    point: [
      {
        position: [-10, -10, -5] as [number, number, number],
        intensity: config.particleCount < 600 ? 0.3 : 0.4,
        color: '#52A5FF',
      },
      {
        position: [10, 10, 5] as [number, number, number],
        intensity: config.particleCount < 600 ? 0.3 : 0.4,
        color: '#FF5A52',
      },
    ],
    spot: config.particleCount >= 800 ? {
      position: [0, 15, 0] as [number, number, number],
      angle: 0.3,
      penumbra: 1,
      intensity: 0.5,
      color: '#FBBF24',
    } : null,
  };
};

// Performance monitoring utilities
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private targetFPS = 60;
  
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
  }
  
  update(currentTime: number) {
    this.frameCount++;
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
  
  shouldReduceQuality(): boolean {
    return this.fps < this.targetFPS * 0.8; // Reduce quality if FPS drops below 80% of target
  }
  
  getFPS(): number {
    return this.fps;
  }
}

export const createAdaptiveConfig = () => {
  const monitor = new PerformanceMonitor();
  let currentConfig = getDeviceConfig();
  
  return {
    monitor,
    getConfig: () => currentConfig,
    adaptConfig: (currentTime: number) => {
      monitor.update(currentTime);
      
      if (monitor.shouldReduceQuality()) {
        // Reduce particle count and effects for better performance
        currentConfig = {
          ...currentConfig,
          particleCount: Math.max(200, currentConfig.particleCount * 0.8),
          wireframeSphereCount: Math.max(1, currentConfig.wireframeSphereCount - 1),
          interactiveNodeCount: Math.max(4, currentConfig.interactiveNodeCount - 2),
          animationSpeed: currentConfig.animationSpeed * 0.9,
        };
      }
    },
  };
};