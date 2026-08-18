import { Resend } from 'npm:resend@6.18.1';
import { createAdminClient, errorMessage, jsonResponse, requireEnvironment } from '../_shared/runtime.ts';
import { enqueueTransactionalEmail } from '../_shared/transactional-outbox.ts';

type ResendWebhookEvent = {
  type: string;
  data?: {
    email_id?: string;
    reason?: string;
  };
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const payload = await request.text();
    const webhookId = request.headers.get('svix-id');
    const webhookTimestamp = request.headers.get('svix-timestamp');
    const webhookSignature = request.headers.get('svix-signature');
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return jsonResponse({ error: 'Missing webhook signature' }, 401);
    }

    const resend = new Resend(requireEnvironment('RESEND_API_KEY'));
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: webhookId,
        timestamp: webhookTimestamp,
        signature: webhookSignature,
      },
      webhookSecret: requireEnvironment('RESEND_WEBHOOK_SECRET'),
    }) as ResendWebhookEvent;

    const admin = createAdminClient();
    const providerEmailId = event.data?.email_id ?? null;
    const { data: storedEvent, error: eventError } = await admin
      .from('email_provider_events')
      .insert({
        provider: 'resend',
        provider_event_id: webhookId,
        provider_email_id: providerEmailId,
        event_type: event.type,
      })
      .select('id')
      .single();

    if (eventError?.code === '23505') {
      // Resend replays keep the original svix-id. Treat a replay of a received
      // email as a request to resume its internal job instead of discarding it
      // as an ordinary duplicate webhook.
      if (event.type === 'email.received' && providerEmailId) {
        const { data: existingEvent, error: existingEventError } = await admin
          .from('email_provider_events')
          .select('id, status')
          .eq('provider_event_id', webhookId)
          .maybeSingle();
        if (existingEventError) throw existingEventError;

        if (existingEvent && existingEvent.status !== 'processed') {
          const { data: existingJob, error: existingJobError } = await admin
            .from('mail_jobs')
            .select('id, status')
            .eq('provider_event_id', existingEvent.id)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (existingJobError) throw existingJobError;

          if (existingJob && existingJob.status !== 'completed') {
            const { error: retryError } = await admin.rpc('retry_mail_job', {
              p_job_id: existingJob.id,
              p_error: 'Webhook replay requested',
              p_delay_seconds: 1,
              p_max_attempts: 8,
            });
            if (retryError) throw retryError;

            await admin
              .from('email_provider_events')
              .update({ status: 'queued', processed_at: null })
              .eq('id', existingEvent.id);
            kickMailWorker(1200);
            return jsonResponse({ ok: true, replayed: true });
          }
        }
      }

      return jsonResponse({ ok: true, duplicate: true });
    }
    if (eventError || !storedEvent) throw eventError ?? new Error('Could not record webhook event');

    if (event.type === 'email.received' && providerEmailId) {
      const { error: queueError } = await admin.from('mail_jobs').insert({
        kind: 'process_inbound',
        provider_event_id: storedEvent.id,
        payload: { provider_email_id: providerEmailId },
      });
      if (queueError) throw queueError;

      await admin
        .from('email_provider_events')
        .update({ status: 'queued' })
        .eq('id', storedEvent.id);

      kickMailWorker();
    } else if (event.type === 'email.delivered' && providerEmailId) {
      const { error } = await admin.rpc('record_provider_delivery', {
        p_provider_outbound_id: providerEmailId,
      });
      if (error) throw error;
      await enqueueDeliveryOutcome(admin, providerEmailId, true);
      await markProcessed(admin, storedEvent.id);
    } else if (event.type === 'email.bounced' && providerEmailId) {
      const { error } = await admin.rpc('record_provider_bounce', {
        p_provider_outbound_id: providerEmailId,
        p_reason: event.data?.reason ?? 'Delivery bounced',
      });
      if (error) throw error;
      await enqueueDeliveryOutcome(admin, providerEmailId, false);
      await markProcessed(admin, storedEvent.id);
    } else {
      await admin
        .from('email_provider_events')
        .update({ status: 'ignored', processed_at: new Date().toISOString() })
        .eq('id', storedEvent.id);
    }

    kickTransactionalWorker();

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('Resend webhook failed', error);
    return jsonResponse({ error: errorMessage(error) }, 400);
  }
});

async function markProcessed(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { error } = await admin
    .from('email_provider_events')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function enqueueDeliveryOutcome(
  admin: ReturnType<typeof createAdminClient>,
  providerEmailId: string,
  delivered: boolean,
) {
  const { data: letter, error } = await admin
    .from('letters')
    .select('id, correspondence_id, sender_id, kind')
    .eq('provider_outbound_id', providerEmailId)
    .maybeSingle();
  if (error) throw error;
  if (!letter) return;

  const { data: sender, error: senderError } = await admin
    .from('profiles')
    .select('email_address')
    .eq('id', letter.sender_id)
    .maybeSingle();
  if (senderError) throw senderError;
  if (!sender?.email_address) return;

  const eventType = delivered && letter.kind === 'opening'
    ? 'opening_delivered'
    : delivered
    ? null
    : letter.kind === 'opening'
    ? 'opening_failed'
    : 'reply_not_delivered';
  if (!eventType) return;

  await enqueueTransactionalEmail(admin, {
    eventType,
    recipientEmail: sender.email_address,
    memberId: letter.sender_id,
    letterId: letter.id,
    correspondenceId: letter.correspondence_id,
    dedupeKey: `${eventType}/${letter.id}`,
  });
}

function kickTransactionalWorker() {
  const secret = Deno.env.get('WORKER_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!secret || !supabaseUrl) return;
  EdgeRuntime.waitUntil(fetch(`${supabaseUrl}/functions/v1/transactional-worker`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  }).catch(() => undefined));
}

function kickMailWorker(delayMs = 0) {
  const secret = Deno.env.get('WORKER_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!secret || !supabaseUrl) return;
  EdgeRuntime.waitUntil((async () => {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    await fetch(`${supabaseUrl}/functions/v1/mail-worker`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    }).catch(() => undefined);
  })());
}
