import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'File URL required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    // Single LLM call to detect and extract everything
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Look at this image carefully. It may contain any combination of:
- An appointment reminder or card (doctor, dentist, mechanic, etc.)
- A bill or invoice (utility, phone, internet, insurance, subscription, etc.)
- A handwritten or printed to-do list or task list

Extract ALL information you can see. Current year is ${currentYear}.

For appointments: extract the name/doctor, date (YYYY-MM-DD), time (HH:MM in 24-hour), and location.
For bills: extract the company/provider name, what type of bill it is, what day of the month it's due (1-28), any full due date (YYYY-MM-DD), and the amount owed.
For tasks/to-do items: extract each individual task as a separate item with its name and any notes.

Return a flat JSON object with these fields:
- has_appointment: true or false
- appt_name: name or doctor name (string or null)
- appt_date: date in YYYY-MM-DD (string or null)
- appt_time: time in HH:MM 24h (string or null)
- appt_location: location (string or null)
- appt_notes: any extra notes (string or null)
- has_bill: true or false
- bill_provider: company name (string or null)
- bill_type: type of bill like "Electric", "Phone", "Internet", "Insurance" (string or null)
- bill_due_day: day of month as number 1-28 (number or null)
- bill_due_date: full date YYYY-MM-DD if shown (string or null)
- bill_amount: amount as string like "$45.00" (string or null)
- has_tasks: true or false
- task_list: array of objects with "name" and "notes" fields`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          has_appointment: { type: 'boolean' },
          appt_name: { type: 'string' },
          appt_date: { type: 'string' },
          appt_time: { type: 'string' },
          appt_location: { type: 'string' },
          appt_notes: { type: 'string' },
          has_bill: { type: 'boolean' },
          bill_provider: { type: 'string' },
          bill_type: { type: 'string' },
          bill_due_day: { type: 'number' },
          bill_due_date: { type: 'string' },
          bill_amount: { type: 'string' },
          has_tasks: { type: 'boolean' },
          task_list: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const r = extractionResult;
    const createdTasks = [];

    // --- Appointment ---
    if (r.has_appointment && r.appt_date) {
      const taskName = r.appt_name ? `Appointment: ${r.appt_name}` : 'Appointment';
      const descParts = [];
      if (r.appt_time) descParts.push(`Time: ${r.appt_time}`);
      if (r.appt_location) descParts.push(`Location: ${r.appt_location}`);
      if (r.appt_notes) descParts.push(r.appt_notes);

      const taskData = {
        name: taskName,
        category: 'Personal',
        priority: 'Medium',
        difficulty: 'Easy',
        frequency_days: 9999,
        overdue_grace_days: 999,
        next_due_date: r.appt_date,
        start_date: r.appt_date,
        status: 'Pending',
        description: descParts.join(' | ') || undefined,
        family_group_id: user.family_group_id || null
      };

      const task = await base44.entities.Task.create(taskData);
      createdTasks.push({ type: 'appointment', task });

      // Try sync to Google Calendar
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        const calBody = {
          summary: taskName,
          description: taskData.description || undefined,
          start: r.appt_time
            ? { dateTime: `${r.appt_date}T${r.appt_time}:00`, timeZone: 'America/Los_Angeles' }
            : { date: r.appt_date },
          end: r.appt_time
            ? { dateTime: `${r.appt_date}T${r.appt_time}:00`, timeZone: 'America/Los_Angeles' }
            : { date: r.appt_date }
        };
        const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(calBody)
        });
        if (calRes.ok) {
          const calEvent = await calRes.json();
          await base44.entities.Task.update(task.id, { calendar_event_id: calEvent.id });
        }
      } catch (calErr) {
        console.error('Calendar sync failed:', calErr.message);
      }
    }

    // --- Bill ---
    if (r.has_bill && (r.bill_provider || r.bill_type)) {
      const taskName = [r.bill_provider, r.bill_type ? `${r.bill_type} Bill` : null].filter(Boolean).join(' - ');
      const descParts = [];
      if (r.bill_amount) descParts.push(`Amount: ${r.bill_amount}`);

      let nextDueDate = r.bill_due_date || today;
      if (!r.bill_due_date && r.bill_due_day) {
        const now = new Date();
        let candidate = new Date(now.getFullYear(), now.getMonth(), r.bill_due_day);
        if (candidate < now) candidate = new Date(now.getFullYear(), now.getMonth() + 1, r.bill_due_day);
        nextDueDate = candidate.toISOString().split('T')[0];
      }

      const taskData = {
        name: taskName || 'Bill',
        category: 'Bills',
        priority: 'Medium',
        difficulty: 'Easy',
        frequency_days: 30,
        bill_day_of_month: r.bill_due_day || undefined,
        next_due_date: nextDueDate,
        start_date: nextDueDate,
        status: 'Pending',
        description: descParts.join(' | ') || undefined,
        family_group_id: user.family_group_id || null
      };

      const task = await base44.entities.Task.create(taskData);
      createdTasks.push({ type: 'bill', task });
    }

    // --- Handwritten tasks ---
    if (r.has_tasks && Array.isArray(r.task_list)) {
      for (const item of r.task_list) {
        if (!item.name) continue;
        const task = await base44.entities.Task.create({
          name: item.name,
          category: 'Personal',
          priority: 'Medium',
          difficulty: 'Easy',
          frequency_days: 9999,
          overdue_grace_days: 999,
          next_due_date: today,
          start_date: today,
          status: 'Pending',
          description: item.notes || undefined,
          family_group_id: user.family_group_id || null
        });
        createdTasks.push({ type: 'task', task });
      }
    }

    if (createdTasks.length === 0) {
      return Response.json({ error: 'Could not extract any recognizable content from the image.' }, { status: 400 });
    }

    return Response.json({
      success: true,
      extracted: r,
      created_tasks: createdTasks
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});