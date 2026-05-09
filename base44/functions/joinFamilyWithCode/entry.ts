import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invite_code, display_name } = await req.json();

    if (!invite_code || typeof invite_code !== 'string') {
      return Response.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    // Find family group by invite code (exact match)
    const families = await base44.asServiceRole.entities.FamilyGroup.filter({ invite_code: invite_code.toUpperCase() });
    const matchedFamily = families[0];

    if (!matchedFamily) {
      return Response.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Update user to add family_group_id
    await base44.auth.updateMe({ family_group_id: matchedFamily.id });
    
    // Check if a FamilyMember already exists for this user
    const existingMember = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: matchedFamily.id,
      linked_user_email: user.email,
    });
    
    const memberName = (display_name && display_name.trim()) ? display_name.trim() : user.full_name;

    // Only create if it doesn't exist
    if (existingMember.length === 0) {
      await base44.asServiceRole.entities.FamilyMember.create({
        family_group_id: matchedFamily.id,
        name: memberName,
        linked_user_id: user.id,
        linked_user_email: user.email,
        avatar_color: 'blue',
      });
    } else {
      // Update existing member with the linked user info and chosen name
      await base44.asServiceRole.entities.FamilyMember.update(existingMember[0].id, {
        linked_user_id: user.id,
        linked_user_email: user.email,
        name: memberName,
      });
    }
    
    // Verify the update worked by re-fetching the user
    const verifiedUser = await base44.auth.me();

    return Response.json({
      success: true,
      message: 'Successfully joined family',
      family_group: matchedFamily,
      user: verifiedUser,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});