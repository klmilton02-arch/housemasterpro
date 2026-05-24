Deno.serve(async (req) => {
  const content = `User-agent: *
Allow: /
Sitemap: https://homelifefocus.online/functions/sitemap
`;

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
});