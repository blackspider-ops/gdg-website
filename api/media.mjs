export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');

  if (!path) {
    return new Response('Missing path parameter', { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return new Response('Server configuration error', { status: 500 });
  }

  // Construct the Supabase storage URL
  const storageUrl = `${supabaseUrl}/storage/v1/object/public/media/${path}`;

  try {
    // Fetch the file from Supabase
    const response = await fetch(storageUrl);

    if (!response.ok) {
      return new Response('File not found', { status: 404 });
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return the file with appropriate headers
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error proxying media:', error);
    return new Response('Error fetching file', { status: 500 });
  }
}
