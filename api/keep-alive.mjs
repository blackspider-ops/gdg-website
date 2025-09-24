import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Allow both GET and POST requests (Vercel cron uses GET)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // For manual testing with POST, verify auth header
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    )

    // Perform a lightweight query - just check if we can connect
    const { data, error } = await supabase
      .from('navigation_items')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Supabase keep-alive error:', error)
      return res.status(500).json({
        error: 'Database connection failed',
        details: error.message
      })
    }

    console.log('Supabase keep-alive successful at:', new Date().toISOString())

    return res.status(200).json({
      success: true,
      message: 'Supabase connection maintained',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Keep-alive error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}