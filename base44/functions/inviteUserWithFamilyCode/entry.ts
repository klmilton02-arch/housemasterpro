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

    // Invite the user
    await base44.users.inviteUser(email, role);

    // Send custom email with invite code
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: "You're invited to HomeLifeFocus",
      body: `You've been invited to join HomeLifeFocus!\n\nFamily Invite Code: ${invite_code}\n\nUse this code when you sign up to join the family group.`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});