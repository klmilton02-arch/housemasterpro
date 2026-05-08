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
    try {
      console.log(`Attempting to send email to: ${email}`);
      
      // Get Gmail access token via the app builder's Google connection
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      
      const emailText = `You've been invited to join HomeLifeFocus!\n\nCode: ${invite_code}\n\nHow to join:\n1. Visit ${appUrl}\n2. Sign up with your email (${email})\n3. On the join screen, enter the code above\n4. Choose your display name\n5. Start managing household tasks with your family!\n\nQuestions? Reply to this email.\n\nEnjoy!\nThe HomeLifeFocus Team`;

      const emailHtml = `<p>Hi there!</p><p>You've been invited to join HomeLifeFocus!</p><hr><h2 style="text-align:center">${invite_code}</h2><hr><p><strong>How to join:</strong></p><ol><li>Visit <a href="${appUrl}">${appUrl}</a></li><li>Sign up with your email (${email})</li><li>On the join screen, enter the code above</li><li>Choose your display name</li><li>Start managing household tasks with your family!</li></ol><p>Questions? Reply to this email.</p><p>Enjoy!<br>The HomeLifeFocus Team</p>`;

      // Create MIME message
      const mimeMessage = [
        `To: ${email}`,
        `Subject: Join your family in HomeLifeFocus - Code: ${invite_code}`,
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        '',
        emailHtml
      ].join('\n');

      const encodedMessage = btoa(mimeMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

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