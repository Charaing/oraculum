import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSaju, explainReading, normalizeCustomCount, zodiacPoint, drawTarot, canonicalReading } from '../lib/engines.ts';
test('custom count is an integer so fractional entry cannot trap a spread', () => { assert.equal(normalizeCustomCount(2.5), 2); assert.equal(normalizeCustomCount(-1), 1); assert.equal(normalizeCustomCount(11), 10); assert.equal(normalizeCustomCount('bad'), 1); });
test('same longitude maps card labels and planets to the same zodiac direction', () => { const p = zodiacPoint(15, 100), q = zodiacPoint(45, 100); assert.ok(Math.abs(p[0] - 103.4074) < .001); assert.ok(Math.abs(p[1] - 225.8819) < .001); assert.ok(Math.abs(q[0] - 129.2893) < .001); assert.ok(Math.abs(q[1] - 270.7107) < .001); });
test('saju whitelists input rather than echoing arbitrary extra private fields', () => { const r = calculateSaju({ date: '2000-01-01', time: '12:00', calendar: 'solar', sect: 2, privateNote: 'do not copy' } as any); assert.equal('privateNote' in r.input, false); });
test('daily cycled card rule never falsely describes random reversal', () => { const text = explainReading('tarot', { cards: drawTarot(1, () => 0), spread: 'one', origin: 'daily-cycle' }, 'expert'); assert.ok(text.includes('날짜')); assert.ok(!text.includes('1:1')); });
test('academic and expert explanation levels are meaningfully distinct', () => { const d = { cards: drawTarot(1, () => 0), spread: 'one' }; assert.notEqual(explainReading('tarot', d, 'expert'), explainReading('tarot', d, 'academic')); });
