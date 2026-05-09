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

    // Get Tom's family member record
    const tomMembers = await base44.asServiceRole.entities.FamilyMember.filter({
      family_group_id: user.family_group_id,
      name: "Tom"
    });

    if (tomMembers.length === 0) {
      return Response.json({ error: 'Tom not found' }, { status: 404 });
    }

    const tomId = tomMembers[0].id;

    // Get all completion history where task was completed by Tom
    const allCompletions = await base44.asServiceRole.entities.CompletionHistory.list();
    const tomCompletions = allCompletions.filter(c => c.family_member_name === "Tom");

    let updated = 0;
    
    // Update each completion to ensure it's assigned to Tom's family member ID
    for (const completion of tomCompletions) {
      if (completion.family_member_id !== tomId) {
        await base44.asServiceRole.entities.CompletionHistory.update(
          completion.id,
          {
            family_member_id: tomId,
            family_member_name: "Tom"
          }
        );
        updated++;
      }
    }

    return Response.json({ 
      success: true, 
      tom_id: tomId,
      completions_reassigned: updated,
      total_tom_completions: tomCompletions.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});