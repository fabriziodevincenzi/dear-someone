import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import {
  isTransactionalEmailEvent,
  type TransactionalEmailEvent,
} from './transactional-email.ts';

export type EnqueueTransactionalEmailInput = {
  eventType: TransactionalEmailEvent;
  recipientEmail: string;
  dedupeKey: string;
  memberId?: string | null;
  letterId?: string | null;
  correspondenceId?: string | null;
  payload?: Record<string, unknown>;
  availableAt?: string;
};

export async function enqueueTransactionalEmail(
  admin: SupabaseClient,
  input: EnqueueTransactionalEmailInput,
) {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const dedupeKey = input.dedupeKey.trim();
  if (!isTransactionalEmailEvent(input.eventType)) throw new Error('Unsupported transactional email event');
  if (!recipientEmail || !recipientEmail.includes('@')) throw new Error('Transactional email recipient is invalid');
  if (!dedupeKey) throw new Error('Transactional email dedupe key is required');

  const { error } = await admin
    .from('transactional_email_outbox')
    .upsert({
      event_type: input.eventType,
      recipient_email: recipientEmail,
      member_id: input.memberId ?? null,
      letter_id: input.letterId ?? null,
      correspondence_id: input.correspondenceId ?? null,
      dedupe_key: dedupeKey,
      payload: input.payload ?? {},
      available_at: input.availableAt ?? new Date().toISOString(),
    }, { onConflict: 'dedupe_key', ignoreDuplicates: true });
  if (error) throw error;
}
