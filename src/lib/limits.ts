export type MembershipPlan = 'free' | 'annual' | 'founding-season';
export type OpeningStatus = 'available' | 'queued';

const planIntervalsMs: Record<MembershipPlan, number> = {
  free: 90 * 24 * 60 * 60 * 1000,
  annual: 24 * 60 * 60 * 1000,
  'founding-season': 24 * 60 * 60 * 1000,
};

export function nextCorrespondenceAt(plan: MembershipPlan, lastOpenedAt: Date, now = new Date()) {
  const next = new Date(lastOpenedAt.getTime() + planIntervalsMs[plan]);
  return next > now ? next : now;
}

export function canOpenCorrespondence(plan: MembershipPlan, lastOpenedAt: Date | null, now = new Date()) {
  return lastOpenedAt === null || nextCorrespondenceAt(plan, lastOpenedAt, now).getTime() <= now.getTime();
}

export function correspondenceOpeningDecision(plan: MembershipPlan, lastOpenedAt: Date | null, now = new Date()) {
  if (canOpenCorrespondence(plan, lastOpenedAt, now)) {
    return {
      status: 'available' as const,
      nextAvailableAt: now,
      shouldInviteUpgrade: false,
    };
  }

  return {
    status: 'queued' as const,
    nextAvailableAt: nextCorrespondenceAt(plan, lastOpenedAt as Date, now),
    shouldInviteUpgrade: plan === 'free',
  };
}
