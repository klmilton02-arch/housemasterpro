import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Triggered when a new User is created.
// If their email matches a FamilyMember's linked_user_email,
// auto-assign them to that family group and set account_type to 'family'.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const newUser = payload.data;
    if (!newUser?.email) {
      return Response.json({ skipped: 'no email' });
    }

    // Find a FamilyMember whose linked_user_email matches this new user
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    const matchingMember = allMembers.find(
      m => m.linked_user_email?.toLowerCase() === newUser.email.toLowerCase()
    );

    if (!matchingMember) {
      return Response.json({ skipped: 'no matching family member', email: newUser.email });
    }

    const familyGroupId = matchingMember.family_group_id;
    if (!familyGroupId) {
      return Response.json({ skipped: 'member has no family_group_id', member: matchingMember.name });
    }

    // Update the new user's family_group_id and account_type
    await base44.asServiceRole.entities.User.update(newUser.id, {
      family_group_id: familyGroupId,
      account_type: 'family',
    });

    // Also link the member to this user's ID
    await base44.asServiceRole.entities.FamilyMember.update(matchingMember.id, {
      linked_user_id: newUser.id,
    });

    return Response.json({
      success: true,
      message: `${newUser.email} auto-joined family ${familyGroupId} as member "${matchingMember.name}"`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});