import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.clone().json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ members: [] });

    let familyGroupId = body.family_group_id || user.family_group_id || null;

    // If no family_group_id on token, look it up from FamilyGroup (owned)
    if (!familyGroupId) {
      const groups = await base44.asServiceRole.entities.FamilyGroup.list();
      const owned = groups.find(g => g.owner_email === user.email);
      if (owned) familyGroupId = owned.id;
    }

    if (!familyGroupId) return Response.json({ members: [] });

    // Read using user's own token - RLS allows family members with matching family_group_id
    const members = await base44.entities.FamilyMember.filter({ family_group_id: familyGroupId }, '-created_date', 200);

    console.log(`[getFamilyMembers] user=${user.email} fgId=${familyGroupId} found=${members.length}`);
    return Response.json({ members });
  } catch (error) {
    console.error('[getFamilyMembers] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});