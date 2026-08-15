import { escapeHtml } from './email-content.ts';

export type LetterTemplateInput = {
  body: string;
  subject: string;
  isReply: boolean;
  attachmentsRemoved: boolean;
  stopUrl: string;
  reportUrl: string;
};

const serif = `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif`;
const sans = `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

export function renderLetterEmail(input: LetterTemplateInput) {
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 22px;font-family:${serif};font-size:20px;line-height:1.65;font-style:italic;color:#211f1b;white-space:pre-wrap">${escapeHtml(paragraph)}</p>`)
    .join('');
  const attachmentNote = input.attachmentsRemoved
    ? '<p style="margin:24px 0 0;padding-top:18px;border-top:1px solid #cec5b7;font:12px/1.6 Inter,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#6c665d">Attachments were removed before delivery. Here, only the words travel.</p>'
    : '';

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#e9e2d6;color:#211f1b">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.body.slice(0, 120))}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e9e2d6;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#faf7f0;border:1px solid #cec5b7">
          <tr><td style="padding:22px 32px;border-bottom:1px solid #cec5b7;font-family:${sans}">
            <span style="font-family:${serif};font-size:20px">One Reader</span>
            <span style="float:right;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6c665d">${input.isReply ? 'A reply' : 'A letter for you'}</span>
          </td></tr>
          <tr><td style="padding:40px 32px">
            <h1 style="margin:0 0 30px;font-family:${serif};font-size:36px;font-weight:400;line-height:1.1">${escapeHtml(input.subject)}</h1>
            ${paragraphs}
            ${attachmentNote}
          </td></tr>
          <tr><td style="padding:22px 32px;border-top:1px solid #cec5b7;font-family:${sans};font-size:12px;line-height:1.6;color:#6c665d">
            <p style="margin:0">Reply directly from this inbox. Both real addresses remain hidden. The private reply address closes 30 days after the last exchange.</p>
            <p style="margin:14px 0 0"><a href="${escapeHtml(input.stopUrl)}" style="color:#6c665d;text-decoration:underline">End this correspondence</a><span aria-hidden="true"> · </span><a href="${escapeHtml(input.reportUrl)}" style="color:#6c665d;text-decoration:underline">Report this message</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    input.subject,
    '',
    input.body,
    ...(input.attachmentsRemoved ? ['', 'Attachments were removed before delivery. Here, only the words travel.'] : []),
    '',
    'Reply directly from this inbox. Both real addresses remain hidden.',
    '',
    `End this correspondence: ${input.stopUrl}`,
    `Report this message: ${input.reportUrl}`,
  ].join('\n');

  return { html, text };
}

export function renderAttachmentNotice() {
  return {
    subject: 'Your letter travelled without its attachments',
    html: `<p style="font-family:${serif};font-size:19px;line-height:1.6;color:#211f1b">Your text was accepted. Images and files were not delivered — here, only the words travel.</p>`,
    text: 'Your text was accepted. Images and files were not delivered — here, only the words travel.',
  };
}
