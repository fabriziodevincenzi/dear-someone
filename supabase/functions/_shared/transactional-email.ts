import { escapeHtml } from './email-content.ts';

export const TRANSACTIONAL_EMAIL_EVENTS = [
  'unknown_sender',
  'account_verification_required',
  'waitlist_not_open',
  'profile_incomplete',
  'minimum_age_not_met',
  'delivery_paused',
  'account_closed',
  'cadence_limited_free',
  'cadence_limited_daily',
  'letter_body_missing',
  'letter_too_long',
  'attachments_removed',
  'opening_waiting_for_reader',
  'opening_failed',
  'opening_delivered',
  'reply_not_delivered',
  'privacy_request_received',
] as const;

export type TransactionalEmailEvent = typeof TRANSACTIONAL_EMAIL_EVENTS[number];

export type TransactionalEmailInput = {
  eventType: TransactionalEmailEvent;
  payload?: Record<string, unknown>;
  siteUrl?: string;
};

type EmailCopy = {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  action?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

const serif = `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif`;
const sans = `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

export function isTransactionalEmailEvent(value: string): value is TransactionalEmailEvent {
  return (TRANSACTIONAL_EMAIL_EVENTS as readonly string[]).includes(value);
}

export function renderTransactionalEmail(input: TransactionalEmailInput) {
  const siteUrl = (input.siteUrl ?? 'https://onereader.co').replace(/\/+$/, '');
  const copy = emailCopy(input.eventType, input.payload ?? {}, siteUrl);
  const paragraphs = copy.paragraphs
    .map((paragraph) => `<p style="margin:0 0 18px;font-family:${serif};font-size:19px;line-height:1.65;color:#211f1b">${escapeHtml(paragraph)}</p>`)
    .join('');
  const action = copy.action
    ? `<p style="margin:28px 0 0"><a href="${escapeHtml(copy.action.href)}" style="display:inline-block;border:1px solid #211f1b;background:#211f1b;color:#faf7f0;padding:12px 18px;font-family:${sans};font-size:13px;text-decoration:none">${escapeHtml(copy.action.label)}</a></p>`
    : '';
  const secondary = copy.secondary
    ? `<p style="margin:18px 0 0;font-family:${sans};font-size:12px;line-height:1.6"><a href="${escapeHtml(copy.secondary.href)}" style="color:#6c665d;text-decoration:underline">${escapeHtml(copy.secondary.label)}</a></p>`
    : '';

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#e9e2d6;color:#211f1b">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e9e2d6;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#faf7f0;border:1px solid #cec5b7">
          <tr><td style="padding:22px 32px;border-bottom:1px solid #cec5b7;font-family:${sans}">
            <span style="font-family:${serif};font-size:20px">One Reader</span>
            <span style="float:right;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6c665d">A practical note</span>
          </td></tr>
          <tr><td style="padding:40px 32px">
            <h1 style="margin:0 0 28px;font-family:${serif};font-size:34px;font-weight:400;line-height:1.15">${escapeHtml(copy.heading)}</h1>
            ${paragraphs}${action}${secondary}
          </td></tr>
          <tr><td style="padding:22px 32px;border-top:1px solid #cec5b7;font-family:${sans};font-size:12px;line-height:1.6;color:#6c665d">
            This is a service message from One Reader. It contains no tracking pixel.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    copy.heading,
    '',
    ...copy.paragraphs.flatMap((paragraph) => [paragraph, '']),
    ...(copy.action ? [`${copy.action.label}: ${copy.action.href}`, ''] : []),
    ...(copy.secondary ? [`${copy.secondary.label}: ${copy.secondary.href}`, ''] : []),
    'One Reader — this service message contains no tracking pixel.',
  ].join('\n').trim();

  return { subject: copy.subject, html, text };
}

function emailCopy(eventType: TransactionalEmailEvent, payload: Record<string, unknown>, siteUrl: string): EmailCopy {
  const memberUrl = `${siteUrl}/member/`;
  const signupUrl = `${siteUrl}/sign-in/?mode=signup`;
  const signInUrl = `${siteUrl}/sign-in/`;
  const pricingUrl = `${siteUrl}/pricing/`;
  const nextAvailable = formatDate(payload.nextAvailableAt);
  const characterLimit = integer(payload.characterLimit, 50_000).toLocaleString('en-GB');

  switch (eventType) {
    case 'unknown_sender':
      return {
        subject: 'Register before sending a letter',
        preheader: 'No account was created and your letter was not kept.',
        heading: 'First, make a place for your letter.',
        paragraphs: [
          'This address is not connected to a One Reader account. We did not create an account for you, and we did not keep or forward the text of your letter.',
          'Register explicitly, complete your profile, then send a new letter when writing is available.',
        ],
        action: { label: 'Register for One Reader', href: signupUrl },
      };
    case 'account_verification_required':
      return {
        subject: 'Verify your email before writing',
        preheader: 'Your letter was not sent.',
        heading: 'Your email still needs verifying.',
        paragraphs: ['We did not keep or forward this letter. Verify your address, then send it again from the same inbox.'],
        action: { label: 'Verify or request a new link', href: signInUrl },
      };
    case 'waitlist_not_open':
      return {
        subject: 'Your place is saved',
        preheader: 'Writing has not opened for your group yet.',
        heading: 'Writing will open with your group.',
        paragraphs: [
          'Your waitlist place is safe, but this letter was not kept or forwarded.',
          'We will write when your founding season opens. Then you can send a new letter.',
        ],
        action: { label: 'View your account', href: memberUrl },
      };
    case 'profile_incomplete':
      return {
        subject: 'Complete your profile before writing',
        preheader: 'Your letter was not sent.',
        heading: 'A few details are still missing.',
        paragraphs: [
          'One Reader needs your birth month and year, languages, and receiving preference before it can choose an appropriate reader.',
          'This letter was not kept or forwarded. Complete your profile, then send it again.',
        ],
        action: { label: 'Complete your profile', href: `${memberUrl}#profile` },
      };
    case 'minimum_age_not_met':
      return {
        subject: 'One Reader is available from age 14',
        preheader: 'Your letter was not stored or sent.',
        heading: 'You cannot use One Reader yet.',
        paragraphs: [
          'One Reader is available to people aged 14 and over. We did not keep or forward the text of your letter.',
          'Your birth month and year remain part of your account record and can only be corrected through a privacy request.',
        ],
        action: { label: 'View your privacy choices', href: `${memberUrl}#privacy` },
      };
    case 'delivery_paused':
      return {
        subject: 'Writing is paused for this account',
        preheader: 'Check your inbox status before sending again.',
        heading: 'Your mailbox needs reactivating.',
        paragraphs: ['This letter was not forwarded. Verify that this inbox can receive One Reader mail, reactivate delivery, then send a new letter.'],
        action: { label: 'Review mailbox settings', href: `${memberUrl}#mailbox` },
      };
    case 'account_closed':
      return {
        subject: 'This One Reader account is closed',
        preheader: 'Your letter was not sent.',
        heading: 'There is no active account for this address.',
        paragraphs: ['We did not keep or forward this letter. If you believe the account was closed by mistake, contact One Reader from the website.'],
        action: { label: 'Visit One Reader', href: siteUrl },
      };
    case 'cadence_limited_free':
      if (payload.membershipRequired === true) {
        return {
          subject: 'Your first letter has been sent',
          preheader: 'Annual membership opens a new correspondence every 24 hours.',
          heading: 'Your first opening has been used.',
          paragraphs: [
            'This new letter was not kept or forwarded. Your Free account remains active: you can receive letters and reply to every open conversation.',
            'Annual membership is €18/year and lets you begin a new correspondence every 24 hours.',
          ],
          action: { label: 'Become a member', href: pricingUrl },
          secondary: { label: 'View your account', href: memberUrl },
        };
      }
      if (payload.upgradeReminder === true) {
        return {
          subject: 'Write more often when you are ready',
          preheader: 'Your Free account is still active; annual membership is there when you want it.',
          heading: 'The next letter can wait. Or not.',
          paragraphs: [
            `Your Free membership can begin another correspondence ${nextAvailable}. This letter was not kept or forwarded.`,
            'Your account stays active, and every open conversation can continue. If you would like to write again sooner, annual membership opens a new correspondence every 24 hours.',
          ],
          action: { label: 'See annual membership', href: pricingUrl },
          secondary: { label: 'View your account', href: memberUrl },
        };
      }
      return {
        subject: `You can begin another letter ${nextAvailable}`,
        preheader: 'Your new letter was not sent.',
        heading: 'This new letter is too soon.',
        paragraphs: [
          `Your Free membership can begin another correspondence ${nextAvailable}. This letter was not kept or forwarded.`,
          'Until then, you can still receive letters and continue every open correspondence. Replies never use your opening allowance.',
        ],
        action: { label: 'View your account', href: memberUrl },
        secondary: { label: 'See annual membership', href: pricingUrl },
      };
    case 'cadence_limited_daily':
      return {
        subject: `You can begin another letter ${nextAvailable}`,
        preheader: 'The 24-hour interval has not finished yet.',
        heading: 'Your next opening is nearly available.',
        paragraphs: [
          `You can begin a new correspondence ${nextAvailable}. This letter was not kept or forwarded.`,
          'You can still receive letters and continue every open correspondence in the meantime.',
        ],
        action: { label: 'View your account', href: memberUrl },
      };
    case 'letter_body_missing':
      return {
        subject: 'Put your letter in the body of the email',
        preheader: 'Here, only the words travel.',
        heading: 'We could not find a letter to send.',
        paragraphs: ['Attachments do not travel through One Reader. Write or paste the words into the email body, then send the message again.'],
      };
    case 'letter_too_long':
      return {
        subject: 'Your letter is too long to send',
        preheader: `The current limit is ${characterLimit} characters.`,
        heading: 'Please make this letter a little shorter.',
        paragraphs: [`The current limit is ${characterLimit} characters. We did not truncate, keep, or forward your letter. Shorten it and send it again.`],
      };
    case 'attachments_removed':
      return {
        subject: 'Your letter travelled without its attachments',
        preheader: 'The text was accepted; files were removed.',
        heading: 'Here, only the words travel.',
        paragraphs: ['Your text was accepted. Images and files were removed before delivery and were not shared with the other reader.'],
      };
    case 'opening_waiting_for_reader':
      return {
        subject: 'We are looking for the right reader',
        preheader: 'Your letter is still waiting safely.',
        heading: 'Your letter is waiting for one reader.',
        paragraphs: [
          'No suitable reader was available on the first attempt. Your letter remains encrypted while we try again, and it will be delivered no more than once.',
          'We will write again only when it is delivered or if no reader can be found.',
        ],
      };
    case 'opening_failed':
      return {
        subject: 'Your letter could not be delivered',
        preheader: 'The attempt is now closed.',
        heading: 'This letter did not reach a reader.',
        paragraphs: [
          'The delivery attempt is closed and the letter will not be sent later without you knowing.',
          'You may write again. A failed delivery does not intentionally use your allowance.',
        ],
      };
    case 'opening_delivered':
      return {
        subject: 'Your letter has reached one reader',
        preheader: 'It was delivered once, without revealing either address.',
        heading: 'Your letter has found its reader.',
        paragraphs: [
          'It was delivered to one eligible person. Both real email addresses remain hidden.',
          'There is nothing else to do. If they reply, the answer will arrive in this inbox.',
        ],
      };
    case 'reply_not_delivered':
      return {
        subject: 'Your reply could not be delivered',
        preheader: 'This private correspondence is no longer available.',
        heading: 'This reply did not travel.',
        paragraphs: [
          'The private correspondence is closed or no longer accepts messages. We did not forward your reply.',
          'For privacy, One Reader cannot share more information about the other person or the reason the correspondence ended.',
        ],
      };
    case 'privacy_request_received': {
      const requestType = readableRequestType(string(payload.requestType));
      const requestId = string(payload.requestId) || 'not available';
      return {
        subject: 'We received your privacy request',
        preheader: `Reference ${requestId}`,
        heading: 'Your request is recorded.',
        paragraphs: [
          `Request: ${requestType}. Reference: ${requestId}.`,
          'You can follow its status in your account. We will contact you if identity verification or more information is needed.',
        ],
        action: { label: 'View privacy requests', href: `${memberUrl}#privacy` },
      };
    }
  }
}

function formatDate(value: unknown) {
  const parsed = new Date(string(value));
  if (Number.isNaN(parsed.getTime())) return 'when your current interval ends';
  return `${new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(parsed)} UTC`;
}

function readableRequestType(value: string) {
  if (value === 'access') return 'copy of your data';
  if (value === 'rectification') return 'correction of your data';
  if (value === 'deletion') return 'deletion of your account and data';
  return 'privacy request';
}

function string(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function integer(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : fallback;
}
