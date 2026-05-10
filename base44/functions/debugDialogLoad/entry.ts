import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const results = {};

    try {
      const presets = await base44.entities.PresetTask.list();
      results.presets = { success: true, count: presets.length };
    } catch (err) {
      results.presets = { success: false, error: err.message };
    }

    try {
      const members = await base44.entities.FamilyMember.list();
      results.familyMembers = { success: true, count: members.length };
    } catch (err) {
      results.familyMembers = { success: false, error: err.message };
    }

    return Response.json({ user: { id: user.id, email: user.email, family_group_id: user.family_group_id }, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});