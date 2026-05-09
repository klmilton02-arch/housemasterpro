import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.family_group_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatar_color } = await req.json();
    if (!name || !name.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const member = await base44.asServiceRole.entities.FamilyMember.create({
      family_group_id: user.family_group_id,
      name: name.trim(),
      avatar_color: avatar_color || 'blue',
    });

    return Response.json({ success: true, member });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});