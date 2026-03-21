// Input validation service
// MEDIUM FIX: Strict input validation for all API endpoints

import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .toLowerCase()
  .trim();

/**
 * Password validation schema (14+ characters, complexity requirements)
 */
export const passwordSchema = z.string()
  .min(14, 'Password must be at least 14 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

/**
 * Newsletter email request validation
 */
export const newsletterEmailSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  html_content: z.string().max(100000).optional(),
  subscriber_name: z.string().max(100).optional(),
  unsubscribe_url: z.string().url().optional()
});

/**
 * Newsletter campaign validation
 */
export const newsletterCampaignSchema = z.object({
  campaign_id: z.string().uuid(),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  html_content: z.string().max(100000).optional(),
  custom_emails: z.string().optional(),
  test_mode: z.boolean().optional()
});

/**
 * Admin login validation
 */
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  csrfToken: z.string().min(1)
});

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(52428800), // 50MB
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i),
  folderId: z.string().uuid().optional()
});

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid();

/**
 * Validate input against schema
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError.message };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Sanitize string input (remove null bytes, control characters)
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove null bytes and control characters
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string, allowedProtocols: string[] = ['http:', 'https:']): string | null {
  try {
    const parsed = new URL(url);
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Check for SQL injection patterns (basic detection)
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b.*=.*|1=1|'=')/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns (basic detection)
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}
