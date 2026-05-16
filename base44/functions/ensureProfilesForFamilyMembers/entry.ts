import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyGroupId = user.family_group_id;

    if (!familyGroupId) {
      return Response.json({ error: 'No family group found' }, { status: 400 });
    }

    // Get all family members in the group
    const members = await base44.asServiceRole.entities.FamilyMember.filter({ family_group_id: familyGroupId });

    // Use service role to get ALL existing profiles (bypasses RLS so we don't create duplicates)
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-created_date', 500);
    
    // Only consider profiles for this family group
    const groupProfiles = allProfiles.filter(p => p.family_group_id === familyGroupId);
    const existingMemberIds = new Set(groupProfiles.map(p => p.family_member_id));

    // Valid member IDs for this group
    const validMemberIds = new Set(members.map(m => m.id));

    // Create missing profiles only for valid members
    const created = [];
    for (const member of members) {
      if (!existingMemberIds.has(member.id) && validMemberIds.has(member.id)) {
        const newProfile = await base44.asServiceRole.entities.GamificationProfile.create({
          family_group_id: familyGroupId,
          family_member_id: member.id,
          family_member_name: member.name,
          total_xp: 0,
          level: 1,
          badges: [],
          total_completions: 0
        });
        created.push({ member_id: member.id, member_name: member.name, profile_id: newProfile.id });
      }
    }

    return Response.json({
      success: true,
      message: `Created ${created.length} profiles`,
      created,
      existing_count: groupProfiles.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});