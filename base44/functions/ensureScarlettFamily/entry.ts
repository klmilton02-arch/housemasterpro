import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find Scarlett's user record by email
    const allUsers = await base44.asServiceRole.entities.User.list();
    const scarlett = allUsers.find(u => u.email === 'kellymilton02@gmail.com');
    
    if (!scarlett) {
      return Response.json({ error: 'Scarlett not found' }, { status: 400 });
    }

    // Find the FamilyGroup (should have one group with members)
    const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
    const familyGroup = allGroups[0]; // Just get the first/main family group
    
    if (!familyGroup?.id) {
      return Response.json({ error: 'Family group not found' }, { status: 400 });
    }

    // Update Scarlett's user record
    await base44.asServiceRole.entities.User.update(scarlett.id, {
      family_group_id: familyGroup.id,
      account_type: 'family',
    });

    return Response.json({ 
      success: true,
      scarlett_id: scarlett.id,
      family_group_id: familyGroup.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});