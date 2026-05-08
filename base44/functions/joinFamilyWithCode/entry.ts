import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invite_code } = await req.json();

    if (!invite_code || typeof invite_code !== 'string') {
      return Response.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    // Find family group by invite code (case-insensitive search)
    const allFamilyGroups = await base44.asServiceRole.entities.FamilyGroup.list();
    const matchedFamily = allFamilyGroups.find(fg => fg.invite_code?.toUpperCase() === invite_code.toUpperCase());

    if (!matchedFamily) {
      return Response.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Update user to add family_group_id
    await base44.auth.updateMe({ family_group_id: matchedFamily.id });
    
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