import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role, invite_code } = await req.json();

    if (!email || !role || !invite_code) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the family group by invite code
    const families = await base44.asServiceRole.entities.FamilyGroup.filter({ 
      invite_code: invite_code.toUpperCase() 
    });
    
    if (families.length === 0) {
      return Response.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    const familyGroup = families[0];

    // Create a FamilyMember placeholder for the invited email
    await base44.asServiceRole.entities.FamilyMember.create({
      family_group_id: familyGroup.id,
      name: email.split('@')[0],
      linked_user_email: email,
      avatar_color: 'blue',
    });

    // Send email with family invite code
    const appUrl = 'https://homelifefocus.base44.app';
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: "You're invited to HomeLifeFocus",
      body: `You've been invited to join HomeLifeFocus!\n\nFamily Invite Code: ${invite_code}\n\n1. Go to: ${appUrl}\n2. Sign up with this email\n3. Enter this family invite code on the join screen\n4. Choose your display name\n\nYou'll be part of the family immediately!`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});