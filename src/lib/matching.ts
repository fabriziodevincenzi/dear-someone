export type LanguageLevel = 'basic' | 'good' | 'fluent' | 'native';

export interface LanguageAbility {
  code: string;
  level: LanguageLevel;
  willingToWrite: boolean;
  willingToRead: boolean;
}

export interface MatchingMember {
  id: string;
  adult: boolean;
  active: boolean;
  availableToReceive: boolean;
  receivedLast30Days: number;
  blockedMemberIds: string[];
  languages: LanguageAbility[];
}

const writableLevels: LanguageLevel[] = ['good', 'fluent', 'native'];

export function hasCompatibleLanguage(sender: MatchingMember, candidate: MatchingMember) {
  return sender.languages.some((senderLanguage) =>
    candidate.languages.some(
      (candidateLanguage) =>
        senderLanguage.code === candidateLanguage.code &&
        writableLevels.includes(senderLanguage.level) &&
        writableLevels.includes(candidateLanguage.level) &&
        senderLanguage.willingToWrite &&
        candidateLanguage.willingToRead,
    ),
  );
}

export function isEligibleCandidate(sender: MatchingMember, candidate: MatchingMember, recentPairIds: string[] = []) {
  return (
    sender.id !== candidate.id &&
    candidate.adult &&
    candidate.active &&
    candidate.availableToReceive &&
    !sender.blockedMemberIds.includes(candidate.id) &&
    !candidate.blockedMemberIds.includes(sender.id) &&
    !recentPairIds.includes(candidate.id) &&
    hasCompatibleLanguage(sender, candidate)
  );
}

export function weightedRandomCandidate<T extends MatchingMember>(candidates: T[], random = Math.random) {
  if (candidates.length === 0) return undefined;

  const weights = candidates.map((candidate) => 1 / (1 + Math.max(0, candidate.receivedLast30Days)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * totalWeight;

  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return candidates[index];
  }

  return candidates.at(-1);
}
