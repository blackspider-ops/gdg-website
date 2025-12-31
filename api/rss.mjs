// Dynamic RSS Feed Generator for GDG PSU
// Generates RSS 2.0 feed with latest blog posts and events

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const SITE_URL = 'https://gdgpsu.dev';
const SITE_TITLE = 'GDG on Campus PSU';
const SITE_DESCRIPTION = 'Google Developer Group on Campus at Pennsylvania State University - Events, Blog Posts, and Developer Resources';

// Helper to escape XML special characters
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to format date for RSS
function formatRssDate(dateString) {
  return new Date(dateString).toUTCString();
}

// Strip HTML tags for description
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').substring(0, 500);
}

export default async function handler(req, res) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch latest published blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, featured_image, created_at, updated_at, author_name')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch upcoming events
    const { data: events } = await supabase
      .from('events')
      .select('id, title, description, event_date, location, image_url, created_at')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(10);

    const now = new Date().toUTCString();
    const lastBuildDate = blogPosts?.[0]?.updated_at 
      ? formatRssDate(blogPosts[0].updated_at)
      : now;

    // Build RSS XML
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} GDG on Campus PSU</copyright>
    <managingEditor>gdg@psu.edu (GDG PSU Team)</managingEditor>
    <webMaster>gdg@psu.edu (GDG PSU Team)</webMaster>
    <category>Technology</category>
    <category>Developer Community</category>
    <category>Google</category>
    <ttl>60</ttl>
`;

    // Add blog posts
    if (blogPosts && blogPosts.length > 0) {
      for (const post of blogPosts) {
        const pubDate = formatRssDate(post.created_at);
        const description = post.excerpt || stripHtml(post.content);
        
        rss += `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>Blog</category>
`;
        if (post.author_name) {
          rss += `      <author>gdgpsu@gmail.com (${escapeXml(post.author_name)})</author>
`;
        }
        if (post.featured_image) {
          rss += `      <media:content url="${escapeXml(post.featured_image)}" medium="image"/>
      <enclosure url="${escapeXml(post.featured_image)}" type="image/jpeg"/>
`;
        }
        rss += `    </item>
`;
      }
    }

    // Add upcoming events
    if (events && events.length > 0) {
      for (const event of events) {
        const pubDate = formatRssDate(event.created_at);
        const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const description = `${event.description || ''}\n\nDate: ${eventDate}\nLocation: ${event.location || 'TBA'}`;
        
        rss += `    <item>
      <title>[Event] ${escapeXml(event.title)}</title>
      <link>${SITE_URL}/events</link>
      <guid isPermaLink="false">event-${event.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>Event</category>
`;
        if (event.image_url) {
          rss += `      <media:content url="${escapeXml(event.image_url)}" medium="image"/>
`;
        }
        rss += `    </item>
`;
      }
    }

    rss += `  </channel>
</rss>`;

    // Set headers for XML response
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
    
    return res.status(200).send(rss);
  } catch (error) {
    console.error('RSS generation error:', error);
    
    // Return a basic RSS feed on error
    const basicRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
  </channel>
</rss>`;
    
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    return res.status(200).send(basicRss);
  }
}
