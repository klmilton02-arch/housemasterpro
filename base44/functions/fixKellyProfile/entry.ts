import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find Kelly member
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    const kellyMember = allMembers.find(m => m.name === 'Kelly');
    
    if (!kellyMember) {
      return Response.json({ error: 'Kelly member not found' });
    }

    // Find Kelly profile
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list();
    const kellyProfile = allProfiles.find(p => p.family_member_id === kellyMember.id);
    
    if (!kellyProfile) {
      return Response.json({ error: 'Kelly profile not found' });
    }

    // Update profile with family_group_id
    await base44.asServiceRole.entities.GamificationProfile.update(kellyProfile.id, {
      family_group_id: kellyMember.family_group_id,
    });

    return Response.json({
      success: true,
      message: 'Updated Kelly profile with family_group_id',
      profile_id: kellyProfile.id,
      family_group_id: kellyMember.family_group_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});