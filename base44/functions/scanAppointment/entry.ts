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

    // Use InvokeLLM with vision to extract all data
    const raw = await base44.integrations.Core.InvokeLLM({
      prompt: `You are analyzing an image. The image may show an appointment card, a bill/invoice, a handwritten to-do list, or any combination.

Current year: ${currentYear}. Today: ${today}.

Please extract everything you can see. Return a JSON object with ALL of these fields (use null if not found):

{
  "has_appointment": true/false,
  "appt_name": "name of doctor/provider/service",
  "appt_date": "YYYY-MM-DD",
  "appt_time": "HH:MM in 24h format",
  "appt_location": "address or place name",
  "appt_notes": "any other relevant details",
  "has_bill": true/false,
  "bill_provider": "company name",
  "bill_type": "e.g. Electric, Water, Phone, Internet, Insurance",
  "bill_due_day": 15,
  "bill_due_date": "YYYY-MM-DD",
  "bill_amount": "$XX.XX",
  "has_tasks": true/false,
  "task_list": [{"name": "task name", "notes": "optional notes"}]
}

Be generous — if you see ANY date-related content, set has_appointment to true and fill in appt_date. If you see any bill or payment info, set has_bill to true. If you see any list items or to-dos, set has_tasks to true.`,
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

    console.log('LLM extraction result:', JSON.stringify(raw));

    const r = raw;
    const createdTasks = [];

    // --- Appointment ---
    if (r.has_appointment && r.appt_date) {
      const taskName = r.appt_name ? `Appointment: ${r.appt_name}` : 'Appointment';
      const descParts = [];
      if (r.appt_time) descParts.push(`Time: ${r.appt_time}`);
      if (r.appt_location) descParts.push(`Location: ${r.appt_location}`);
      if (r.appt_notes) descParts.push(r.appt_notes);

      const task = await base44.entities.Task.create({
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
      });
      createdTasks.push({ type: 'appointment', task });

      // Try sync to Google Calendar
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        const calBody = {
          summary: taskName,
          description: descParts.join(' | ') || undefined,
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
      const taskName = [r.bill_provider, r.bill_type ? `${r.bill_type} Bill` : null].filter(Boolean).join(' - ') || 'Bill';
      const descParts = [];
      if (r.bill_amount) descParts.push(`Amount: ${r.bill_amount}`);

      let nextDueDate = r.bill_due_date || today;
      if (!r.bill_due_date && r.bill_due_day) {
        const now = new Date();
        let candidate = new Date(now.getFullYear(), now.getMonth(), r.bill_due_day);
        if (candidate < now) candidate = new Date(now.getFullYear(), now.getMonth() + 1, r.bill_due_day);
        nextDueDate = candidate.toISOString().split('T')[0];
      }

      const task = await base44.entities.Task.create({
        name: taskName,
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
      });
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
      // Return the raw extraction so the frontend can show a helpful message
      return Response.json({
        error: 'Could not extract any recognizable content from the image.',
        debug: r
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      extracted: r,
      created_tasks: createdTasks
    });

  } catch (error) {
    console.error('scanAppointment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});