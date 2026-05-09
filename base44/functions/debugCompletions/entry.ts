import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const completions = await base44.asServiceRole.entities.CompletionHistory.list();
    
    const byMember = {};
    for (const c of completions) {
      if (!byMember[c.family_member_id]) {
        byMember[c.family_member_id] = { name: c.family_member_name, count: 0, ids: [] };
      }
      byMember[c.family_member_id].count++;
      byMember[c.family_member_id].ids.push(c.id);
    }

    return Response.json({
      total_completions: completions.length,
      byMember,
      all: completions.slice(0, 5)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});