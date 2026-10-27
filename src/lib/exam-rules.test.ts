import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTimeRemaining } from './exam-rules';

test('calculateTimeRemaining returns normal urgency when more than 5 minutes remain', () => {
  const now = 1000000;
  const deadline = now + 15 * 60 * 1000; // 15 mins
  const result = calculateTimeRemaining(deadline, now, 15 * 60);

  assert.equal(result.isExpired, false);
  assert.equal(result.urgency, 'normal');
  assert.equal(result.minutes, 15);
  assert.equal(result.seconds, 0);
  assert.equal(result.formatted, '15:00');
  assert.equal(result.percentageRemaining, 100);
});

test('calculateTimeRemaining detects low urgency at 5 minutes', () => {
  const now = 1000000;
  const deadline = now + 4 * 60 * 1000 + 30 * 1000; // 4 mins 30s
  const result = calculateTimeRemaining(deadline, now, 10 * 60);

  assert.equal(result.isExpired, false);
  assert.equal(result.urgency, 'low');
  assert.equal(result.isFiveMinutesLeft, true);
  assert.equal(result.formatted, '04:30');
});

test('calculateTimeRemaining detects critical urgency at under 1 minute', () => {
  const now = 1000000;
  const deadline = now + 45 * 1000; // 45 seconds
  const result = calculateTimeRemaining(deadline, now, 10 * 60);

  assert.equal(result.isExpired, false);
  assert.equal(result.urgency, 'critical');
  assert.equal(result.isOneMinuteLeft, true);
  assert.equal(result.formatted, '00:45');
});

test('calculateTimeRemaining detects expired when deadline passes', () => {
  const now = 1000000;
  const deadline = now - 5000; // past deadline
  const result = calculateTimeRemaining(deadline, now, 10 * 60);

  assert.equal(result.isExpired, true);
  assert.equal(result.urgency, 'expired');
  assert.equal(result.totalSeconds, 0);
  assert.equal(result.formatted, '00:00');
  assert.equal(result.percentageRemaining, 0);
});
