import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const familyGroupId = '6a022b2d26729cca52dd5fb0';

    // Get all profiles with this family_group_id (using service role to bypass RLS)
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({ family_group_id: familyGroupId });

    console.log('Profiles with family_group_id:', allProfiles.map(p => ({
      user_id: p.user_id,
      family_member_name: p.family_member_name,
      family_group_id: p.family_group_id,
    })));

    // Also check for Scarlett specifically by user_id
    const scarlettUser = await base44.asServiceRole.entities.User.filter({ email: 'kellymilton02@gmail.com' });
    console.log('Scarlett user:', scarlettUser[0] ? {
      id: scarlettUser[0].id,
      email: scarlettUser[0].email,
      family_group_id: scarlettUser[0].family_group_id,
    } : null);

    if (scarlettUser[0]) {
      const scarlettProfiles = await base44.asServiceRole.entities.GamificationProfile.filter({ user_id: scarlettUser[0].id });
      console.log('Scarlett profiles:', scarlettProfiles.map(p => ({
        user_id: p.user_id,
        family_member_name: p.family_member_name,
        family_group_id: p.family_group_id,
      })));
    }

    return Response.json({
      familyGroupId,
      profilesInFamily: allProfiles.map(p => ({
        user_id: p.user_id,
        family_member_name: p.family_member_name,
        family_group_id: p.family_group_id,
      })),
      scarlettUserId: scarlettUser[0]?.id,
      scarlettFamilyGroupId: scarlettUser[0]?.family_group_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});