import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const cats = await base44.asServiceRole.entities.CatShelter.list('-created_date', 100);
    return Response.json({ count: cats.length, cats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});