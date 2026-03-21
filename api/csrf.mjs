// CSRF token generation API
// MEDIUM FIX: Protect against cross-site request forgery

import { createClient } from '@supabase/supabase-js';

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate CSRF token
    const { data, error } = await supabase.rpc('generate_csrf_token');

    if (error) {
      console.error('CSRF token generation error:', error);
      return res.status(500).json({ error: 'Failed to generate CSRF token' });
    }

    return res.status(200).json({ csrfToken: data });
  } catch (error) {
    console.error('CSRF API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
