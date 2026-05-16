import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const correctGroupId = '6a022b2d26729cca52dd5fb0';

    // The correct member IDs and their linked user IDs
    const correctMembers = [
      { member_id: '6a020910140348ba3c446f0e', name: 'Kelly', linked_user_id: '69dbef90b0bb680f2754a0d4', linked_user_email: 'klmilton02@gmail.com' },
      { member_id: '69ff72f32a507e74cf24556e', name: 'Tom', linked_user_id: '69ff6e1e8f693f5c7c4845a8', linked_user_email: 'thomasdugger1@gmail.com' },
      { member_id: '69ff72e44a5f554b3feae789', name: 'Scarlett', linked_user_id: '69fe65abb930a88310729a4a', linked_user_email: 'kellymilton02@gmail.com' },
    ];

    const correctMemberIds = correctMembers.map(m => m.member_id);

    // Get all profiles
    const all = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 500);

    // Delete all profiles that are NOT in the correct group or NOT a correct member_id
    const toDelete = all.filter(p =>
      p.family_group_id !== correctGroupId || !correctMemberIds.includes(p.family_member_id)
    );

    const deleted = [];
    for (const p of toDelete) {
      await base44.asServiceRole.entities.GamificationProfile.delete(p.id);
      deleted.push({ id: p.id, name: p.family_member_name, member_id: p.family_member_id, group: p.family_group_id });
    }

    // Now verify remaining profiles and update their linked_user_id/email
    const remaining = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 500);
    const updated = [];
    for (const m of correctMembers) {
      const profile = remaining.find(p => p.family_member_id === m.member_id);
      if (profile) {
        await base44.asServiceRole.entities.GamificationProfile.update(profile.id, {
          linked_user_id: m.linked_user_id,
          linked_user_email: m.linked_user_email,
          family_member_name: m.name,
          family_group_id: correctGroupId,
        });
        updated.push({ id: profile.id, name: m.name, xp: profile.total_xp });
      }
    }

    return Response.json({ deleted_count: deleted.length, deleted, remaining_count: remaining.length, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});