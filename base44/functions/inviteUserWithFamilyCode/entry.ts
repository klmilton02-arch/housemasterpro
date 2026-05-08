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

    // Send email with family invite code using IONOS
    const appUrl = 'https://homelifefocus.base44.app';
    try {
      console.log(`Attempting to send email to: ${email}`);
      const ionosApiKey = Deno.env.get('sendingemaildebe5e1ddeba43cab0b4a85c211e6112');
      const sendResult = await fetch('https://api.ionos.com/v1/mail/smtp/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ionosApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [email],
          subject: `Join your family in HomeLifeFocus - Code: ${invite_code}`,
          textBody: `You've been invited to join HomeLifeFocus!\n\nCode: ${invite_code}\n\nHow to join:\n1. Visit ${appUrl}\n2. Sign up with your email (${email})\n3. On the join screen, enter the code above\n4. Choose your display name\n5. Start managing household tasks with your family!\n\nQuestions? Reply to this email.\n\nEnjoy!\nThe HomeLifeFocus Team`,
          htmlBody: `<p>Hi there!</p><p>You've been invited to join HomeLifeFocus!</p><hr><h2 style="text-align:center">${invite_code}</h2><hr><p><strong>How to join:</strong></p><ol><li>Visit <a href="${appUrl}">${appUrl}</a></li><li>Sign up with your email (${email})</li><li>On the join screen, enter the code above</li><li>Choose your display name</li><li>Start managing household tasks with your family!</li></ol><p>Questions? Reply to this email.</p><p>Enjoy!<br>The HomeLifeFocus Team</p>`
        })
      });
      
      if (!sendResult.ok) {
        const error = await sendResult.json();
        console.error("IONOS API error:", error);
        throw new Error(`IONOS error: ${error.message || JSON.stringify(error)}`);
      }
      const data = await sendResult.json();
      console.log(`Email send result:`, data);
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