export const mailboxActivityPolicy = {
  maxUnredeemedMagicLinks: 3,
  inactiveAfterDays: 30,
} as const;

export type MailboxEligibility = 'eligible' | 'pending-verification' | 'paused';

export const mailboxRecoveryPaths = [
  'redeem-a-new-magic-link',
  'reply-from-the-verified-conversation-alias',
  'change-email-from-an-authenticated-session',
] as const;

export interface MailboxActivity {
  emailVerified: boolean;
  consecutiveUnredeemedMagicLinks: number;
  lastMagicLinkRedeemedAt: Date | null;
  lastMeaningfulEmailActivityAt: Date | null;
}

export function mailboxEligibility(activity: MailboxActivity, now = new Date()): MailboxEligibility {
  if (!activity.emailVerified) return 'pending-verification';

  const lastActivity = latestDate(activity.lastMagicLinkRedeemedAt, activity.lastMeaningfulEmailActivityAt);
  const inactiveDays = lastActivity ? daysBetween(lastActivity, now) : Number.POSITIVE_INFINITY;

  if (
    activity.consecutiveUnredeemedMagicLinks >= mailboxActivityPolicy.maxUnredeemedMagicLinks &&
    inactiveDays >= mailboxActivityPolicy.inactiveAfterDays
  ) {
    return 'paused';
  }

  return 'eligible';
}

export function canReceiveNewLetter(activity: MailboxActivity, now = new Date()) {
  return mailboxEligibility(activity, now) === 'eligible';
}

function latestDate(...dates: Array<Date | null>) {
  return dates.filter((date): date is Date => date !== null).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
}

function daysBetween(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}
