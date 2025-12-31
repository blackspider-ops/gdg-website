// Dynamic Sitemap Generator for GDG PSU
// Generates sitemap.xml with all public pages and blog posts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const SITE_URL = 'https://gdgpsu.dev';

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/events', priority: 0.9, changefreq: 'daily' },
  { path: '/blog', priority: 0.9, changefreq: 'daily' },
  { path: '/projects', priority: 0.8, changefreq: 'weekly' },
  { path: '/team', priority: 0.7, changefreq: 'weekly' },
  { path: '/resources', priority: 0.7, changefreq: 'weekly' },
  { path: '/sponsors', priority: 0.6, changefreq: 'monthly' },
  { path: '/contact', priority: 0.6, changefreq: 'monthly' },
];

export default async function handler(req, res) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch published blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    // Fetch active events
    const { data: events } = await supabase
      .from('events')
      .select('id, updated_at, created_at')
      .eq('status', 'published')
      .order('event_date', { ascending: false });

    // Fetch linktree profiles
    const { data: linktrees } = await supabase
      .from('linktree_profiles')
      .select('username, updated_at')
      .eq('is_active', true);

    const now = new Date().toISOString();

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add blog posts
    if (blogPosts && blogPosts.length > 0) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at || post.created_at || now;
        sitemap += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add linktree profiles
    if (linktrees && linktrees.length > 0) {
      for (const profile of linktrees) {
        const lastmod = profile.updated_at || now;
        sitemap += `  <url>
    <loc>${SITE_URL}/l/${profile.username}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    // Set headers for XML response
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Return a basic sitemap on error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(basicSitemap);
  }
}
