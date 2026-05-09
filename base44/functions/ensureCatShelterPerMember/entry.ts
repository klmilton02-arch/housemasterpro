import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Get all family members
    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id
    });

    const results = [];

    // For each member, ensure they have at least one cat
    for (const member of members) {
      const existingCats = await base44.asServiceRole.entities.CatShelter.filter({
        family_member_id: member.id
      });

      if (existingCats.length === 0) {
        // Create a default cat for this member
        const cat = await base44.asServiceRole.entities.CatShelter.create({
          family_member_id: member.id,
          family_member_name: member.name,
          family_group_id: user.family_group_id,
          cat_name: `${member.name}'s Cat`,
          cat_fur: "orange",
          health: 100,
          is_home: true
        });
        results.push({ member: member.name, status: "cat_created", cat_id: cat.id });
      } else {
        results.push({ member: member.name, status: "cat_exists", count: existingCats.length });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});