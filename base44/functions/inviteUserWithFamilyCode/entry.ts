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

    // Authorization: only family owner or admin can invite users
    if (familyGroup.owner_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Only family owner can invite members' }, { status: 403 });
    }

    // Send email with family invite code using Gmail API
    const appUrl = 'https://homelifefocus.base44.app';
    const joinUrl = `${appUrl}/join-family?code=${invite_code}`;
    try {
      console.log(`Attempting to send email to: ${email}`);
      
      // Get Gmail access token via the app builder's Google connection
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

      const emailHtml = `<p>Hi there!</p><p>You've been invited to join a family on <strong>HomeLifeFocus</strong>!</p><p style="text-align:center;margin:24px 0"><a href="${joinUrl}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Join Family →</a></p><p>Or visit this link directly:<br><a href="${joinUrl}">${joinUrl}</a></p><p>Your invite code is: <strong>${invite_code}</strong></p><p>The link will take you straight to the sign-in page. After logging in, the code will be filled in automatically.</p><p>Enjoy!<br>The HomeLifeFocus Team</p>`;

      // Create MIME message
      const mimeMessage = [
        `To: ${email}`,
        `Subject: Join your family in HomeLifeFocus - Code: ${invite_code}`,
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        '',
        emailHtml
      ].join('\n');

      const encodedMessage = btoa(unescape(encodeURIComponent(mimeMessage))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const sendResult = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage
        })
      });
      
      if (!sendResult.ok) {
        const error = await sendResult.json();
        console.error("Gmail API error:", error);
        throw new Error(`Gmail error: ${error.error?.message || JSON.stringify(error)}`);
      }
      
      const data = await sendResult.json();
      console.log(`Email sent successfully via Gmail:`, data.id);
    } catch (err) {
      console.error(`Email error:`, err?.message || JSON.stringify(err));
      throw err;
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