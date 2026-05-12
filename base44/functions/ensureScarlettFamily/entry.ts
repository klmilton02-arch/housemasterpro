import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find Scarlett's user record
    const allUsers = await base44.asServiceRole.entities.User.list();
    const scarlett = allUsers.find(u => u.email === 'kellymilton02@gmail.com');
    
    if (!scarlett) {
      return Response.json({ error: 'Scarlett not found' }, { status: 400 });
    }

    // Find the family group that has a member linked to Scarlett
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    const scarlettMember = allMembers.find(
      m => m.linked_user_email?.toLowerCase() === 'kellymilton02@gmail.com'
    );

    if (!scarlettMember?.family_group_id) {
      return Response.json({ error: 'Scarlett family member not found' }, { status: 400 });
    }

    // Update Scarlett's user record
    await base44.asServiceRole.entities.User.update(scarlett.id, {
      family_group_id: scarlettMember.family_group_id,
      account_type: 'family',
    });

    return Response.json({ 
      success: true,
      scarlett_id: scarlett.id,
      family_group_id: scarlettMember.family_group_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});