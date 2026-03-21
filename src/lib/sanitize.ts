// Enhanced HTML sanitization with email-specific rules
// CRITICAL FIX: Sanitize HTML content before sending emails

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for email sending
 * More restrictive than general HTML sanitization
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return '';

  // Configure DOMPurify for email content
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th',
      'thead', 'tbody', 'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height',
      'align', 'border', 'cellpadding', 'cellspacing'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  };

  return DOMPurify.sanitize(html, config);
}

/**
 * Escape HTML entities to prevent XSS
 * Use for plain text that will be inserted into HTML
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Sanitize email subject line
 * Remove any control characters and limit length
 */
export function sanitizeEmailSubject(subject: string): string {
  if (!subject) return '';

  // Remove control characters and newlines
  let sanitized = subject.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  return sanitized.trim();
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Additional checks for suspicious patterns
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return null;
  }

  return trimmed;
}

/**
 * Create safe HTML from user input (for preview purposes)
 * Sanitizes and returns safe HTML string
 */
export function createSafeHtml(html: string): { __html: string } {
  return {
    __html: sanitizeEmailHtml(html)
  };
}

/**
 * Sanitize URL for use in emails
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
