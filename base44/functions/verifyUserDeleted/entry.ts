import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { email } = await req.json();

    const [tasks, profiles, completions, members, families] = await Promise.all([
      base44.asServiceRole.entities.Task.filter({ created_by: email }).catch(() => []),
      base44.asServiceRole.entities.GamificationProfile.filter({ family_member_name: email }).catch(() => []),
      base44.asServiceRole.entities.CompletionHistory.filter({ family_member_id: email }).catch(() => []),
      base44.asServiceRole.entities.FamilyMember.filter({ linked_user_email: email }).catch(() => []),
      base44.asServiceRole.entities.FamilyGroup.filter({ owner_email: email }).catch(() => []),
    ]);

    const isDeleted = tasks.length === 0 && profiles.length === 0 && completions.length === 0 && members.length === 0 && families.length === 0;

    return Response.json({
      email,
      isDeleted,
      remaining: {
        tasks: tasks.length,
        profiles: profiles.length,
        completions: completions.length,
        members: members.length,
        families: families.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});