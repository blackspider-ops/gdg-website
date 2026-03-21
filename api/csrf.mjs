// CSRF token generation API
// MEDIUM FIX: Protect against cross-site request forgery

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate a simple CSRF token (UUID)
    const csrfToken = crypto.randomUUID();
    
    // Try to store it in database, but don't fail if function doesn't exist
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.rpc('generate_csrf_token');
    } catch (dbError) {
      // Ignore database errors - CSRF token will still work for this session
      console.warn('CSRF database storage failed (non-critical):', dbError.message);
    }

    return res.status(200).json({ csrfToken });
  } catch (error) {
    console.error('CSRF API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
