import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.family_group_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { member_id, user_id, user_email } = await req.json();
    if (!member_id || !user_id) {
      return Response.json({ error: 'member_id and user_id are required' }, { status: 400 });
    }

    // Verify the member belongs to the user's family group
    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id,
    });

    const member = members.find(m => m.id === member_id);
    if (!member) {
      return Response.json({ error: 'Member not found in your family group' }, { status: 404 });
    }

    await base44.asServiceRole.entities.FamilyMember.update(member_id, {
      linked_user_id: user_id,
      linked_user_email: user_email,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});