import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const mappings = [
      { name: "Tom", email: "thomasdugger1@gmail.com" },
      { name: "Scarlett", email: "kellymilton02@gmail.com" },
      { name: "Kelly", email: "klmilton02@gmail.com" }
    ];

    const results = [];

    for (const mapping of mappings) {
      // Get all members with this name
      const allMembers = await base44.asServiceRole.entities.FamilyMember.filter({
        family_group_id: user.family_group_id,
        name: mapping.name
      });

      if (allMembers.length === 0) {
        results.push({ name: mapping.name, status: "not_found" });
        continue;
      }

      if (allMembers.length === 1) {
        // Update single member with correct email if needed
        const member = allMembers[0];
        if (member.linked_user_email !== mapping.email) {
          await base44.asServiceRole.entities.FamilyMember.update(member.id, {
            linked_user_email: mapping.email
          });
        }
        results.push({ name: mapping.name, status: "single", member_id: member.id });
        continue;
      }

      // Multiple members with same name - keep the one with correct email, delete others
      let targetMember = allMembers.find(m => m.linked_user_email === mapping.email);
      
      if (!targetMember) {
        // If none have the correct email, keep first and update it
        targetMember = allMembers[0];
        await base44.asServiceRole.entities.FamilyMember.update(targetMember.id, {
          linked_user_email: mapping.email
        });
      }

      // Delete all other duplicates
      let deleted = 0;
      for (const member of allMembers) {
        if (member.id !== targetMember.id) {
          await base44.asServiceRole.entities.FamilyMember.delete(member.id);
          deleted++;
        }
      }

      results.push({ name: mapping.name, status: "consolidated", member_id: targetMember.id, deleted_count: deleted });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});