import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ members: [] });

    const body = await req.json().catch(() => ({}));
    
    // Use passed family_group_id if provided (most reliable), otherwise resolve from token
    let familyGroupId = body.family_group_id || user.family_group_id || null;

    // If still no family_group_id, check if user owns a group or is linked via a member record
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) {
        familyGroupId = ownedGroup.id;
      } else {
        const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
        const match = allMembers.find(m => m.linked_user_email?.toLowerCase() === user.email?.toLowerCase());
        if (match?.family_group_id) familyGroupId = match.family_group_id;
      }
    }

    if (!familyGroupId) return Response.json({ members: [] });

    // Try user-scoped first (works when user has correct family_group_id in token)
    // If that fails or returns nothing, use service role as fallback
    let members = [];
    try {
      const all = await base44.entities.FamilyMember.filter({ family_group_id: familyGroupId }, '-created_date', 200);
      members = all;
    } catch (_) {
      // User-scoped failed, try service role
      const allSR = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
      members = allSR.filter(m => m.family_group_id === familyGroupId);
    }

    return Response.json({ members });
  } catch (error) {
    console.error('[getFamilyMembers] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});