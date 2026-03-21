// CSRF token management service
// MEDIUM FIX: Protect against cross-site request forgery

class CSRFService {
  private static token: string | null = null;
  private static tokenExpiry: number = 0;

  /**
   * Get CSRF token (fetch new one if expired)
   */
  static async getToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (expires in 50 minutes)
    if (this.token && this.tokenExpiry > now) {
      return this.token;
    }

    // Fetch new token from API
    try {
      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      this.token = data.csrfToken;
      this.tokenExpiry = now + (50 * 60 * 1000); // 50 minutes

      return this.token;
    } catch (error) {
      console.error('CSRF token fetch error:', error);
      throw error;
    }
  }

  /**
   * Clear cached token (call on logout)
   */
  static clearToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
  }

  /**
   * Add CSRF token to request headers
   */
  static async addTokenToHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }
}

export default CSRFService;
