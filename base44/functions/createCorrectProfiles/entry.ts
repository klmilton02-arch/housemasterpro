import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const familyGroupId = '6a022b2d26729cca52dd5fb0';

    const members = [
      { id: '6a020910140348ba3c446f0e', name: 'Kelly' },
      { id: '69ff72f32a507e74cf24556e', name: 'Tom' },
      { id: '69ff72e44a5f554b3feae789', name: 'Scarlett' },
    ];

    // Delete any existing profiles for this group first
    const existing = await base44.asServiceRole.entities.GamificationProfile.list('-created_date', 500);
    const toDelete = existing.filter(p => p.family_group_id === familyGroupId || members.some(m => m.id === p.family_member_id));
    for (const p of toDelete) {
      await base44.asServiceRole.entities.GamificationProfile.delete(p.id);
    }

    // Create one clean profile per member
    const created = [];
    for (const m of members) {
      const profile = await base44.asServiceRole.entities.GamificationProfile.create({
        family_group_id: familyGroupId,
        family_member_id: m.id,
        family_member_name: m.name,
        total_xp: 0,
        level: 1,
        badges: [],
        total_completions: 0,
        deep_cleaning_completions: 0,
        overdue_completions: 0,
        maintenance_completions: 0,
        bill_completions: 0,
        cleaning_streak: 0,
        bill_months_ontime: 0,
        all_rounder_weeks: 0,
      });
      created.push({ id: profile.id, name: m.name, member_id: m.id });
    }

    return Response.json({ success: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});