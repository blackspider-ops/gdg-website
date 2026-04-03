// Secure session management API with httpOnly cookies
// CRITICAL FIX: Move sessions from localStorage to httpOnly cookies

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Changed from 'strict' to allow cross-site cookies
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
  if (req.method === 'POST') {
    try {
      // Parse body if needed
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      
      const { email, password } = body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      console.log('Login attempt for:', email); // Debug log
      
      // Authenticate admin
      const { data: authResult, error: authError } = await supabase.rpc('authenticate_admin', {
        p_email: email,
        p_password: password
      });

      if (authError) {
        console.error('Auth RPC error:', authError);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('Auth result:', authResult); // Debug log

      if (!authResult || authResult.length === 0) {
        console.log('Auth failed - empty result');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!authResult[0].success) {
        console.log('Auth failed - success=false, message:', authResult[0].message);
        return res.status(401).json({ 
          error: authResult[0].message || 'Invalid email or password'
        });
      }

      const admin = authResult[0];

      // Generate simple session token (no database storage for now)
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const adminData = JSON.stringify({
        id: admin.admin_id,
        email: admin.email,
        role: admin.role,
        display_name: admin.display_name,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });

      // Set httpOnly cookies
      setCookie(res, 'gdg_session', sessionToken);
      setCookie(res, 'gdg_admin', adminData);

      console.log('Login successful for:', admin.email); // Debug log

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
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  // VALIDATE SESSION
  if (req.method === 'GET') {
    try {
      const sessionToken = getCookie(req, 'gdg_session');
      const adminData = getCookie(req, 'gdg_admin');

      if (!sessionToken || !adminData) {
        return res.status(401).json({ error: 'No session' });
      }

      // Parse admin data
      const admin = JSON.parse(adminData);

      // Check expiration
      if (admin.exp < Date.now()) {
        return res.status(401).json({ error: 'Session expired' });
      }

      return res.status(200).json({
        valid: true,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          display_name: admin.display_name
        }
      });
    } catch (error) {
      console.error('Session validation error:', error);
      return res.status(401).json({ error: 'Invalid session' });
    }
  }

  // DELETE SESSION (logout)
  if (req.method === 'DELETE') {
    try {
      // Clear cookies
      setCookie(res, 'gdg_session', '', { maxAge: 0 });
      setCookie(res, 'gdg_admin', '', { maxAge: 0 });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Session deletion error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
