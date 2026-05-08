import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.family_group_id) {
      return Response.json({ users: [] });
    }

    // Get all family members and extract linked user emails
    const familyMembers = await base44.asServiceRole.entities.FamilyMember.filter({ 
      family_group_id: user.family_group_id 
    });

    const linkedEmails = familyMembers
      .filter(m => m.linked_user_email)
      .map(m => m.linked_user_email);

    // Return current user + linked users info
    const users = [user];
    
    // Fetch linked users by email (one at a time since we can't query by email list)
    for (const email of linkedEmails) {
      try {
        const linkedUser = await base44.asServiceRole.entities.User.filter({ email });
        if (linkedUser.length > 0) {
          users.push(linkedUser[0]);
        }
      } catch (err) {
        console.error(`Failed to fetch user ${email}:`, err);
      }
    }

    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});