import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find eforest2000's family group
    const families = await base44.asServiceRole.entities.FamilyGroup.filter({
      owner_email: 'eforest2000@gmail.com'
    });

    if (families.length === 0) {
      return Response.json({ error: 'eforest2000 family group not found' }, { status: 404 });
    }

    const familyGroup = families[0];

    // Find Tom in this family group
    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: familyGroup.id,
      name: 'Tom'
    });

    if (members.length === 0) {
      return Response.json({ error: 'Tom not found in eforest2000 family' }, { status: 404 });
    }

    // Delete Tom
    await base44.asServiceRole.entities.FamilyMember.delete(members[0].id);

    return Response.json({ success: true, message: 'Tom removed from eforest2000 family' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});