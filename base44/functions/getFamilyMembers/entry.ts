import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.family_group_id) {
      return Response.json({ members: [] });
    }

    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id,
    });

    return Response.json({ members });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});