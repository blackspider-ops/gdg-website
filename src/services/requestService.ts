// Request deduplication and batching service
type QueueItem = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

class RequestService {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestQueue = new Map<string, Array<QueueItem>>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // 50ms batching window

  // Deduplicate identical requests
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Batch multiple requests together
  async batch<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add to queue
      if (!this.requestQueue.has(key)) {
        this.requestQueue.set(key, []);
      }
      this.requestQueue.get(key)!.push({ resolve, reject });

      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Set new timeout to process batch
      this.batchTimeout = setTimeout(() => {
        this.processBatch(key, requestFn);
      }, this.BATCH_DELAY);
    });
  }

  private async processBatch<T>(key: string, requestFn: () => Promise<T>) {
    const queue = this.requestQueue.get(key);
    if (!queue || queue.length === 0) return;

    // Clear the queue
    this.requestQueue.delete(key);

    try {
      const result = await requestFn();
      // Resolve all pending requests with the same result
      queue.forEach(({ resolve }) => resolve(result));
    } catch (error) {
      // Reject all pending requests with the same error
      queue.forEach(({ reject }) => reject(error));
    }
  }

  // Parallel request execution with concurrency limit
  async parallel<T>(
    requests: Array<() => Promise<T>>,
    concurrency: number = 3
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      const promise = request().then(result => {
        results[i] = result;
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  // Request with retry logic
  async withRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  // Request with timeout
  async withTimeout<T>(
    requestFn: () => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    return Promise.race([
      requestFn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      })
    ]);
  }

  // Combined request with all optimizations
  async optimizedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      dedupe?: boolean;
      batch?: boolean;
      retry?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const {
      dedupe = true,
      batch = false,
      retry = 2,
      timeout = 10000
    } = options;

    let finalRequestFn = requestFn;

    // Add timeout
    if (timeout > 0) {
      finalRequestFn = () => this.withTimeout(requestFn, timeout);
    }

    // Add retry
    if (retry > 0) {
      const timeoutFn = finalRequestFn;
      finalRequestFn = () => this.withRetry(timeoutFn, retry);
    }

    // Add batching or deduplication
    if (batch) {
      return this.batch(key, finalRequestFn);
    } else if (dedupe) {
      return this.dedupe(key, finalRequestFn);
    }

    return finalRequestFn();
  }

  // Clear all pending requests
  clear(): void {
    this.pendingRequests.clear();
    this.requestQueue.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }


}

export const requestService = new RequestService();