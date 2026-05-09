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

    const mappings = {
      "Tom": "thomasdugger1@gmail.com",
      "Scarlett": "kellymilton02@gmail.com",
      "Kelly": "klmilton02@gmail.com"
    };

    // Get all family members for current user's family group
    const members = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id
    });

    const results = [];

    // For each target name, update the members with correct linked email
    for (const [targetName, targetEmail] of Object.entries(mappings)) {
      // Find all members with this name
      const membersWithName = members.filter(m => m.name === targetName);
      
      if (membersWithName.length === 0) {
        results.push({ name: targetName, status: "not found" });
        continue;
      }

      if (membersWithName.length === 1) {
        // Already unique, just ensure the email is linked
        await base44.asServiceRole.entities.FamilyMember.update(
          membersWithName[0].id,
          { linked_user_email: targetEmail }
        );
        results.push({ name: targetName, id: membersWithName[0].id, status: "updated" });
      } else {
        // Multiple with same name - keep first, delete rest
        const [first, ...duplicates] = membersWithName;
        
        // Update first with correct email
        await base44.asServiceRole.entities.FamilyMember.update(
          first.id,
          { linked_user_email: targetEmail }
        );
        results.push({ 
          name: targetName, 
          id: first.id, 
          status: "updated", 
          duplicatesDeleted: duplicates.length 
        });

        // Delete duplicates
        for (const dup of duplicates) {
          await base44.asServiceRole.entities.FamilyMember.delete(dup.id);
        }
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});