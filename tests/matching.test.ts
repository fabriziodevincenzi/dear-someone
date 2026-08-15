import assert from 'node:assert/strict';
import test from 'node:test';
import { hasCompatibleLanguage, isEligibleCandidate, weightedRandomCandidate } from '../src/lib/matching.ts';

const member = (overrides: Record<string, unknown> = {}) => ({
  id: 'member-a',
  agePool: 'adult' as const,
  ageEligible: true,
  active: true,
  availableToReceive: true,
  receivedLast30Days: 0,
  blockedMemberIds: [],
  languages: [{ code: 'en', level: 'fluent' as const, willingToWrite: true, willingToRead: true }],
  ...overrides,
});

test('requires a compatible writable and readable language', () => {
  assert.equal(hasCompatibleLanguage(member(), member({ id: 'member-b' })), true);
  assert.equal(hasCompatibleLanguage(member(), member({
    id: 'member-b',
    languages: [{ code: 'en', level: 'basic', willingToWrite: true, willingToRead: true }],
  })), false);
});

test('rejects self matches, blocks, unavailable members and recent pairs', () => {
  const sender = member();
  assert.equal(isEligibleCandidate(sender, sender), false);
  assert.equal(isEligibleCandidate(sender, member({ id: 'member-b', availableToReceive: false })), false);
  assert.equal(isEligibleCandidate(member({ blockedMemberIds: ['member-b'] }), member({ id: 'member-b' })), false);
  assert.equal(isEligibleCandidate(sender, member({ id: 'member-b' }), ['member-b']), false);
});

test('keeps 14–17 and adult members in separate pools', () => {
  const adult = member({ id: 'adult', agePool: 'adult' });
  const minor = member({ id: 'minor', agePool: 'minor' });
  const minorPeer = member({ id: 'minor-peer', agePool: 'minor' });
  assert.equal(isEligibleCandidate(adult, minor), false);
  assert.equal(isEligibleCandidate(minor, adult), false);
  assert.equal(isEligibleCandidate(minor, minorPeer), true);
  assert.equal(isEligibleCandidate(minor, member({ id: 'too-young', agePool: 'minor', ageEligible: false })), false);
});

test('inverse-frequency selection gives a larger interval to less-used readers', () => {
  const fresh = member({ id: 'fresh', receivedLast30Days: 0 });
  const busy = member({ id: 'busy', receivedLast30Days: 3 });
  assert.equal(weightedRandomCandidate([fresh, busy], () => 0.1)?.id, 'fresh');
  assert.equal(weightedRandomCandidate([fresh, busy], () => 0.95)?.id, 'busy');
});
