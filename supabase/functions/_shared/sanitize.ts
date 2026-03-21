// Shared sanitization utilities for Edge Functions
// CRITICAL FIX: Escape HTML entities in email templates

/**
 * Escape HTML entities to prevent XSS in emails
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return String(text).replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Sanitize email subject line
 */
export function sanitizeSubject(subject: string): string {
  if (!subject) return '';

  // Remove control characters and newlines
  let sanitized = subject.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  return sanitized.trim();
}
