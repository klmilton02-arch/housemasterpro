import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.family_group_id) {
      return Response.json({ error: 'User is not in a family' }, { status: 400 });
    }

    const { member_email, new_name } = await req.json();

    if (!member_email || !new_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the family member by linked email
    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id,
      linked_user_email: member_email,
    });

    if (members.length === 0) {
      return Response.json({ error: 'Family member not found' }, { status: 404 });
    }

    const member = members[0];

    // Authorization check: user can only update their own member or if they're admin
    const isOwnMember = member.linked_user_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwnMember && !isAdmin) {
      return Response.json({ error: 'Forbidden: You can only update your own profile' }, { status: 403 });
    }

    // Update the member's name
    await base44.asServiceRole.entities.FamilyMember.update(member.id, {
      name: new_name.trim(),
    });

    return Response.json({ success: true, message: 'Member name updated' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});