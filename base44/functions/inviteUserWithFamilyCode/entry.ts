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

    // Send email with family invite code first
    const appUrl = 'https://homelifefocus.base44.app';
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `You're invited to HomeLifeFocus - Code: ${invite_code}`,
        body: `You've been invited to join HomeLifeFocus!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nFamily Invite Code: ${invite_code}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSteps to join:\n1. Go to: ${appUrl}\n2. Sign up with your email (${email})\n3. Enter the family invite code above on the join screen\n4. Choose your display name\n\nYou'll be part of the family immediately!\n\nIf you have any questions, reply to this email.`
      });
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      return Response.json({ error: `Email failed: ${emailError.message}` }, { status: 500 });
    }

    // Create a FamilyMember placeholder for the invited email (after email succeeds)
    await base44.asServiceRole.entities.FamilyMember.create({
      family_group_id: familyGroup.id,
      name: email.split('@')[0],
      linked_user_email: email,
      avatar_color: 'blue',
    });

    return Response.json({ success: true, message: 'Invite sent successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});