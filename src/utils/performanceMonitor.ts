// Simple performance monitoring utility
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.measureFPS();
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }

  private measureFPS() {
    if (!this.isMonitoring) return;

    const now = performance.now();
    this.frameCount++;

    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;

      // Log performance warnings
      if (this.fps < 30) {
        console.warn(`Low FPS detected: ${this.fps}fps`);
      }
    }

    requestAnimationFrame(() => this.measureFPS());
  }

  getFPS(): number {
    return this.fps;
  }

  // Check if device is struggling with performance
  isLowPerformance(): boolean {
    return this.fps < 45;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  performanceMonitor.startMonitoring();
}