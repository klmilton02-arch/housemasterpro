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

    const mappings = [
      { name: "Tom", email: "thomasdugger1@gmail.com" },
      { name: "Scarlett", email: "kellymilton02@gmail.com" },
      { name: "Kelly", email: "klmilton02@gmail.com" }
    ];

    const results = [];

    for (const mapping of mappings) {
      // Find family member
      const members = await base44.asServiceRole.entities.FamilyMember.filter({
        family_group_id: user.family_group_id,
        name: mapping.name
      });

      if (members.length === 0) {
        results.push({ name: mapping.name, status: "member_not_found" });
        continue;
      }

      const member = members[0];

      // Update member with linked email
      await base44.asServiceRole.entities.FamilyMember.update(member.id, {
        linked_user_email: mapping.email
      });

      results.push({ name: mapping.name, member_id: member.id, email: mapping.email, status: "linked" });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});