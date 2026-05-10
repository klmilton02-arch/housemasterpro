import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, avatar_color, family_group_id, linked_user_id, linked_user_email } = await req.json();

    const member = await base44.asServiceRole.entities.FamilyMember.create({
      family_group_id,
      name: name.trim(),
      avatar_color: avatar_color || 'blue',
      linked_user_id: linked_user_id || undefined,
      linked_user_email: linked_user_email || undefined,
    });

    return Response.json({ success: true, member });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});