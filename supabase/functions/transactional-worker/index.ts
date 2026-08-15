import { Resend } from 'npm:resend@6.18.1';
import {
  isTransactionalEmailEvent,
  renderTransactionalEmail,
  type TransactionalEmailEvent,
} from '../_shared/transactional-email.ts';
import { createAdminClient, errorMessage, jsonResponse, requireEnvironment } from '../_shared/runtime.ts';

type TransactionalEmailJob = {
  id: string;
  event_type: string;
  recipient_email: string;
  payload: Record<string, unknown>;
  attempts: number;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  if (!authorized(request)) return jsonResponse({ error: 'Unauthorized' }, 401);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('claim_transactional_emails', { p_limit: 10 });
  if (error) return jsonResponse({ error: error.message }, 500);

  let previewed = 0;
  let sent = 0;
  let retried = 0;
  for (const job of (data ?? []) as TransactionalEmailJob[]) {
    try {
      const result = await processTransactionalEmail(job);
      if (result === 'previewed') previewed += 1;
      else sent += 1;
    } catch (error) {
      const message = errorMessage(error);
      console.error('Transactional email failed', { id: job.id, message });
      const { error: retryError } = await admin.rpc('retry_transactional_email', {
        p_email_id: job.id,
        p_error: message,
        p_delay_seconds: retryDelay(job.attempts),
        p_max_attempts: 8,
      });
      if (retryError) console.error('Could not schedule transactional retry', retryError);
      retried += 1;
    }
  }

  return jsonResponse({ ok: true, claimed: data?.length ?? 0, previewed, sent, retried });
});

async function processTransactionalEmail(job: TransactionalEmailJob): Promise<'previewed' | 'sent'> {
  if (!isTransactionalEmailEvent(job.event_type)) throw new Error(`Unsupported transactional event: ${job.event_type}`);
  const eventType = job.event_type as TransactionalEmailEvent;
  const rendered = renderTransactionalEmail({
    eventType,
    payload: job.payload ?? {},
    siteUrl: Deno.env.get('SITE_URL') ?? 'https://onereader.co',
  });
  const mode = (Deno.env.get('TRANSACTIONAL_EMAIL_MODE') ?? 'preview').trim().toLowerCase();
  let providerId: string | null = null;
  const preview = mode !== 'resend';

  if (!preview) {
    const resend = new Resend(requireEnvironment('RESEND_API_KEY'));
    const { data, error } = await resend.emails.send({
      from: Deno.env.get('SERVICE_FROM_ADDRESS') ?? 'One Reader <letters@onereader.co>',
      to: job.recipient_email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-One-Reader-Event': eventType,
      },
    }, { idempotencyKey: `transactional/${job.id}` });
    if (error || !data?.id) throw new Error(error?.message ?? 'The provider did not accept the email');
    providerId = data.id;
  }

  const { error } = await createAdminClient().rpc('complete_transactional_email', {
    p_email_id: job.id,
    p_provider_outbound_id: providerId,
    p_rendered_subject: rendered.subject,
    p_rendered_html: rendered.html,
    p_rendered_text: rendered.text,
    p_preview: preview,
  });
  if (error) throw error;
  return preview ? 'previewed' : 'sent';
}

function authorized(request: Request) {
  const secret = Deno.env.get('WORKER_SECRET');
  return Boolean(secret && request.headers.get('Authorization') === `Bearer ${secret}`);
}

function retryDelay(attempts: number) {
  return Math.min(3600, 30 * 2 ** Math.max(0, attempts - 1));
}
