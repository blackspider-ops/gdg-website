/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing user-generated HTML content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(
  dirty: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowLinks?: boolean;
  }
): string {
  if (!dirty) return '';

  const config: DOMPurify.Config = {
    // Default: Allow common safe tags
    ALLOWED_TAGS: options?.allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'img', 'div', 'span'
    ],
    
    // Default: Allow common safe attributes
    ALLOWED_ATTR: options?.allowedAttributes ? 
      Object.keys(options.allowedAttributes).reduce((acc, tag) => {
        return [...acc, ...options.allowedAttributes![tag]];
      }, [] as string[]) :
      ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
    
    // Allow links if specified
    ALLOW_UNKNOWN_PROTOCOLS: false,
    
    // Remove scripts and event handlers
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    
    // Keep safe HTML structure
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    
    // Force body
    FORCE_BODY: false,
    
    // Sanitize DOM
    SANITIZE_DOM: true,
    
    // Use safe parser
    USE_PROFILES: { html: true }
  };

  // Add link support if requested
  if (options?.allowLinks) {
    config.ALLOWED_TAGS = [...(config.ALLOWED_TAGS || []), 'a'];
    config.ALLOWED_ATTR = [...(config.ALLOWED_ATTR || []), 'href', 'target', 'rel'];
    
    // Add hook to make external links safe
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        const href = node.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  }

  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize HTML for newsletter/email content
 * More permissive than general sanitization
 */
export function sanitizeEmailHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'img', 'div', 'span', 'a'
    ],
    allowLinks: true
  });
}

/**
 * Sanitize plain text (strip all HTML)
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
}

/**
 * Sanitize markdown-generated HTML
 */
export function sanitizeMarkdownHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'img', 'div', 'span', 'a'
    ],
    allowLinks: true
  });
}

/**
 * React component helper for safe HTML rendering
 */
export function createSafeHtml(dirty: string, options?: Parameters<typeof sanitizeHtml>[1]) {
  return {
    __html: sanitizeHtml(dirty, options)
  };
}
