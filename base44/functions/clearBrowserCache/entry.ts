import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This endpoint returns HTML that triggers browser cache clearing
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Clearing Cache...</title>
      </head>
      <body>
        <script>
          // Clear all localStorage
          localStorage.clear();
          
          // Clear all sessionStorage
          sessionStorage.clear();
          
          // Clear IndexedDB
          const dbs = await indexedDB.databases();
          dbs.forEach(db => indexedDB.deleteDatabase(db.name));
          
          // Hard refresh to reload from server
          setTimeout(() => {
            window.location.href = '/dashboard?cache-cleared=' + Date.now();
            location.reload(true);
          }, 100);
        </script>
        <p>Clearing cache... please wait.</p>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});