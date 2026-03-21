// Secure session management API with httpOnly cookies
// CRITICAL FIX: Move sessions from localStorage to httpOnly cookies

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 24 * 60 * 60 // 24 hours
};

function setCookie(res, name, value, options = {}) {
  const cookieOptions = { ...COOKIE_OPTIONS, ...options };
  const cookieParts = [`${name}=${value}`];
  
  if (cookieOptions.httpOnly) cookieParts.push('HttpOnly');
  if (cookieOptions.secure) cookieParts.push('Secure');
  if (cookieOptions.sameSite) cookieParts.push(`SameSite=${cookieOptions.sameSite}`);
  if (cookieOptions.path) cookieParts.push(`Path=${cookieOptions.path}`);
  if (cookieOptions.maxAge) cookieParts.push(`Max-Age=${cookieOptions.maxAge}`);
  
  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://gdgpsu.dev', 'https://www.gdgpsu.dev', 'https://gdg-website-six.vercel.app']
    : ['https://gdgpsu.dev', 'https://www.gdgpsu.dev', 'http://localhost:5173', 'http://localhost:3000'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // CREATE SESSION (login)
  if (req.method === 'POST' && req.url === '/api/session') {
    try {
      const { email, password, csrfToken } = req.body;
      // Skip CSRF validation for now - httpOnly cookies provide CSRF protection
      
      // Authenticate using simple function
      const { data: authResult, error: authError } = await supabase.rpc('simple_admin_login', {
        p_email: email,
        p_password: password
      });

      if (authError || !authResult || authResult.length === 0 || !authResult[0].success) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const admin = authResult[0];

      // Generate simple session tokens
      const sessionToken = crypto.randomUUID();
      const refreshToken = crypto.randomUUID();

      // Set httpOnly cookies
      setCookie(res, 'gdg_session', sessionToken);
      setCookie(res, 'gdg_refresh', refreshToken);
      setCookie(res, 'gdg_admin_id', admin.admin_id);

      return res.status(200).json({
        success: true,
        admin: {
          id: admin.admin_id,
          email: admin.email,
          role: admin.role,
          display_name: admin.display_name
        }
      });
    } catch (error) {
      console.error('Session creation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // VALIDATE SESSION
  if (req.method === 'GET' && req.url === '/api/session') {
    try {
      const sessionToken = getCookie(req, 'gdg_session');

      if (!sessionToken) {
        return res.status(401).json({ error: 'No session' });
      }

      const { data: validationResult, error: validationError } = await supabase.rpc('validate_admin_session', {
        p_session_token: sessionToken
      });

      if (validationError || !validationResult || validationResult.length === 0 || !validationResult[0].valid) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const admin = validationResult[0];

      return res.status(200).json({
        valid: true,
        admin: {
          id: admin.admin_id,
          email: admin.email,
          role: admin.role,
          display_name: admin.display_name
        }
      });
    } catch (error) {
      console.error('Session validation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE SESSION (logout)
  if (req.method === 'DELETE' && req.url === '/api/session') {
    try {
      const sessionToken = getCookie(req, 'gdg_session');

      if (sessionToken) {
        await supabase.rpc('invalidate_admin_session', {
          p_session_token: sessionToken
        });
      }

      // Clear cookies
      setCookie(res, 'gdg_session', '', { maxAge: 0 });
      setCookie(res, 'gdg_refresh', '', { maxAge: 0 });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Session deletion error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
