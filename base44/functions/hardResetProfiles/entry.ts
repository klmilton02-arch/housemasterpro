import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Delete ALL profiles everywhere
    const all = await base44.asServiceRole.entities.GamificationProfile.list('-created_date', 500);
    for (const p of all) {
      await base44.asServiceRole.entities.GamificationProfile.delete(p.id);
    }

    const correctGroupId = '6a022b2d26729cca52dd5fb0';

    // Recreate exactly 3 correct profiles with restored stats
    const profiles = [
      {
        family_group_id: correctGroupId,
        family_member_id: '6a020910140348ba3c446f0e',
        family_member_name: 'Kelly',
        linked_user_id: '69dbef90b0bb680f2754a0d4',
        linked_user_email: 'klmilton02@gmail.com',
        total_xp: 214,
        level: 3,
        badges: ['first_task', 'cleaning_streak_7', 'task_master'],
        total_completions: 21,
        deep_cleaning_completions: 0,
        overdue_completions: 1,
        maintenance_completions: 0,
        bill_completions: 0,
        cleaning_streak: 1,
        last_cleaning_date: '2026-05-16',
        bill_months_ontime: 0,
        all_rounder_weeks: 0,
      },
      {
        family_group_id: correctGroupId,
        family_member_id: '69ff72f32a507e74cf24556e',
        family_member_name: 'Tom',
        linked_user_id: '69ff6e1e8f693f5c7c4845a8',
        linked_user_email: 'thomasdugger1@gmail.com',
        total_xp: 6,
        level: 1,
        badges: ['first_task'],
        total_completions: 3,
        deep_cleaning_completions: 0,
        overdue_completions: 0,
        maintenance_completions: 0,
        bill_completions: 0,
        cleaning_streak: 3,
        last_cleaning_date: '2026-05-12',
        bill_months_ontime: 0,
        all_rounder_weeks: 0,
      },
      {
        family_group_id: correctGroupId,
        family_member_id: '69ff72e44a5f554b3feae789',
        family_member_name: 'Scarlett',
        linked_user_id: '69fe65abb930a88310729a4a',
        linked_user_email: 'kellymilton02@gmail.com',
        total_xp: 30,
        level: 1,
        badges: ['first_task'],
        total_completions: 1,
        deep_cleaning_completions: 0,
        overdue_completions: 0,
        maintenance_completions: 1,
        bill_completions: 0,
        cleaning_streak: 0,
        bill_months_ontime: 0,
        all_rounder_weeks: 0,
      },
    ];

    const created = [];
    for (const p of profiles) {
      const result = await base44.asServiceRole.entities.GamificationProfile.create(p);
      created.push({ id: result.id, name: p.family_member_name, xp: p.total_xp });
    }

    return Response.json({ deleted_count: all.length, created_count: created.length, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});