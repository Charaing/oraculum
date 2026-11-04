import test from 'node:test';
import assert from 'node:assert/strict';
import { makePendingReading, parsePendingReading } from '../lib/pending.ts';
const record = { kind: 'tarot', title: 'guest card', data: { cards: [{ card: { id: 'major-17' }, reversed: true }], spread: 'one' } };
test('guest random result survives login handoff unchanged and expires', () => { const text = makePendingReading(record, 100); const restored = parsePendingReading(text, 101); assert.equal(restored.data.cards[0].card.id, 'major-17'); assert.equal(restored.data.cards[0].reversed, true); assert.throws(() => parsePendingReading(text, 100 + 31 * 60000)); assert.throws(() => parsePendingReading('{invalid}', 101)); });
