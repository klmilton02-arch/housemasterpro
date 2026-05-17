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
      return Response.json({ profiles: [], members: [], solo: true, currentUser: user });
    }

    // Fetch members via service role (needs broad access)
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list('', 5000);
    const familyMembers = allMembers.filter(m => m.family_group_id === familyGroupId);

    // Fetch ALL profiles via service role with a large limit
    // Use filter by family_group_id directly
    const allProfilesPage1 = await base44.asServiceRole.entities.GamificationProfile.filter({ family_group_id: familyGroupId }, '-total_xp', 5000);
    // Also get any profiles created by the user (in case RLS stored them differently)
    const allProfilesPage2 = await base44.entities.GamificationProfile.list('-total_xp', 5000);

    // Merge both result sets
    const allProfilesMap = new Map();
    for (const p of [...allProfilesPage1, ...allProfilesPage2]) {
      const existing = allProfilesMap.get(p.id);
      if (!existing) allProfilesMap.set(p.id, p);
    }

    const rawFamilyProfiles = Array.from(allProfilesMap.values()).filter(p => p.family_group_id === familyGroupId);

    // Deduplicate: per family_member_id, keep the one with highest XP
    const profileMap = new Map();
    for (const profile of rawFamilyProfiles) {
      const existing = profileMap.get(profile.family_member_id);
      if (!existing || (profile.total_xp || 0) > (existing.total_xp || 0)) {
        profileMap.set(profile.family_member_id, profile);
      }
    }
    const familyProfiles = Array.from(profileMap.values()).sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));

    // Delete any stale duplicates (best effort)
    const keepIds = new Set(familyProfiles.map(p => p.id));
    const staleProfiles = rawFamilyProfiles.filter(p => !keepIds.has(p.id));
    for (const stale of staleProfiles) {
      try { await base44.asServiceRole.entities.GamificationProfile.delete(stale.id); } catch (e) {}
    }

    return Response.json({
      profiles: familyProfiles,
      members: familyMembers,
      solo: false,
      currentUser: { ...user, family_group_id: familyGroupId }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});