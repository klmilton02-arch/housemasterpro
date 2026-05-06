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

    // Step 1: Detect content type and extract all relevant data in one LLM call
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this image and extract ALL information from it. The image may contain one or more of:
1. An appointment reminder (doctor/dentist/service appointment card or note)
2. A bill or invoice (utility, phone, insurance, subscription, etc.)
3. A handwritten task list or to-do items

Return a JSON object with the following structure:
{
  "content_types": ["appointment", "bill", "tasks"] (include only detected types),
  "appointment": {
    "name": "appointment name or doctor/provider name",
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM 24h format or null",
    "location": "location or null",
    "notes": "any extra notes or null"
  },
  "bill": {
    "bill_type": "type of bill e.g. Electric, Water, Phone, Internet, Insurance, etc.",
    "due_day_of_month": number (1-28) or null,
    "due_date": "YYYY-MM-DD full date if found, or null",
    "amount": "dollar amount as string or null",
    "provider": "company/provider name or null",
    "notes": "any extra notes or null"
  },
  "tasks": [
    { "name": "task name", "notes": "any extra details or null" }
  ]
}

Only include the fields relevant to detected content types. For tasks, extract each individual task/to-do item as a separate entry.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          content_types: { type: 'array', items: { type: 'string' } },
          appointment: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              date: { type: 'string' },
              time: { type: 'string' },
              location: { type: 'string' },
              notes: { type: 'string' }
            }
          },
          bill: {
            type: 'object',
            properties: {
              bill_type: { type: 'string' },
              due_day_of_month: { type: 'number' },
              due_date: { type: 'string' },
              amount: { type: 'string' },
              provider: { type: 'string' },
              notes: { type: 'string' }
            }
          },
          tasks: {
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

    const contentTypes = extractionResult.content_types || [];
    const createdTasks = [];
    const today = new Date().toISOString().split('T')[0];

    // Process appointment
    if (contentTypes.includes('appointment') && extractionResult.appointment) {
      const appt = extractionResult.appointment;
      const taskName = appt.name ? `Appointment: ${appt.name}` : 'Appointment';
      const description = [
        appt.time ? `Time: ${appt.time}` : null,
        appt.location ? `Location: ${appt.location}` : null,
        appt.notes || null
      ].filter(Boolean).join(' | ');

      const taskData = {
        name: taskName,
        category: 'Personal',
        priority: 'Medium',
        difficulty: 'Easy',
        frequency_days: 9999,
        overdue_grace_days: 999,
        next_due_date: appt.date || today,
        start_date: appt.date || today,
        status: 'Pending',
        description: description || undefined,
        family_group_id: user.family_group_id || null
      };

      const task = await base44.entities.Task.create(taskData);
      createdTasks.push({ type: 'appointment', task });

      // Sync to Google Calendar
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        const calBody = {
          summary: taskName,
          description: description || undefined,
          start: appt.time
            ? { dateTime: `${appt.date}T${appt.time}:00`, timeZone: 'America/Los_Angeles' }
            : { date: appt.date || today },
          end: appt.time
            ? { dateTime: `${appt.date}T${appt.time}:00`, timeZone: 'America/Los_Angeles' }
            : { date: appt.date || today }
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
        console.error('Calendar sync failed:', calErr);
      }
    }

    // Process bill
    if (contentTypes.includes('bill') && extractionResult.bill) {
      const bill = extractionResult.bill;
      const taskName = [bill.provider, bill.bill_type ? `${bill.bill_type} Bill` : 'Bill'].filter(Boolean).join(' - ');
      const description = [
        bill.amount ? `Amount: ${bill.amount}` : null,
        bill.notes || null
      ].filter(Boolean).join(' | ');

      // Determine due date: prefer full due_date, fall back to day of month
      let nextDueDate = bill.due_date || today;
      if (!bill.due_date && bill.due_day_of_month) {
        const now = new Date();
        let candidate = new Date(now.getFullYear(), now.getMonth(), bill.due_day_of_month);
        if (candidate < now) candidate = new Date(now.getFullYear(), now.getMonth() + 1, bill.due_day_of_month);
        nextDueDate = candidate.toISOString().split('T')[0];
      }

      const taskData = {
        name: taskName,
        category: 'Bills',
        priority: 'Medium',
        difficulty: 'Easy',
        frequency_days: 30,
        bill_day_of_month: bill.due_day_of_month || undefined,
        next_due_date: nextDueDate,
        start_date: nextDueDate,
        status: 'Pending',
        description: description || undefined,
        family_group_id: user.family_group_id || null
      };

      const task = await base44.entities.Task.create(taskData);
      createdTasks.push({ type: 'bill', task });
    }

    // Process handwritten tasks
    if (contentTypes.includes('tasks') && Array.isArray(extractionResult.tasks)) {
      for (const item of extractionResult.tasks) {
        if (!item.name) continue;
        const taskData = {
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
        };
        const task = await base44.entities.Task.create(taskData);
        createdTasks.push({ type: 'task', task });
      }
    }

    if (createdTasks.length === 0) {
      return Response.json({ error: 'Could not extract any recognizable content from the image.' }, { status: 400 });
    }

    return Response.json({
      success: true,
      content_types: contentTypes,
      extracted: extractionResult,
      created_tasks: createdTasks
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});