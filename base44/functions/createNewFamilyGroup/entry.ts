import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { family_name } = payload;

    if (!family_name || !family_name.trim()) {
      return Response.json({ error: 'Family name is required' }, { status: 400 });
    }

    // Generate a random invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create new family group (must match RLS requirement: owner_email equals user.email)
    const familyGroup = await base44.entities.FamilyGroup.create({
      name: family_name.trim(),
      invite_code: inviteCode,
      owner_email: user.email,
    });

    // Update user's family_group_id
    await base44.auth.updateMe({
      family_group_id: familyGroup.id,
    });

    return Response.json({
      success: true,
      family_group: {
        id: familyGroup.id,
        name: familyGroup.name,
        invite_code: familyGroup.invite_code,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});